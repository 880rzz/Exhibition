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
- Public visits: **15–21 November 2026**; [CITYgalleryVIENNA](https://publicartists.online/event/vipach-151126/) confirms the final day and the 20:00 close. The older VIPACH Wix entry carried **22 November 2026, 23:59** as its calendar end, not the confirmed visiting period.
- Venue: CITYgalleryVIENNA by publicartists, Mahlerstraße 11, 1010 Wien
- Curator: Balogh Dávid · Organizers: Hölcz Eszter & Ayadi Lívia · Patron: Bánhalmi Norbert
- 16 photographers · 20 works
- Exhibition supporter: **OM SYSTEM** (SPONTÁN, Életem képe and As I Like It Austria). The logo links to [OM SYSTEM Shop](https://www.omsystemshop.hu/).

The exhibition poster is hosted in the VIPACH Wix Media Manager and delivered from the Wix CDN.

## Public exhibition data

Use [data/public/exhibitions.json](https://exhibition.vipach.at/data/public/exhibitions.json) for the three full public exhibition records. It is generated from the reviewed catalogue; creator attribution, organizer-attested display scope and individually verified reuse permissions are distinct. It is not a licence or media feed. The older source JSON for these three exhibitions remains in this repository but is excluded from the GitHub Pages artifact.

## Technical notes

Static HTML/CSS with minimal progressive-enhancement JavaScript. No third-party fonts, analytics or tracking scripts. Includes hreflang, canonical URLs, Event/Organization JSON-LD, sitemap, robots.txt and llms.txt.

Planned (not realised) exhibitions are generated as `noindex` stubs and omitted from the sitemap.
