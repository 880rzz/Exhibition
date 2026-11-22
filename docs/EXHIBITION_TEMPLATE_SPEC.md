# Exhibition template specification

This repository is a **data-driven, trilingual VIPACH exhibition engine**. Each show is a JSON record under `data/exhibitions/`. A Node build writes durable static HTML. No heavy framework.

## Locales

| Locale | HTML `lang` | Path prefix | Notes |
|--------|-------------|-------------|-------|
| EN (default) | `en` | `/` | Root is featured landing |
| HU | `hu` | `/hu/` | |
| DE (Austria) | `de-AT` | `/de/` | hreflang `de-AT` |

## URL rules

1. **Featured landing (live continuity)**  
   `/`, `/hu/`, `/de/` always render the exhibition named in `data/site.json` → `featuredExhibitionSlug` (currently `spontan-2026`).
2. **Permanent slug routes**  
   Every exhibition, including the featured one, also gets:
   - `/{slug}/`
   - `/hu/{slug}/`
   - `/de/{slug}/`
3. Prefer **keeping featured pages as the current public face** while slug routes remain the permanent archive addresses. Do not remove slug routes after the featured pointer moves.

## Data file

Path: `data/exhibitions/<slug>.json`

Required fields:

| Field | Purpose |
|-------|---------|
| `slug` | URL segment (lowercase kebab-case) |
| `status` | `active` \| `open` \| `closed` \| `historical` \| `planned` |
| `render` | `full-html` or `archive` |
| `titles` | `{ en, hu, de }` |
| `subtitle` | short supporting line per locale |
| `organizationContext` | factual framing; mark historical/pre-VIPACH carefully |
| `missing` | array of unknown fields (never invent) |

Recommended fields:

- `dates` (opening, public visit, sources)
- `venue`
- `team` (curator, organizers, patron)
- `artists` / `works` (or explicit empty + missing notes)
- `cover` (`url`, `rights`)
- `supporters.featuredEventOnly` (event-scoped only)
- `external` links to VIPACH/Wix pages
- `routes.permanentSlug`

### Status semantics

- `active` / `open` — publicly visitable now  
- `closed` — realised, visit period ended  
- `historical` — realised archive; may predate VIPACH org form  
- `planned` — not realised; pages are `noindex`; excluded from sitemap  

### SPONTÁN date sources (do not collapse silently)

- Opening: **2026-11-15 17:00** (doorTime 16:00), Europe/Vienna  
- README / some public copy: public visit **15–22 Nov 2026**  
- Live microsite hero / visit / contact dock / schema `endDate`: **15–21 Nov 2026**  
- VIPACH Wix event page: **2026-11-15 16:00 – 2026-11-22 23:59**  

Document both. Change live HTML only after an editorial decision.

## Render modes

### `full-html`

Frozen locale templates live in:

`templates/exhibitions/<slug>/{en,hu,de}.html`

Build copies them to featured + slug outputs with path/canonical/hreflang rewrites. Use this for shows that already have a complete presentation (typography, hero, curator block, artist intros, artwork gallery, partners, contact/legal, JSON-LD).

**SPONTÁN constraints**

- Preserve `gallery/` filenames and credits  
- Preserve `assets/styles.css` + `assets/site.js` patterns  
- OM SYSTEM Shop is **event-level supporter only**  
- OM SYSTEM brand partnership belongs on vipach.at, not as an engine-wide sponsor  

### `archive`

Rendered from `templates/exhibition-archive.html` using JSON only. Text-level stubs must:

- mark missing images/rights  
- avoid inventing artists, titles, or exact facts  
- keep VIPACH identity for organizer schema without rewriting pre-VIPACH history as VIPACH-only (especially `touch-2-0`)  

## Build

```bash
node scripts/build-exhibitions.mjs
node scripts/validate-schema.mjs
```

Outputs:

- featured + slug HTML  
- `sitemap.xml` (excludes `planned`)  
- `llms.txt`  
- `data/build-manifest.json`  

## Schema / CI

`scripts/validate-schema.mjs` checks:

- featured full graphs on root **and** slug paths (EN/HU/DE)  
- VIPACH organization identity + federation profile  
- ≥20 licensed artwork image nodes on SPONTÁN pages  
- archive stubs expose ExhibitionEvent + missing-field callout  
- planned pages are `noindex`  
- sitemap contains featured + permanent SPONTÁN + at least one historical slug  

GitHub Actions workflow rebuilds then validates on relevant path changes.

## Assets

| Path | Role |
|------|------|
| `assets/styles.css` | Shared visual system |
| `assets/site.js` | Progressive enhancement (motion, menu, contact dock, map) |
| `gallery/` | Exhibition image files (SPONTÁN filenames stable) |

Do not introduce a SPA framework for exhibition pages.

## Moving the featured exhibition later

1. Complete a `full-html` (or upgraded) data+template pack for the new show.  
2. Set `data/site.json` → `featuredExhibitionSlug`.  
3. Rebuild.  
4. Keep previous featured show’s slug routes online forever.  
