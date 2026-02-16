# Alpine theme for Micro.blog

Hugo theme for Micro.blog, based on Marfa theme, which was based on [NeoCactus](https://github.com/mmarfil/neocactus/fork) and [Cactus](https://github.com/eudicots/Cactus) for Jekyll. Mostly the same design as Marfa but with a more compact header.

![screenshot](https://raw.githubusercontent.com/microdotblog/theme-alpine/master/screenshot/home.png)

## Bluesky feed merge (homepage)

This theme can merge recent Bluesky posts directly into the homepage timeline.

### Manual refresh

```bash
python3 scripts/fetch_bluesky_feed.py --actor hunsanger.com --days 30 --output data/bluesky_feed.json
```

This fetches:
- posts from the last 30 days
- excludes replies
- excludes reposts
- includes quote posts (with quoted content when available)
- excludes book-status duplicates that start with `Started Reading:`, `Reading:`, or `Finished Reading:`
- excludes posts that link back to `hunsanger.blog`
- keeps Bluesky `@mentions` and links clickable in rendered feed items

### Automated refresh

GitHub Actions workflow:
- `.github/workflows/update-bluesky-feed.yml`
- runs every 6 hours
- rewrites `data/bluesky_feed.json`
- commits changes automatically when data changes
