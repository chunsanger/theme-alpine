# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Alpine is a Hugo theme for Micro.blog, a microblogging platform. It's a minimal, clean design based on the Marfa theme, which itself was based on NeoCactus and Cactus for Jekyll. The theme provides a compact header with customizable color parameters and supports Micro.blog-specific features like syndication to Bluesky.

## Theme Architecture

### Template Hierarchy

The theme follows Hugo's standard template structure:

1. **Base Template** (`layouts/_default/baseof.html`): Root template that wraps all pages with:
   - HTML structure
   - `head.html` partial (metadata, CSS, fonts)
   - `header.html` partial (navigation and optional profile)
   - Main content block (replaced by specific page layouts)
   - `footer.html` and `custom_footer.html` partials
   - Plugin JavaScript injection

2. **Layout Files**:
   - `layouts/_default/baseof.html`: Base template wrapper
   - `layouts/_default/list.html`: Default list page layout
   - `layouts/_default/single.html`: Default single post layout
   - `layouts/index.html`: Home page (uses profile partial)
   - `layouts/post/single.html`: Single post with syndication links
   - `layouts/reply/single.html`: Single reply layout
   - `layouts/section/replies.html`: Replies section

3. **Partials** (`layouts/partials/`):
   - `navigation.html`: Main nav bar with site title and menu items
   - `header.html`: Combines navigation and conditional profile display
   - `profile.html`: Profile section (shown only on home page)
   - `post-item.html`: Individual post card template
   - `post-list.html`: List of posts
   - `pagination.html`: Pagination controls
   - `footer.html`: Site footer
   - `alpine.html`: Alpine-specific styling component
   - `head.html`: Head section with meta tags and CSS links

### Key Features

- **Customizable Colors**: Three color parameters via `plugin.json`:
  - `alpine_accent_text_color` (default: #f29c38)
  - `alpine_accent_background_color` (default: #ffffff)
  - `alpine_hover_background_color` (default: #fffee4)

- **Micro.blog Integration**:
  - Author profile with avatar
  - Menu system support
  - Microformat classes (h-feed, h-entry) for semantic markup
  - Support for Micro.blog-specific metadata (username, avatar)

- **Syndication Support**:
  - Bluesky syndication links in posts (hidden by default, show if post has Bluesky metadata)

## File Structure

```
layouts/
├── _default/          # Default page layouts
├── partials/          # Reusable template components
├── post/              # Post-specific templates
├── reply/             # Reply-specific templates
├── section/           # Section-specific templates
└── index.html         # Home page

static/
└── assets/css/        # Stylesheets
    ├── style.css      # Main theme styles
    ├── alpine.css     # Alpine-specific styles
    ├── normalize.css  # CSS normalize
    └── highlight.css  # Syntax highlighting
```

## Configuration

### plugin.json
Defines theme metadata and user-customizable fields for the Micro.blog theme marketplace.

### config.json
Provides default values for color parameters.

### theme.toml
Currently empty but reserved for TOML-based configuration.

## Common Tasks

### Modifying Navigation
Edit `layouts/partials/navigation.html`:
- Site title and avatar display
- Menu items from `.Site.Menus.main` (configured in site config)
- Call-to-action links

### Changing Colors
Update color values in either:
- `plugin.json` fields (for user-facing customization)
- `config.json` (for defaults)
- `static/assets/css/style.css` or `alpine.css` (for direct CSS changes)

### Adding a New Page Type
1. Create a new directory under `layouts/` matching the content type (e.g., `layouts/photo/`)
2. Create `single.html` with custom template
3. The base template will wrap it automatically

### Modifying Post Display
Edit relevant partials:
- `post-item.html`: Individual post card appearance
- `post-list.html`: How posts are listed
- `layouts/post/single.html`: Full post view

## Design Notes

- Theme uses semantic HTML with microformat classes for proper web standards compliance
- Responsive design uses flexible layouts without media queries in some areas
- Color scheme is minimal with accent color highlighting
- Typography uses system fonts (Avenir Next, Apple system fonts) for performance
- The theme supports optional custom footer (`custom_footer.html` partial)
