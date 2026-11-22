# Exhibition image rights — V4.2 inventory (no invented licences)

**Generated inventory:** `docs/IMAGE_RIGHTS_INVENTORY.json` via `node scripts/inventory_published_images.mjs`  
**Policy:** Prior Wix publication is provenance only. Live Exhibition HTML is **not** auto-mutated by this workstream.

## Separation

| Bucket | Count / status | Republication |
|---|---|---|
| SPONTÁN 2026 live HTML external Wix CDN | 17 unique `static.wixstatic.com` refs (inventory) | **OPEN** — `rights-review-required` |
| First-party `/gallery/` refs | 22 | Tracked; clearance still required per work |
| First-party `/assets/` | 1 | Brand/UI — separate from exhibitor photos |
| 2025 Életem képe + As I Like It works | 40 catalogue works in Exhibition JSON | `licenceVerifiedApprovedForPublicDisplay` = **0** |

## Licence search (in-repo)
Searched: `docs/**`, `data/exhibitions/*.json`, README, llms, companion VIPACH `private-build/staging`.  
**Result:** 0 verifiable publication licence instruments / nomination terms / model releases that clear Wix CDN embeds or 2025 works for **new** republication.

## Roles covered
Inventory tags `og`, `favicon`, `hero-candidate` where detectable from markup context. OG/Wix embeds remain review-required.

## What this PR does / does not do
- **Does:** reproducible inventory JSON + script; keeps status OPEN without evidence.
- **Does not:** rewrite live HTML, invent licences, strip artist names, or delete the historical archive.

## Next (human / legal)
For each image intended for new surfaces: rightsholder, licensee, use mode, territory/time, and documentary evidence before any republish gate.
