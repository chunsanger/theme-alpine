#!/usr/bin/env python3
"""Fetch recent Bluesky posts and store them as Hugo data.

This script is intended for static-site builds where Bluesky posts should be
rendered as part of the homepage feed.
"""

from __future__ import annotations

import argparse
import html
import json
import sys
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any

API_URL = "https://public.api.bsky.app/xrpc/app.bsky.feed.getAuthorFeed"
BOOK_ACTIVITY_PREFIXES = (
    "started reading:",
    "reading:",
    "finished reading:",
)
SELF_SITE_DOMAIN = "hunsanger.blog"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Fetch Bluesky posts and write Hugo data JSON."
    )
    parser.add_argument("--actor", required=True, help="Bluesky handle (e.g. hunsanger.com).")
    parser.add_argument("--days", type=int, default=30, help="Only include posts from the last N days.")
    parser.add_argument("--output", default="data/bluesky_feed.json", help="Output JSON path.")
    parser.add_argument("--max-pages", type=int, default=20, help="Maximum paginated API pages to fetch.")
    parser.add_argument("--timeout", type=float, default=20.0, help="HTTP timeout in seconds.")
    return parser.parse_args()


def parse_created_at(value: str) -> datetime:
    return datetime.fromisoformat(value.replace("Z", "+00:00")).astimezone(timezone.utc)


def date_label(dt: datetime) -> str:
    return dt.strftime("%b %d, %Y").replace(" 0", " ")


def at_uri_to_web_url(at_uri: str, handle: str) -> str:
    if not at_uri or not handle:
        return ""
    post_id = at_uri.rsplit("/", 1)[-1]
    return f"https://bsky.app/profile/{handle}/post/{post_id}"


def is_book_activity(text: str) -> bool:
    normalized = text.strip().lower()
    return any(normalized.startswith(prefix) for prefix in BOOK_ACTIVITY_PREFIXES)


def is_self_site_link(text: str, record: dict[str, Any]) -> bool:
    text_lower = text.strip().lower()
    if SELF_SITE_DOMAIN in text_lower:
        return True

    for facet in record.get("facets") or []:
        for feature in facet.get("features") or []:
            if feature.get("$type") != "app.bsky.richtext.facet#link":
                continue
            uri = (feature.get("uri") or "").lower()
            if SELF_SITE_DOMAIN in uri:
                return True

    return False


def byte_index_to_char_index(text: str, byte_index: int) -> int:
    if byte_index <= 0:
        return 0
    return len(text.encode("utf-8")[:byte_index].decode("utf-8", errors="ignore"))


def render_rich_text_html(text: str, facets: list[dict[str, Any]] | None) -> str:
    if not text:
        return ""

    facets = facets or []
    links: list[tuple[int, int, str]] = []

    for facet in facets:
        index = facet.get("index") or {}
        byte_start = index.get("byteStart")
        byte_end = index.get("byteEnd")
        if not isinstance(byte_start, int) or not isinstance(byte_end, int) or byte_end <= byte_start:
            continue

        start = byte_index_to_char_index(text, byte_start)
        end = byte_index_to_char_index(text, byte_end)
        if end <= start:
            continue

        url = ""
        for feature in facet.get("features") or []:
            feature_type = feature.get("$type")
            if feature_type == "app.bsky.richtext.facet#link":
                url = (feature.get("uri") or "").strip()
                break
            if feature_type == "app.bsky.richtext.facet#mention":
                did = (feature.get("did") or "").strip()
                if did:
                    url = f"https://bsky.app/profile/{did}"
                    break

        if url:
            links.append((start, end, url))

    links.sort(key=lambda item: (item[0], item[1]))

    # Skip overlapping spans to keep output deterministic.
    filtered_links: list[tuple[int, int, str]] = []
    cursor = -1
    for start, end, url in links:
        if start < cursor:
            continue
        filtered_links.append((start, end, url))
        cursor = end

    parts: list[str] = []
    last = 0
    for start, end, url in filtered_links:
        if start > last:
            parts.append(html.escape(text[last:start]).replace("\n", "<br>\n"))

        label = html.escape(text[start:end])
        href = html.escape(url, quote=True)
        parts.append(f'<a href="{href}" target="_blank" rel="noopener noreferrer">{label}</a>')
        last = end

    if last < len(text):
        parts.append(html.escape(text[last:]).replace("\n", "<br>\n"))

    return "".join(parts)


def extract_quote(embed: dict[str, Any]) -> dict[str, str] | None:
    if not isinstance(embed, dict):
        return None

    embed_type = embed.get("$type", "")
    record_view = None

    if embed_type == "app.bsky.embed.record#view":
        record_view = embed.get("record")
    elif embed_type == "app.bsky.embed.recordWithMedia#view":
        record_view = (embed.get("record") or {}).get("record")

    if not isinstance(record_view, dict):
        return None

    record_type = record_view.get("$type", "")
    if record_type.endswith("viewNotFound") or record_type.endswith("viewBlocked"):
        return {"author_display": "", "author_handle": "", "text": "", "url": ""}

    author = record_view.get("author") or {}
    value = record_view.get("value") or {}

    author_handle = author.get("handle", "")
    author_display = author.get("displayName", "") or author_handle
    text = (value.get("text") or "").strip()
    text_html = render_rich_text_html(text, value.get("facets"))
    uri = record_view.get("uri", "")
    url = at_uri_to_web_url(uri, author_handle)

    if not (text or url):
        return None

    return {
        "author_display": author_display,
        "author_handle": author_handle,
        "text_html": text_html,
        "text": text,
        "url": url,
    }


def fetch_feed_page(actor: str, cursor: str | None, timeout: float) -> dict[str, Any]:
    query = {"actor": actor, "limit": "100"}
    if cursor:
        query["cursor"] = cursor
    url = f"{API_URL}?{urllib.parse.urlencode(query)}"
    req = urllib.request.Request(url, headers={"Accept": "application/json"})
    with urllib.request.urlopen(req, timeout=timeout) as response:
        payload = response.read().decode("utf-8")
    return json.loads(payload)


def collect_posts(actor: str, days: int, max_pages: int, timeout: float) -> list[dict[str, Any]]:
    cutoff = datetime.now(timezone.utc) - timedelta(days=days)
    posts: list[dict[str, Any]] = []
    seen_urls: set[str] = set()
    cursor = None

    for _ in range(max_pages):
        page = fetch_feed_page(actor, cursor, timeout)
        entries = page.get("feed") or []
        if not entries:
            break

        saw_recent = False

        for entry in entries:
            reason = entry.get("reason") or {}
            if reason.get("$type") == "app.bsky.feed.defs#reasonRepost":
                continue

            post = entry.get("post") or {}
            record = post.get("record") or {}
            if not isinstance(record, dict):
                continue

            created_at_raw = record.get("createdAt")
            if not created_at_raw:
                continue

            try:
                created_at = parse_created_at(created_at_raw)
            except ValueError:
                continue

            if created_at < cutoff:
                continue

            saw_recent = True

            # Exclude replies.
            if record.get("reply"):
                continue

            author = post.get("author") or {}
            author_handle = author.get("handle", "")
            author_display = author.get("displayName", "") or author_handle
            post_url = at_uri_to_web_url(post.get("uri", ""), author_handle)

            if not post_url or post_url in seen_urls:
                continue

            text = (record.get("text") or "").strip()
            text_html = render_rich_text_html(text, record.get("facets"))
            quote = extract_quote(post.get("embed") or {})
            if text and is_book_activity(text):
                continue
            if text and is_self_site_link(text, record):
                continue
            if not text and not quote:
                continue

            seen_urls.add(post_url)
            posts.append(
                {
                    "author_display": author_display,
                    "author_handle": author_handle,
                    "created_at": created_at.isoformat().replace("+00:00", "Z"),
                    "created_at_unix": int(created_at.timestamp()),
                    "date_label": date_label(created_at),
                    "quote": quote,
                    "text_html": text_html,
                    "text": text,
                    "url": post_url,
                }
            )

        cursor = page.get("cursor")
        if not cursor or not saw_recent:
            break

    posts.sort(key=lambda item: item["created_at_unix"], reverse=True)
    return posts


def write_output(path: Path, actor: str, days: int, posts: list[dict[str, Any]]) -> None:
    data = {
        "actor": actor,
        "days": days,
        "generated_at": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
        "posts": posts,
    }
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def main() -> int:
    args = parse_args()
    if args.days <= 0:
        print("--days must be greater than 0", file=sys.stderr)
        return 2
    if args.max_pages <= 0:
        print("--max-pages must be greater than 0", file=sys.stderr)
        return 2

    output_path = Path(args.output)

    try:
        posts = collect_posts(
            actor=args.actor,
            days=args.days,
            max_pages=args.max_pages,
            timeout=args.timeout,
        )
    except (urllib.error.URLError, urllib.error.HTTPError, TimeoutError, json.JSONDecodeError) as exc:
        print(f"Failed to fetch Bluesky feed: {exc}", file=sys.stderr)
        return 1

    write_output(output_path, args.actor, args.days, posts)
    print(f"Wrote {len(posts)} posts to {output_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
