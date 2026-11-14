#!/usr/bin/env python3
"""
scripts/submit_bing_indexnow.py — Automated Bing Webmaster API + IndexNow URL
Submission for anykrillion.com.

Reads:
  - /Users/echo/DataAnalytics/bing_token.json
  - /Users/echo/DataAnalytics/cloudflare_token.json (for Bing CNAME DNS verification)
  - public/indexnow-key.txt
  - out/sitemap.xml (fallback to hardcoded route list if out/ hasn't been built yet)

Usage:
  python3 scripts/submit_bing_indexnow.py
  python3 scripts/submit_bing_indexnow.py --dry-run
"""

from __future__ import annotations

import argparse
import json
import os
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

PROJECT_ROOT = Path(__file__).resolve().parent.parent
DOMAIN = "anykrillion.com"
SITE_URL = f"https://{DOMAIN}/"
SITEMAP_URL = f"https://{DOMAIN}/sitemap.xml"

BING_TOKEN_FILE = Path("/Users/echo/DataAnalytics/bing_token.json")
CF_TOKEN_FILE = Path("/Users/echo/DataAnalytics/cloudflare_token.json")
INDEXNOW_KEY_FILE = PROJECT_ROOT / "public" / "indexnow-key.txt"
OUT_SITEMAP = PROJECT_ROOT / "out" / "sitemap.xml"

FALLBACK_URLS = [
    "https://anykrillion.com/",
    "https://anykrillion.com/krillion-answers-today/",
    "https://anykrillion.com/noillirk/",
    "https://anykrillion.com/krillion-sports/",
    "https://anykrillion.com/krillion-geography/",
    "https://anykrillion.com/krillion-archive/",
    "https://anykrillion.com/pokekrillion/",
    "https://anykrillion.com/footbillion/",
    "https://anykrillion.com/nba-krillion/",
    "https://anykrillion.com/krillion-movies/",
    "https://anykrillion.com/guides/",
    "https://anykrillion.com/sources/",
    "https://anykrillion.com/privacy-policy/",
    "https://anykrillion.com/terms/",
]

INDEXNOW_GATEWAYS = [
    ("IndexNow Global", "https://api.indexnow.org/indexnow"),
    ("Microsoft Bing", "https://www.bing.com/indexnow"),
    ("Yandex", "https://yandex.com/indexnow"),
]


def load_urls() -> List[str]:
    if OUT_SITEMAP.exists():
        try:
            tree = ET.parse(OUT_SITEMAP)
            urls = [
                el.text.strip()
                for el in tree.getroot().findall(".//{*}loc")
                if el.text and el.text.strip()
            ]
            if urls:
                return list(dict.fromkeys(urls))
        except Exception as e:
            print(f"  ⚠️ Failed parsing {OUT_SITEMAP}: {e}")
    return FALLBACK_URLS


def load_bing_key() -> str:
    env_key = os.environ.get("BING_API_KEY", "").strip()
    if env_key:
        return env_key
    if BING_TOKEN_FILE.exists():
        return json.loads(BING_TOKEN_FILE.read_text(encoding="utf-8")).get("api_key", "").strip()
    return ""


def load_cf_dns_token() -> str:
    if CF_TOKEN_FILE.exists():
        d = json.loads(CF_TOKEN_FILE.read_text(encoding="utf-8"))
        return (d.get("token") or d.get("zone_create_token") or "").strip()
    return os.environ.get("CLOUDFLARE_API_TOKEN", "").strip()


def http_json(
    method: str,
    url: str,
    headers: Dict[str, str],
    payload: Optional[Dict[str, Any]] = None,
    timeout: int = 20,
) -> Tuple[int, Dict[str, Any]]:
    data = json.dumps(payload).encode("utf-8") if payload is not None else None
    req_headers = {"Accept": "application/json", **headers}
    if payload is not None:
        req_headers["Content-Type"] = "application/json; charset=utf-8"
    req = urllib.request.Request(url, data=data, headers=req_headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            raw = resp.read().decode("utf-8")
            return resp.status, (json.loads(raw) if raw.strip() else {"status": resp.status})
    except urllib.error.HTTPError as e:
        raw = e.read().decode("utf-8", errors="ignore")
        try:
            return e.code, json.loads(raw)
        except Exception:
            return e.code, {"raw": raw}
    except Exception as e:
        return 0, {"error": str(e)}


def bing_call(api_key: str, method_name: str, payload: Optional[Dict[str, Any]] = None, params: Optional[Dict[str, str]] = None) -> Tuple[int, Dict[str, Any]]:
    url = f"https://ssl.bing.com/webmaster/api.svc/json/{method_name}?apikey={urllib.parse.quote(api_key)}"
    if params:
        for k, v in params.items():
            url += f"&{k}={urllib.parse.quote(str(v))}"
    return http_json(
        "POST" if payload is not None else "GET",
        url,
        {"User-Agent": "AnyKrillion-Bing-Agent/1.0"},
        payload,
    )


def inject_bing_cname_if_needed(dns_code: str, dry_run: bool) -> None:
    if not dns_code:
        return
    cname_host = dns_code.split(".")[0].strip()
    if not cname_host:
        return
    cf_tok = load_cf_dns_token()
    if not cf_tok or dry_run:
        return
    cf_headers = {"Authorization": f"Bearer {cf_tok}"}
    z_code, z_res = http_json(
        "GET",
        f"https://api.cloudflare.com/client/v4/zones?name={DOMAIN}",
        cf_headers,
    )
    zones = z_res.get("result") or []
    if z_code != 200 or not zones:
        return
    zid = zones[0]["id"]
    c_code, c_res = http_json(
        "POST",
        f"https://api.cloudflare.com/client/v4/zones/{zid}/dns_records",
        cf_headers,
        {"type": "CNAME", "name": cname_host, "content": "verify.bing.com", "ttl": 1, "proxied": False},
    )
    if c_res.get("success"):
        print(f"  ✓ Injected Bing verification CNAME: {cname_host}.{DOMAIN} -> verify.bing.com")
    else:
        print(f"  · Bing verification CNAME note (HTTP {c_code}): {c_res.get('errors')}")


def run_bing_pipeline(urls: List[str], dry_run: bool) -> None:
    print(f"\n[1/2] Running Bing Webmaster API pipeline for {SITE_URL}...")
    api_key = load_bing_key()
    if not api_key:
        print(f"  ❌ Missing Bing API key ({BING_TOKEN_FILE})")
        return

    if dry_run:
        print(f"  [DRY-RUN] Would AddSite/VerifySite, SubmitFeed ({SITEMAP_URL}), and SubmitUrlBatch ({len(urls)} URLs).")
        return

    _, sites_res = bing_call(api_key, "GetUserSites")
    sites = sites_res.get("d") or []
    current = next((s for s in sites if DOMAIN in s.get("Url", "")), None)

    if not current:
        a_code, a_res = bing_call(api_key, "AddSite", {"siteUrl": SITE_URL})
        print(f"  · AddSite (HTTP {a_code}): {a_res}")
        _, sites_res = bing_call(api_key, "GetUserSites")
        sites = sites_res.get("d") or []
        current = next((s for s in sites if DOMAIN in s.get("Url", "")), None)

    if current:
        verified = bool(current.get("IsVerified"))
        dns_code = current.get("DnsVerificationCode", "")
        print(f"  ✓ Bing site registered | IsVerified={verified}")
        if not verified:
            inject_bing_cname_if_needed(dns_code, dry_run)
            time.sleep(2)
            v_code, v_res = bing_call(api_key, "VerifySite", {"siteUrl": SITE_URL})
            print(f"  · VerifySite (HTTP {v_code}): {v_res}")
    else:
        print(f"  ⚠️ Site still not returned in GetUserSites; proceeding to SubmitFeed.")

    f_code, f_res = bing_call(api_key, "SubmitFeed", {"siteUrl": SITE_URL, "feedUrl": SITEMAP_URL})
    print(f"  · SubmitFeed (HTTP {f_code}): {f_res}")

    q_code, q_res = bing_call(api_key, "GetUrlSubmissionQuota", None, {"siteUrl": SITE_URL})
    quota = (q_res.get("d") or {}) if q_code == 200 else {}
    daily_quota = quota.get("DailyQuota", 0)
    print(f"  · Bing Quota: daily={daily_quota}, monthly={quota.get('MonthlyQuota', 0)}")

    b_code, b_res = bing_call(api_key, "SubmitUrlBatch", {"siteUrl": SITE_URL, "urlList": urls[:500]})
    print(f"  · SubmitUrlBatch ({len(urls)} URLs, HTTP {b_code}): {b_res}")


def run_indexnow(urls: List[str], dry_run: bool) -> None:
    print(f"\n[2/2] Pushing {len(urls)} URLs to IndexNow gateways...")
    if not INDEXNOW_KEY_FILE.exists():
        print(f"  ❌ Missing IndexNow key file: {INDEXNOW_KEY_FILE}")
        return
    key = INDEXNOW_KEY_FILE.read_text(encoding="utf-8").strip()
    key_loc = f"https://{DOMAIN}/{key}.txt"

    if dry_run:
        print(f"  [DRY-RUN] Would submit {len(urls)} URLs using key={key} ({key_loc}).")
        return

    payload = {
        "host": DOMAIN,
        "key": key,
        "keyLocation": key_loc,
        "urlList": urls,
    }
    for name, endpoint in INDEXNOW_GATEWAYS:
        code, res = http_json("POST", endpoint, {"User-Agent": "AnyKrillion-IndexNow/1.0"}, payload, timeout=15)
        if code in (200, 202):
            print(f"  ✅ [{name}] Accepted (HTTP {code})")
        else:
            print(f"  ⏳ [{name}] HTTP {code}: {res}")


def main() -> int:
    parser = argparse.ArgumentParser(description="Bing Webmaster API & IndexNow URL Submission for anykrillion.com")
    parser.add_argument("--dry-run", action="store_true", help="Simulate without live HTTP requests")
    args = parser.parse_args()

    urls = load_urls()
    print(f"Loaded {len(urls)} canonical URLs for {DOMAIN}.")
    run_bing_pipeline(urls, args.dry_run)
    run_indexnow(urls, args.dry_run)
    print("\nBing + IndexNow pipeline finished.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
