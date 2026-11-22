# Exhibition migration inventory

Inventory of shows targeted by the VIPACH exhibition engine, with a migration matrix. **Do not invent** missing artists, titles, image rights, or exact facts.

## Sources consulted

| Source | Role |
|--------|------|
| Live microsite `exhibition.vipach.at` (EN/HU/DE) | SPONTÁN presentation, schema, gallery filenames |
| Repo `README.md` / `llms.txt` | SPONTÁN dates + prior Vienna shows |
| `https://www.vipach.at/fotokiallitasok` | Ordered history listing |
| `https://www.vipach.at/event-details/spontan-vipach-fotokiallitas-2026` | Wix event window incl. 22 Nov close |
| `https://www.vipach.at/asilikeit` | As I Like It Austria text-level facts |
| `https://www.vipach.at/eletemkepe` | Életem képe text-level facts |
| Banhalmi Art external archive pages | Related notes only (Touch / Én a Nő / Femme Fatale) — not treated as complete VIPACH ownership packs |

## Migration matrix

| Slug | Title (as recorded) | Year | Status | Render | Root featured? | Permanent slug pages | Artists | Works | Images in repo | Rights | Team | Cover | Notes / blockers |
|------|---------------------|------|--------|--------|----------------|----------------------|---------|-------|----------------|--------|------|-------|------------------|
| `spontan-2026` | SPONTÁN / SPONTANEOUS / SPONTAN | 2026 | `closed`* | `full-html` | **Yes** (`/`, `/hu/`, `/de/`) | Yes | **16** in data | **20** VisualArtwork + Denise extra ImageObject noted | Yes (`gallery/`) | On-page credits preserved | Curator Balogh Dávid; organizers Hölcz Eszter & Ayadi Lívia; patron Bánhalmi Norbert | Wix CDN poster | *Closed vs Wix-through-22 conflict documented. OM SYSTEM Shop = event supporter only. |
| `touch-2-0` | Touch 2.0 | 2024 | `historical` | `archive` | No | Yes | missing | missing | missing | missing | missing | missing | Spiritual Touch · München. May predate VIPACH org form — **do not rebrand VIPACH-only**. |
| `en-a-no` | Én a NŐ | 2024 | `historical` | `archive` | No | Yes | missing | missing | missing | missing | missing | missing | Bewusst Sein Im Fokus · Wien (VIPACH listing spelling variant noted). |
| `famme-fatale` | Famme Fatale | 2025 | `historical` | `archive` | No | Yes | missing | missing | missing | missing | missing | missing | VIPACH spelling **Famme**; external Banhalmi page uses Femme Fatale / 2025-03-02 — pending confirmation. |
| `as-i-like-it-austria` | As I Like It Austria | 2025 | `historical` | `archive` | No | Yes | partial names only | missing | missing | missing | Curator + organizer text from VIPACH page | Wix image URL observed; rights missing | Visit 2025-11-30–12-06. Full roster/images not migrated. |
| `eletem-kepe` | Életem képe / Picture of My Life | 2025 | `historical` | `archive` | No | Yes | partial names only | claimed 20 | missing | missing | Curator + organizer text from VIPACH page | missing | Visit 2025-12-07–13; 15 photographers / 20 works claimed on sources. |
| `eletem-kepe-2-0` | Életem képe 2.0 | 2027 | `planned` | `archive` | No | Yes (`noindex`) | n/a | n/a | n/a | n/a | missing | missing | April 2027 planned — **not realised**. Exact days/venue missing. |
| `famme-fatale-2-0` | Famme Fatale 2.0 | 2027 | `planned` | `archive` | No | Yes (`noindex`) | n/a | n/a | n/a | n/a | missing | missing | April 2027 planned — **not realised**. |

\* SPONTÁN status rationale: live schema `endDate` = 2026-11-21; extraction day 2026-11-22. Wix still listed through 22 Nov 23:59. See `data/exhibitions/spontan-2026.json` → `statusNotes` / `dates.publicVisit.sources`.

## SPONTÁN extraction checklist

| Surface | In frozen HTML templates | In JSON data | Gap |
|---------|--------------------------|--------------|-----|
| Titles EN/HU/DE | Yes | Yes | — |
| Hero + dates presentation | Yes | Sources documented | Editorial 21 vs 22 Nov |
| Cover / og:image | Yes | URL recorded | Rights confirmation |
| Curator block | Yes | Yes | — |
| Organizers / patron | Yes | Yes | — |
| Artist intros | Yes | IDs + names + work titles | Long-form intros not duplicated into JSON |
| Artwork gallery + filenames | Yes | Paths in JSON | Prices/dates/body still HTML-only |
| Lightbox / image UX | Presentation via existing CSS/JS patterns | — | No separate lightbox module found in current `site.js`; preserve gallery markup as-is |
| Partners / OM SYSTEM Shop | Yes | Event-only supporter entry | Brand partnership stays on vipach.at |
| Contact / legal footer | Yes | Org contact in `data/site.json` | — |
| SEO / hreflang / JSON-LD | Yes | Event ids for root + slug | Slug pages rewrite event `@id` to `/spontan-2026/#event` |

## Priority gaps (next migrations)

1. Resolve SPONTÁN public-visit end date (21 vs 22) editorially, then sync schema + copy.  
2. Confirm cover/poster reuse rights for archive mirrors.  
3. Migrate As I Like It Austria + Életem képe artist/work inventories with rights clearance.  
4. Confirm Famme/Femme spelling and exact 2025 dates for `famme-fatale`.  
5. Expand `touch-2-0` / `en-a-no` only from rights-cleared primary sources; keep pre-VIPACH framing.  
6. Replace planned 2027 stubs when public announcements exist.

## Engine files

| Path | Purpose |
|------|---------|
| `data/site.json` | Featured slug + org identity |
| `data/exhibitions/*.json` | Per-show records |
| `templates/exhibitions/spontan-2026/` | Frozen full SPONTÁN HTML |
| `templates/exhibition-archive.html` | Archive stub chrome |
| `scripts/build-exhibitions.mjs` | Static generator |
| `scripts/validate-schema.mjs` | Multi-exhibition regression |
| `docs/EXHIBITION_TEMPLATE_SPEC.md` | Authoring rules |
