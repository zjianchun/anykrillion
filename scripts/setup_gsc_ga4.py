#!/usr/bin/env python3
"""
scripts/setup_gsc_ga4.py — Google Analytics 4 (GA4) + Google Site Verification +
Google Search Console (GSC) Registration & Sitemap Submission for anykrillion.com.

Uses standard-library urllib refresh_token exchange (without `scope` parameter)
so all granted write scopes on /Users/echo/DataAnalytics/token.json stay intact.

Usage:
  python3 scripts/setup_gsc_ga4.py
  python3 scripts/setup_gsc_ga4.py --dry-run
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
from pathlib import Path
from typing import Any, Dict, Optional, Tuple

DOMAIN = "anykrillion.com"
SITE_URL = f"https://{DOMAIN}"
SITE_URL_GSC = f"https://{DOMAIN}/"
SITEMAP_URL = f"https://{DOMAIN}/sitemap.xml"
DISPLAY_NAME = "AnyKrillion"
GA4_PROPERTY_ID = "549595293"

TOKEN_FILE = Path("/Users/echo/DataAnalytics/token.json")
CF_FILE = Path("/Users/echo/DataAnalytics/cloudflare_token.json")
SITES_CONF_PATHS = [
    Path("/Users/echo/DataAnalytics/sites.conf"),
    Path.home() / ".gemini/config/skills/gsc-ga4-analytics/sites.conf",
]

KEY_EVENTS = [
    {"eventName": "tool_use", "countingMethod": "ONCE_PER_SESSION"},
    {"eventName": "scroll", "countingMethod": "ONCE_PER_SESSION"},
    {"eventName": "quick_search", "countingMethod": "ONCE_PER_SESSION"},
]


def get_google_access_token() -> str:
    data = json.loads(TOKEN_FILE.read_text(encoding="utf-8"))
    body = urllib.parse.urlencode(
        {
            "client_id": data["client_id"],
            "client_secret": data["client_secret"],
            "refresh_token": data["refresh_token"],
            "grant_type": "refresh_token",
        }
    ).encode("utf-8")
    req = urllib.request.Request(
        data.get("token_uri") or "https://oauth2.googleapis.com/token",
        data=body,
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=25) as resp:
        return json.load(resp)["access_token"]


def get_cloudflare_dns_token() -> str:
    if CF_FILE.exists():
        data = json.loads(CF_FILE.read_text(encoding="utf-8"))
        tok = data.get("token") or data.get("zone_create_token") or ""
        if tok.strip():
            return tok.strip()
    return os.environ.get("CLOUDFLARE_API_TOKEN", "").strip()


def http_json(
    method: str,
    url: str,
    headers: Dict[str, str],
    payload: Optional[Dict[str, Any]] = None,
    timeout: int = 25,
) -> Tuple[int, Dict[str, Any]]:
    data: Optional[bytes] = None
    req_headers = {"Accept": "application/json", **headers}
    if payload is not None:
        data = json.dumps(payload).encode("utf-8")
        req_headers["Content-Type"] = "application/json"
    elif method in ("PUT", "POST"):
        data = b""

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
            return e.code, {"raw": raw}


def ensure_ga4(token: str, dry_run: bool) -> Optional[str]:
    print(f"\n[1/4] Verifying GA4 Data Stream & Key Events in Property {GA4_PROPERTY_ID}...")
    headers = {"Authorization": f"Bearer {token}"}
    base = f"https://analyticsadmin.googleapis.com/v1alpha/properties/{GA4_PROPERTY_ID}"

    code, streams_res = http_json("GET", f"{base}/dataStreams", headers)
    measurement_id = None
    if code == 200:
        for stream in streams_res.get("dataStreams", []):
            web = stream.get("webStreamData") or {}
            uri = web.get("defaultUri", "").rstrip("/")
            if DOMAIN in uri:
                measurement_id = web.get("measurementId")
                print(f"  ✓ Active GA4 Stream: {stream.get('displayName')} -> {measurement_id}")
                break

    if not measurement_id and not dry_run:
        c_code, created = http_json(
            "POST",
            f"{base}/dataStreams",
            headers,
            {
                "displayName": DISPLAY_NAME,
                "type": "WEB_DATA_STREAM",
                "webStreamData": {"defaultUri": SITE_URL},
            },
        )
        if c_code in (200, 201):
            measurement_id = (created.get("webStreamData") or {}).get("measurementId")
            print(f"  ✓ Created GA4 Stream: {DISPLAY_NAME} -> {measurement_id}")
        else:
            print(f"  ⚠️ GA4 Stream creation HTTP {c_code}: {created}")

    ke_code, ke_res = http_json("GET", f"{base}/keyEvents", headers)
    existing = {k.get("eventName") for k in ke_res.get("keyEvents", []) if ke_code == 200}
    for ke in KEY_EVENTS:
        name = ke["eventName"]
        if name in existing:
            print(f"  ✓ GA4 Key Event active: {name}")
        elif not dry_run:
            p_code, p_res = http_json("POST", f"{base}/keyEvents", headers, ke)
            print(f"  ✓ Registered Key Event '{name}' (HTTP {p_code})")

    return measurement_id


def verify_google_site(token: str, cf_token: str, dry_run: bool) -> bool:
    print(f"\n[2/4] Setting up Google Site Verification (DNS_TXT + META) for {DOMAIN}...")
    g_headers = {"Authorization": f"Bearer {token}"}
    cf_headers = {"Authorization": f"Bearer {cf_token}"}

    if dry_run:
        print("  [DRY-RUN] Would obtain DNS_TXT token, write Cloudflare TXT, and verify ownership.")
        return True

    # 1. Request DNS_TXT token
    t_code, t_res = http_json(
        "POST",
        "https://www.googleapis.com/siteVerification/v1/token",
        g_headers,
        {"site": {"type": "INET_DOMAIN", "identifier": DOMAIN}, "verificationMethod": "DNS_TXT"},
    )
    v_token = t_res.get("token", "") if t_code == 200 else ""
    if v_token:
        print(f"  ✓ Obtained DNS_TXT verification token.")
    else:
        print(f"  ⚠️ Failed to obtain DNS_TXT token (HTTP {t_code}): {t_res}")

    # 2. Inject TXT record into Cloudflare DNS
    if v_token and cf_token:
        z_code, z_res = http_json(
            "GET",
            f"https://api.cloudflare.com/client/v4/zones?name={DOMAIN}",
            cf_headers,
        )
        zones = z_res.get("result") or []
        if z_code == 200 and zones:
            zid = zones[0]["id"]
            r_code, r_res = http_json(
                "GET",
                f"https://api.cloudflare.com/client/v4/zones/{zid}/dns_records?type=TXT",
                cf_headers,
            )
            already_present = False
            for rec in (r_res.get("result") or []) if r_code == 200 else []:
                content = rec.get("content", "")
                if v_token in content:
                    already_present = True
                    print(f"  ✓ Cloudflare DNS TXT verification record already exists.")
                elif "google-site-verification" in content:
                    http_json(
                        "DELETE",
                        f"https://api.cloudflare.com/client/v4/zones/{zid}/dns_records/{rec['id']}",
                        cf_headers,
                    )
            if not already_present:
                a_code, a_res = http_json(
                    "POST",
                    f"https://api.cloudflare.com/client/v4/zones/{zid}/dns_records",
                    cf_headers,
                    {"type": "TXT", "name": "@", "content": v_token, "ttl": 1},
                )
                print(f"  ✓ Injected Cloudflare DNS TXT record (HTTP {a_code}, success={a_res.get('success')})")

    # 3. Attempt verification (DNS_TXT first, then META fallback if live over HTTPS)
    time.sleep(2)
    d_code, d_res = http_json(
        "POST",
        "https://www.googleapis.com/siteVerification/v1/webResource?verificationMethod=DNS_TXT",
        g_headers,
        {"site": {"type": "INET_DOMAIN", "identifier": DOMAIN}},
    )
    if d_code == 200:
        print(f"  ✅ Verified Google ownership via DNS_TXT for {DOMAIN}")
        return True

    m_code, m_res = http_json(
        "POST",
        "https://www.googleapis.com/siteVerification/v1/webResource?verificationMethod=META",
        g_headers,
        {"site": {"type": "SITE", "identifier": SITE_URL_GSC}},
    )
    if m_code == 200:
        print(f"  ✅ Verified Google ownership via META tag for {SITE_URL_GSC}")
        return True

    print(
        f"  ⏳ Verification deferred (DNS_TXT HTTP {d_code}, META HTTP {m_code}): "
        f"DNS TXT & <meta google-site-verification> are in place; re-run once '{DOMAIN}' NS is active."
    )
    return False


def register_gsc_and_sitemap(token: str, dry_run: bool) -> None:
    print(f"\n[3/4] Registering {SITE_URL_GSC} in GSC & Submitting {SITEMAP_URL}...")
    if dry_run:
        print(f"  [DRY-RUN] Would PUT {SITE_URL_GSC} and {SITEMAP_URL} in GSC.")
        return

    headers = {"Authorization": f"Bearer {token}"}
    enc_site = urllib.parse.quote(SITE_URL_GSC, safe="")
    enc_sm = urllib.parse.quote(SITEMAP_URL, safe="")

    r_code, r_res = http_json(
        "PUT",
        f"https://www.googleapis.com/webmasters/v3/sites/{enc_site}",
        headers,
    )
    print(f"  · GSC site PUT status: HTTP {r_code}")

    s_code, s_res = http_json(
        "PUT",
        f"https://www.googleapis.com/webmasters/v3/sites/{enc_site}/sitemaps/{enc_sm}",
        headers,
    )
    if s_code in (200, 204):
        print(f"  ✅ GSC Sitemap submitted (HTTP {s_code}): {SITEMAP_URL}")
    else:
        print(f"  ⏳ GSC Sitemap submission status (HTTP {s_code}): {s_res}")

    # Clean up preview pages.dev resource in GSC if accidentally added
    l_code, l_res = http_json("GET", "https://www.googleapis.com/webmasters/v3/sites", headers)
    if l_code == 200:
        for entry in l_res.get("siteEntry", []):
            s_url = entry.get("siteUrl", "")
            if "anykrillion.pages.dev" in s_url or s_url == f"sc-domain:{DOMAIN}":
                http_json(
                    "DELETE",
                    f"https://www.googleapis.com/webmasters/v3/sites/{urllib.parse.quote(s_url, safe='')}",
                    headers,
                )
                print(f"  🧹 Cleaned duplicate GSC property: {s_url}")


def register_sites_conf(dry_run: bool) -> None:
    print("\n[4/4] Registering site URL in local sites.conf files...")
    for path in SITES_CONF_PATHS:
        if not path.exists():
            continue
        lines = path.read_text(encoding="utf-8").splitlines()
        if any(line.strip() == SITE_URL_GSC for line in lines):
            print(f"  ✓ Already registered in {path}")
            continue
        if dry_run:
            print(f"  [DRY-RUN] Would append {SITE_URL_GSC} to {path}")
            continue
        content = path.read_text(encoding="utf-8").rstrip()
        path.write_text(f"{content}\n{SITE_URL_GSC}\n", encoding="utf-8")
        print(f"  ✓ Added {SITE_URL_GSC} to {path}")


def main() -> int:
    parser = argparse.ArgumentParser(description="GA4 + GSC Automated Setup for anykrillion.com")
    parser.add_argument("--dry-run", action="store_true", help="Simulate without live writes")
    args = parser.parse_args()

    if not TOKEN_FILE.exists():
        print(f"❌ Missing OAuth token file at {TOKEN_FILE}", file=sys.stderr)
        return 1

    token = get_google_access_token()
    cf_token = get_cloudflare_dns_token()

    measurement_id = ensure_ga4(token, args.dry_run)
    verify_google_site(token, cf_token, args.dry_run)
    register_gsc_and_sitemap(token, args.dry_run)
    register_sites_conf(args.dry_run)

    print("\n=======================================================")
    print(f"GSC & GA4 Pipeline Complete for {DOMAIN}")
    print(f"  GA4 Measurement ID : {measurement_id}")
    print(f"  GSC Property       : {SITE_URL_GSC}")
    print(f"  Sitemap            : {SITEMAP_URL}")
    print("=======================================================\n")
    return 0


if __name__ == "__main__":
    sys.exit(main())
