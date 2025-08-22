# Catalogue Portal (Minimal Static Version)
Stack: Pure static HTML/CSS/JS, Google Sheets (CSV) and optional Apps Script JSON/JSONP.
No build tools. Host directly on GitHub Pages.

## Setup
1) Open `config.js` and fill:
   - SHEET_CSV_URL (Publish to web → CSV of `Catalog_Public_Sheet`)
   - APPS_SCRIPT_URL (optional Web App endpoint; supports JSONP)

2) Commit and push. Enable GitHub Pages (from the main branch / root).

## Develop locally
Just open `index.html` in a browser (or serve with any static server).

## Notes
- URL holds all filters (canonical links).
- Single-column, mobile-first layout (one card per row).
- WhatsApp share uses wa.me intent (no API).
- PDF export is optional and purely client-side.
