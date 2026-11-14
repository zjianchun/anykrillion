#!/usr/bin/env python3
"""
scripts/setup_infra.py — Full Cloudflare + GitHub Pages + Spaceship DNS Automation
for anykrillion.com.

Reads credentials strictly from /Users/echo/DataAnalytics/ (or env overrides):
  - /Users/echo/DataAnalytics/cloudflare_token.json
  - /Users/echo/DataAnalytics/spaceship_token.json

Usage:
  python3 scripts/setup_infra.py
  python3 scripts/setup_infra.py --spaceship-only
  python3 scripts/setup_infra.py --dry-run
"""

from __future__ import annotations

import argparse
import json
import os
import sys
import urllib.error
import urllib.request
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

DOMAIN = "anykrillion.com"
WWW_DOMAIN = f"www.{DOMAIN}"
PAGES_PROJECT = "anykrillion"
SPACESHIP_ACCOUNT = "emoq"
GITHUB_REPO = "zjianchun/anykrillion"
DEFAULT_BRANCH = "main"
BUILD_COMMAND = "pnpm run build"
DESTINATION_DIR = "out"
ACCOUNT_ID = os.environ.get("CLOUDFLARE_ACCOUNT_ID", "c572a536333be81c5228aee8164dc725")

CF_CREDS_FILE = Path("/Users/echo/DataAnalytics/cloudflare_token.json")
SPACESHIP_CREDS_FILE = Path("/Users/echo/DataAnalytics/spaceship_token.json")


def load_cf_tokens() -> Dict[str, str]:
    data: Dict[str, Any] = {}
    if CF_CREDS_FILE.exists():
        data = json.loads(CF_CREDS_FILE.read_text(encoding="utf-8"))
    zone_dns_token = os.environ.get("CLOUDFLARE_API_TOKEN") or data.get("token", "")
    pages_token = os.environ.get("CLOUDFLARE_PAGES_TOKEN") or data.get("pages_token") or zone_dns_token
    zone_create_token = data.get("zone_create_token") or zone_dns_token
    if not (zone_dns_token and pages_token and zone_create_token):
        raise RuntimeError(f"Missing Cloudflare tokens in {CF_CREDS_FILE} or environment.")
    return {
        "dns": zone_dns_token.strip(),
        "pages": pages_token.strip(),
        "zone_create": zone_create_token.strip(),
    }


def load_spaceship_creds(
    account: str = SPACESHIP_ACCOUNT,
    domain: str = DOMAIN,
) -> Tuple[str, str]:
    env_key = os.environ.get("SPACESHIP_API_KEY", "").strip()
    env_secret = os.environ.get("SPACESHIP_API_SECRET", "").strip()
    if env_key and env_secret:
        return env_key, env_secret

    data: Dict[str, Any] = {}
    if SPACESHIP_CREDS_FILE.exists():
        data = json.loads(SPACESHIP_CREDS_FILE.read_text(encoding="utf-8"))

    accounts = data.get("accounts") or {}
    mapped_account = (data.get("domain_account_map") or {}).get(domain)
    resolved_name = account or mapped_account or data.get("default_account") or ""
    entry = accounts.get(resolved_name) or (accounts.get(mapped_account) if mapped_account else None) or {}

    api_key = entry.get("api_key") or data.get("api_key", "")
    api_secret = entry.get("api_secret") or data.get("api_secret", "")
    if not (api_key and api_secret):
        raise RuntimeError(f"Missing Spaceship credentials in {SPACESHIP_CREDS_FILE} or environment.")
    return api_key.strip(), api_secret.strip()


def http_json(
    method: str,
    url: str,
    headers: Dict[str, str],
    payload: Optional[Dict[str, Any]] = None,
    timeout: int = 25,
) -> Tuple[int, Dict[str, Any]]:
    data = json.dumps(payload).encode("utf-8") if payload is not None else None
    req_headers = {"Accept": "application/json", **headers}
    if payload is not None:
        req_headers["Content-Type"] = "application/json"
    req = urllib.request.Request(url, data=data, headers=req_headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            raw = resp.read().decode("utf-8")
            return resp.status, (json.loads(raw) if raw.strip() else {})
    except urllib.error.HTTPError as e:
        raw = e.read().decode("utf-8", errors="ignore")
        try:
            return e.code, json.loads(raw)
        except Exception:
            return e.code, {"success": False, "raw": raw}


def ensure_cloudflare_zone(tokens: Dict[str, str], dry_run: bool) -> Tuple[Optional[str], List[str]]:
    print(f"\n[1/5] Ensuring Cloudflare Zone for {DOMAIN}...")
    auth = {"Authorization": f"Bearer {tokens['zone_create']}"}
    code, res = http_json("GET", f"https://api.cloudflare.com/client/v4/zones?name={DOMAIN}", auth)
    zones = res.get("result") or []
    if code == 200 and zones:
        z = zones[0]
        ns = z.get("name_servers") or []
        print(f"  ✓ Existing Zone: {z['name']} (id={z['id']}, status={z.get('status')}, NS={ns})")
        return z["id"], ns

    if dry_run:
        print(f"  [DRY-RUN] Would create Cloudflare Zone '{DOMAIN}' under account {ACCOUNT_ID}.")
        return None, []

    code, created = http_json(
        "POST",
        "https://api.cloudflare.com/client/v4/zones",
        auth,
        {
            "name": DOMAIN,
            "account": {"id": ACCOUNT_ID},
            "jump_start": True,
            "type": "full",
        },
    )
    if created.get("success") and created.get("result"):
        z = created["result"]
        ns = z.get("name_servers") or []
        print(f"  ✓ Created Cloudflare Zone: {z['name']} (id={z['id']}, status={z.get('status')}, NS={ns})")
        return z["id"], ns

    print(f"  ❌ Failed to create Cloudflare Zone (HTTP {code}): {created}")
    return None, []


def update_spaceship_nameservers(
    nameservers: List[str],
    dry_run: bool,
    spaceship_account: str = SPACESHIP_ACCOUNT,
) -> bool:
    print(f"\n[2/5] Updating Spaceship Nameservers for {DOMAIN} (account={spaceship_account}) -> {nameservers}...")
    if len(nameservers) < 2:
        print("  ⚠️ Need at least 2 Cloudflare nameservers; skipping Spaceship update.")
        return False

    api_key, api_secret = load_spaceship_creds(spaceship_account, DOMAIN)
    headers = {
        "X-API-Key": api_key,
        "X-API-Secret": api_secret,
        "User-Agent": "Mozilla/5.0",
    }

    if dry_run:
        print(f"  [DRY-RUN] Would PUT custom nameservers {nameservers} to Spaceship.")
        return True

    # Check domain status first
    chk_code, chk_body = http_json("GET", f"https://spaceship.dev/api/v1/domains/{DOMAIN}", headers)
    if chk_code == 404:
        print(f"  ⚠️ Spaceship API returned 404: '{DOMAIN}' is not currently found in this Spaceship account.")
        print(f"     After registering/adding '{DOMAIN}' in Spaceship, run:")
        print(f"       python3 scripts/setup_infra.py --spaceship-only")
        print(f"     Or set Custom Nameservers in Spaceship UI manually to: {', '.join(nameservers)}")
        return False

    put_code, put_body = http_json(
        "PUT",
        f"https://spaceship.dev/api/v1/domains/{DOMAIN}/nameservers",
        headers,
        {"provider": "custom", "hosts": nameservers[:2]},
    )
    if put_code in (200, 204):
        print(f"  ✓ Spaceship Nameservers updated successfully -> {nameservers[:2]}")
        return True

    print(f"  ⚠️ Spaceship API returned HTTP {put_code}: {put_body}")
    return False


def ensure_pages_project(tokens: Dict[str, str], dry_run: bool) -> bool:
    print(f"\n[3/5] Ensuring Git-connected Cloudflare Pages project '{PAGES_PROJECT}'...")
    auth = {"Authorization": f"Bearer {tokens['pages']}"}
    owner, repo_name = GITHUB_REPO.split("/", 1)
    base = f"https://api.cloudflare.com/client/v4/accounts/{ACCOUNT_ID}/pages/projects/{PAGES_PROJECT}"

    code, existing = http_json("GET", base, auth)
    if code == 200 and existing.get("success"):
        src = (existing.get("result") or {}).get("source") or {}
        src_cfg = src.get("config") or {}
        if src.get("type") in ("github", "github_app") and src_cfg.get("repo_name") == repo_name:
            print(f"  ✓ Pages project '{PAGES_PROJECT}' already connected to {owner}/{repo_name}")
            return True
        if not dry_run:
            print(f"  ⚠️ Recreating Pages project '{PAGES_PROJECT}' as Git-connected ({GITHUB_REPO})...")
            http_json("DELETE", base, auth)

    if dry_run:
        print(f"  [DRY-RUN] Would create Pages project '{PAGES_PROJECT}' connected to {GITHUB_REPO}.")
        return True

    for source_type in ("github_app", "github"):
        payload = {
            "name": PAGES_PROJECT,
            "production_branch": DEFAULT_BRANCH,
            "source": {
                "type": source_type,
                "config": {
                    "owner": owner,
                    "repo_name": repo_name,
                    "production_branch": DEFAULT_BRANCH,
                    "pr_comments_enabled": True,
                    "deployments_enabled": True,
                    "production_deployments_enabled": True,
                },
            },
            "build_config": {
                "build_command": BUILD_COMMAND,
                "destination_dir": DESTINATION_DIR,
            },
            "deployment_configs": {
                "production": {"env_vars": {"NODE_VERSION": {"value": "22"}}},
                "preview": {"env_vars": {"NODE_VERSION": {"value": "22"}}},
            },
        }
        p_code, p_res = http_json(
            "POST",
            f"https://api.cloudflare.com/client/v4/accounts/{ACCOUNT_ID}/pages/projects",
            auth,
            payload,
        )
        if p_res.get("success"):
            print(f"  ✓ Created Pages project '{PAGES_PROJECT}' (source={source_type}) -> https://{PAGES_PROJECT}.pages.dev")
            return True
        print(f"  · Attempt with source.type='{source_type}' returned HTTP {p_code}: {p_res.get('errors')}")

    return False


def trigger_pages_deployment(tokens: Dict[str, str], dry_run: bool) -> None:
    print(f"\n[4/5] Triggering Cloudflare Pages production build for '{PAGES_PROJECT}'...")
    if dry_run:
        print(f"  [DRY-RUN] Would trigger production deployment from branch '{DEFAULT_BRANCH}'.")
        return
    auth = {"Authorization": f"Bearer {tokens['pages']}"}
    code, res = http_json(
        "POST",
        f"https://api.cloudflare.com/client/v4/accounts/{ACCOUNT_ID}/pages/projects/{PAGES_PROJECT}/deployments",
        auth,
        None,
    )
    # Fallback multipart/form-data empty request if POST without body expects multipart or succeeds
    if res.get("success") and res.get("result"):
        dep = res["result"]
        print(f"  ✓ Triggered deployment id={dep.get('id')} url={dep.get('url')}")
    else:
        print(f"  ℹ️ Manual deploy trigger note (HTTP {code}): {res.get('errors') or 'GitHub push hook handles automatic build'}")


def bind_domains_dns_redirect(tokens: Dict[str, str], zone_id: Optional[str], dry_run: bool) -> None:
    print(f"\n[5/5] Binding custom domains, proxied CNAMEs, and www -> apex 301 redirect...")
    if dry_run:
        print(f"  [DRY-RUN] Would bind {DOMAIN} & {WWW_DOMAIN} + CNAMEs + 301 rule.")
        return

    pages_auth = {"Authorization": f"Bearer {tokens['pages']}"}
    for host in (DOMAIN, WWW_DOMAIN):
        d_code, d_res = http_json(
            "POST",
            f"https://api.cloudflare.com/client/v4/accounts/{ACCOUNT_ID}/pages/projects/{PAGES_PROJECT}/domains",
            pages_auth,
            {"name": host},
        )
        if d_res.get("success"):
            print(f"  ✓ Bound custom domain to Pages: {host}")
        else:
            print(f"  · Custom domain notice ({host}, HTTP {d_code}): {d_res.get('errors')}")

    if not zone_id:
        print("  ⚠️ No Cloudflare Zone ID available; skipping DNS CNAME and 301 Redirect configuration.")
        return

    dns_auth = {"Authorization": f"Bearer {tokens['dns']}"}
    r_code, recs_res = http_json(
        "GET",
        f"https://api.cloudflare.com/client/v4/zones/{zone_id}/dns_records?type=CNAME",
        dns_auth,
    )
    existing_cnames = {
        rec["name"]: rec
        for rec in (recs_res.get("result") or [])
        if r_code == 200
    }

    target_cname = f"{PAGES_PROJECT}.pages.dev"
    for host in (DOMAIN, WWW_DOMAIN):
        cur = existing_cnames.get(host)
        if cur and cur.get("content") == target_cname and cur.get("proxied") is True:
            print(f"  ✓ CNAME already configured: {host} -> {target_cname} (Proxied)")
            continue
        method = "PUT" if cur else "POST"
        path = (
            f"https://api.cloudflare.com/client/v4/zones/{zone_id}/dns_records/{cur['id']}"
            if cur
            else f"https://api.cloudflare.com/client/v4/zones/{zone_id}/dns_records"
        )
        c_code, c_res = http_json(
            method,
            path,
            dns_auth,
            {"type": "CNAME", "name": host, "content": target_cname, "proxied": True, "ttl": 1},
        )
        if c_res.get("success"):
            print(f"  ✓ Upserted CNAME: {host} -> {target_cname} (Proxied)")
        else:
            print(f"  ⚠️ CNAME error ({host}, HTTP {c_code}): {c_res.get('errors')}")

    redirect_payload = {
        "rules": [
            {
                "description": f"Redirect {WWW_DOMAIN} to apex {DOMAIN}",
                "expression": f'(http.host eq "{WWW_DOMAIN}")',
                "action": "redirect",
                "action_parameters": {
                    "from_value": {
                        "status_code": 301,
                        "target_url": {
                            "expression": f'concat("https://{DOMAIN}", http.request.uri.path)'
                        },
                        "preserve_query_string": True,
                    }
                },
                "enabled": True,
            }
        ]
    }
    red_code, red_res = http_json(
        "PUT",
        f"https://api.cloudflare.com/client/v4/zones/{zone_id}/rulesets/phases/http_request_dynamic_redirect/entrypoint",
        dns_auth,
        redirect_payload,
    )
    if red_res.get("success"):
        print(f"  ✓ Configured 301 Permanent Redirect: https://{WWW_DOMAIN}/* -> https://{DOMAIN}/*")
    else:
        print(f"  ⚠️ Redirect rule notice (HTTP {red_code}): {red_res.get('errors')}")


def main() -> int:
    parser = argparse.ArgumentParser(description="Cloudflare + Spaceship + GitHub Pages Infrastructure Setup")
    parser.add_argument("--spaceship-only", action="store_true", help="Only update Spaceship Nameservers to Cloudflare NS")
    parser.add_argument(
        "--spaceship-account",
        default=SPACESHIP_ACCOUNT,
        help=f"Named Spaceship account in spaceship_token.json (default: {SPACESHIP_ACCOUNT})",
    )
    parser.add_argument("--dry-run", action="store_true", help="Preview changes without modifying cloud state")
    args = parser.parse_args()

    tokens = load_cf_tokens()
    zone_id, name_servers = ensure_cloudflare_zone(tokens, args.dry_run)
    update_spaceship_nameservers(name_servers, args.dry_run, args.spaceship_account)

    if args.spaceship_only:
        return 0

    pages_ok = ensure_pages_project(tokens, args.dry_run)
    if pages_ok:
        trigger_pages_deployment(tokens, args.dry_run)
    bind_domains_dns_redirect(tokens, zone_id, args.dry_run)

    print("\n=======================================================")
    print("Cloudflare + Spaceship Infrastructure Pipeline Summary:")
    print(f"  Domain        : https://{DOMAIN}/")
    print(f"  Pages Preview : https://{PAGES_PROJECT}.pages.dev/")
    print(f"  GitHub Repo   : https://github.com/{GITHUB_REPO}")
    print(f"  Nameservers   : {name_servers}")
    print("=======================================================\n")
    return 0


if __name__ == "__main__":
    sys.exit(main())
