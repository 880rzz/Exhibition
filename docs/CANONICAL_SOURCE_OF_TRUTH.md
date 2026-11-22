# Canonical source of truth

**Exhibition repository** (`880rzz/Exhibition`, host `https://exhibition.vipach.at/`) is the public canonical source for VIPACH exhibition records.

VIPACH (`880rzz/VIPACH`) is the community site and first-party image archive. Detailed licence evidence stays in VIPACH `private-build/staging/` and must not be mirrored into this public repo.

## Public vs private fields
Public Exhibition JSON may include: work id, creatorName (when identified), publicationStatus, licenseVerificationStatus, titleDataStatus, non-locating image checksums/dimensions, and aggregate counts.

Public Exhibition JSON must **not** include: permissionEvidence, CMS record payloads, contact/biographical staging text, or local mirror filesystem paths that would expose withheld assets.

## Current 2025 status (aligned with VIPACH V3)
- 0 licence-verified public artworks
- 37 prior-Wix-provenance-only (`license-verification-required`)
- 3 unidentified (`rights-review-required`)
- Aggregate: `partial`

## SPONTÁN closing date
Open editorial question: Exhibition presentation 21 Nov 2026 vs Wix Events 22 Nov 2026.
