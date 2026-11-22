# Canonical source of truth

**Exhibition repository** (`880rzz/Exhibition`, host `https://exhibition.vipach.at/`) is the public canonical source for VIPACH exhibition records.

VIPACH (`880rzz/VIPACH`) is the community site and first-party image archive. Detailed licence evidence stays in VIPACH `private-build/staging/` and must not be mirrored into this public repo.

## Public vs private fields
Public Exhibition JSON may include: work id, creatorName (when identified), publicationStatus, licenseVerificationStatus, titleDataStatus, non-locating image checksums/dimensions, and aggregate counts.

**Separation actually enforced (22 Nov 2026):** `data/exhibitions/*.json` is the public exhibition catalogue; `data/staging/2025-*.json` contains the original, already-public Wix editorial biographies, work narratives, source media IDs and private-mirror provenance pointers. These staging files are present in the public **GitHub source** and therefore are not confidential; the Pages Jekyll `_config.yml` excludes them from the **served website**. Do not put private contact details, permission evidence, unpublished consent records, authentic private local filesystem locations, or withheld image binaries into either public source or public Pages. Private licence instruments stay outside this repository. Repository source visibility and Pages build exclusion are not the same as privacy.

## Current 2025 status (V4.1 — regenerated from works[])
Run `node scripts/regenerate_exhibition_counts.mjs` (also invoked by `build-exhibitions.mjs`).

| Exhibition | Works | Source-claimed participants | Identified catalogue creators | Licence-verified approved | Prior-Wix / verification-required | Rights-review |
|---|---:|---:|---:|---:|---:|---:|
| Életem képe | 20 | **15** (VIPACH page claim) | **13** | **0** | 18 | 2 |
| As I Like It Austria | 20 | — | **19** | **0** | 19 | 1 |
| **Total** | **40** | — | — | **0** | **37** | **3** |

`approvedForPublicDisplay` equals licence-verified only (currently **0**). Prior Wix appearance must never inflate that field.

**Later attribution update:** The 13/19 author totals and 37/3 rights buckets above describe the **older `data/exhibitions/*.json` aggregate snapshot**, not the completed Wix photo-to-artist mapping. As of Exhibition PR #84 (`6dbe952`), `data/staging/2025-two-exhibitions.json` and `data/staging/2025-progallery-artist-mapping.json` record **40/40** exact Wix Pro Gallery image IDs, artist-profile links and SHA-256 provenance, with **0 unknown work-artist pairings**. This change does *not* supply any new image republication licence: **0/40 artworks and 0/34 portrait-use records are rights-approved for new public publishing**. The primary historical `data/exhibitions/*.json` records should be reconciled before they are treated as canonical complete galleries.

## SPONTÁN live HTML media (V4.1)
Frozen SPONTÁN pages still embed historical Wix CDN URLs (portraits / OG / brand) to preserve the live exhibition experience and artist credits. Those embeds are inventoried in `data/exhibitions/spontan-2026.json` → `liveHtmlMedia` with `publicationStatus: rights-review-required`, and fully enumerated (HU/EN/DE HTML) in `docs/IMAGE_RIGHTS_INVENTORY.json` (V4.2). **Prior public appearance ≠ verified republication licence.** Live HTML is not auto-mutated by the inventory script.

`counts.licensedImageObjectsInSchema` counts schema.org ImageObject nodes only — it is not a licence-verified total.

## Cover / OG policy
SPONTÁN and historical cover/OG assets remain `rights-review-required` until a verified licence instrument exists.

## SPONTÁN closing date
Open editorial question: Exhibition presentation 21 Nov 2026 vs Wix Events 22 Nov 2026.
