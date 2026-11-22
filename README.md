# VIPACH Exhibition engine

Multilingual static exhibition site for **VIPACH — Vienna Photo Art & Creative Hub**.

Currently the featured landing still presents **SPONTÁN / SPONTANEOUS / SPONTAN 2026** in full. The same show (and historical/planned shows) also have permanent slug URLs.

## Routes

### Featured landing (live continuity)
- `/` — English
- `/de/` — German (Austria)
- `/hu/` — Hungarian

### Permanent exhibition URLs
- `/{slug}/`, `/hu/{slug}/`, `/de/{slug}/`  
  Example: `/spontan-2026/`, `/hu/spontan-2026/`, `/de/spontan-2026/`

Archive stubs also exist for historical and planned shows (see `docs/EXHIBITION_MIGRATION_INVENTORY.md`).

## Architecture

| Path | Role |
|------|------|
| `data/site.json` | Featured exhibition pointer + org identity |
| `data/exhibitions/*.json` | Per-exhibition records |
| `templates/exhibitions/<slug>/` | Frozen full-HTML locale templates |
| `templates/exhibition-archive.html` | Text-level archive stub template |
| `scripts/build-exhibitions.mjs` | Generates featured + slug pages, sitemap, llms.txt |
| `scripts/validate-schema.mjs` | Multi-exhibition JSON-LD / route regression |
| `assets/styles.css`, `assets/site.js` | Shared presentation (no heavy framework) |
| `gallery/` | SPONTÁN artwork files (filenames/credits preserved) |

```bash
node scripts/build-exhibitions.mjs
node scripts/validate-schema.mjs
```

Docs:
- `docs/EXHIBITION_TEMPLATE_SPEC.md`
- `docs/EXHIBITION_MIGRATION_INVENTORY.md`

## SPONTÁN 2026 (featured)

- Opening: 15 November 2026, 17:00 (guest reception from 16:00)
- Public visit sources differ and are documented in data:
  - README / some public copy: **15–22 November 2026**
  - Live microsite hero/visit/schema: **15–21 November 2026**
  - VIPACH Wix event page: through **22 November 2026, 23:59**
- Venue: CITYgalleryVIENNA by publicartists, Mahlerstraße 11, 1010 Wien
- Curator: Balogh Dávid · Organizers: Hölcz Eszter & Ayadi Lívia · Patron: Bánhalmi Norbert
- 16 photographers · 20 works
- Featured event supporter: **OM SYSTEM Shop** (SPONTÁN-only; OM SYSTEM brand partnership belongs on [vipach.at](https://www.vipach.at/))

The exhibition poster is hosted in the VIPACH Wix Media Manager and delivered from the Wix CDN.

## Technical notes

Static HTML/CSS with minimal progressive-enhancement JavaScript. No third-party fonts, analytics or tracking scripts. Includes hreflang, canonical URLs, Event/Organization JSON-LD, sitemap, robots.txt and llms.txt.

Planned (not realised) exhibitions are generated as `noindex` stubs and omitted from the sitemap.
