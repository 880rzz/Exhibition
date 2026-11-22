# Canonical source of truth

**Exhibition repository** (`880rzz/Exhibition`, host `https://exhibition.vipach.at/`) is the public canonical source for VIPACH exhibition records.

VIPACH (`880rzz/VIPACH`) is the community site and first-party image archive. Detailed licence evidence stays in VIPACH `private-build/staging/` and must not be mirrored into this public repo.

## Public vs private fields
Public Exhibition JSON may include: work id, creatorName (when identified), publicationStatus, licenseVerificationStatus, titleDataStatus, non-locating image checksums/dimensions, and aggregate counts.

Public Exhibition JSON must **not** include: permissionEvidence, CMS record payloads, contact/biographical staging text, or local mirror filesystem paths that would expose withheld assets.

## Current 2025 status (V4 — regenerated from works[])
Run `node scripts/regenerate_exhibition_counts.mjs` (also invoked by `build-exhibitions.mjs`).

| Exhibition | Works | Source-claimed participants | Identified catalogue creators | Licence-verified approved | Prior-Wix / verification-required | Rights-review |
|---|---:|---:|---:|---:|---:|---:|
| Életem képe | 20 | **15** (VIPACH page claim) | **13** | **0** | 18 | 2 |
| As I Like It Austria | 20 | — | **19** | **0** | 19 | 1 |
| **Total** | **40** | — | — | **0** | **37** | **3** |

`approvedForPublicDisplay` equals licence-verified only (currently **0**). Prior Wix appearance must never inflate that field.

## Cover / OG policy
SPONTÁN and historical cover/OG assets are marked `publicationStatus: rights-review-required` until a verified licence instrument exists. Unverified covers must not be treated as cleared public media.

## SPONTÁN closing date
Open editorial question: Exhibition presentation 21 Nov 2026 vs Wix Events 22 Nov 2026.
