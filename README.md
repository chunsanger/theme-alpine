# Alpine theme for Micro.blog

Hugo theme for Micro.blog, based on Marfa theme, which was based on [NeoCactus](https://github.com/mmarfil/neocactus/fork) and [Cactus](https://github.com/eudicots/Cactus) for Jekyll. Mostly the same design as Marfa but with a more compact header.

![screenshot](https://raw.githubusercontent.com/microdotblog/theme-alpine/master/screenshot/home.png)

## Bluesky feed merge (homepage)

This theme can merge recent Bluesky posts directly into the homepage timeline.

### Manual refresh

```bash
python3 scripts/fetch_bluesky_feed.py --actor hunsanger.com --days 180 --max-pages 60 --output data/bluesky_feed.json
```

This fetches:
- posts from the last 180 days (up to 60 API pages)
- excludes replies
- includes quote posts (with quoted content when available)
- excludes book-status duplicates that start with `Started Reading:`, `Reading:`, or `Finished Reading:`
- excludes posts that link back to `hunsanger.blog`
- keeps Bluesky `@mentions` and links clickable in rendered feed items

## Feed sections

- `/posts/`: Micro.blog posts only
- `/notes/`: Bluesky posts + reposts (using the same feed card styling)
- `/archive/`: still available if linked directly, but hidden from nav tabs by default

### Automated refresh

GitHub Actions workflow:
- `.github/workflows/update-bluesky-feed.yml`
- runs every 6 hours
- uses `BLUESKY_LOOKBACK_DAYS` and `BLUESKY_MAX_PAGES` env vars for fetch depth
- rewrites `data/bluesky_feed.json`
- commits changes automatically when data changes
