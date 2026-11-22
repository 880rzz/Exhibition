# VIPACH — Two 2025 exhibitions: content-first migration handoff

**Scope:** Only **Életem képe** and **As I Like It Austria**. All other historical shows remain untouched.  
**Target:** `880rzz/Exhibition`, same editorial design system as SPONTÁN, three-language layouts.

## What is staged

| Source | Életem képe | As I Like It Austria | Total |
| --- | ---: | ---: | ---: |
| Listed exhibitors | 15 | 19 | **34** |
| Portraits with Wix source + private VIPACH mirror match | 15 | 19 | **34** |
| Catalogue work images with unique Wix source + existing private mirror | 20 | 20 | **40** |
| Original Wix CMS biographies represented | 15 | 19 | **34 profile displays**, sourced from 32 unique CMS records |
| Works with full source descriptions matched | 18 | 19 | **37** |
| Works without verified artist attribution | 2 | 1 | **3** |
| Works with verified publication rights in repository | 0 | 0 | **0** |

The 3 Életem képe portraits and biographies not present in that show's Wix CMS rows are linked to **the same person's** public Wix record in the As I Like It dataset. That cross-exhibition *profile* provenance is preserved and is **not** proof that any As I Like It image was exhibited in Életem képe.

All full original biographies and artwork descriptions are imported directly from the Wix collection `EletemKepe` via Wix Data API. The original text is Hungarian. The page framing, navigation and editorial introduction are available in **HU / EN / DE**. The original Hungarian bios and work descriptions are shown with explicit `lang="hu"` on all language pages; they have not been silently machine-translated.

## Implementation

- `data/staging/2025-two-exhibitions.json`: two exhibitions, 34 profiles, 40 work records, original Wix references, exact source SHA/mirror identifiers, image-rights review flags.
- `data/staging/2025-cms-editorial-source.json`: 32 UTF-8 original Wix CMS records containing biographies and artwork descriptions, without private contacts or CMS owner details.
- `data/staging/2025-editorial-copy.json`: three-language Exhibition-format editorial body and labels.
- `scripts/build-2025-staging-previews.mjs`: produces full work-and-artist preview pages at `staging-preview/{hu,en,de}/{slug}/index.html`.
- `assets/2025-exhibitions.css`: visual rhythm and responsive rules extending the SPONTÁN design system.
- `.github/workflows/2025-staging-preview.yml`: builds and validates all 6 previews, uploads a temporary reviewer artifact.

**Images displayed in previews** reference the existing publicly available Wix CDN originals. Their corresponding binary mirror copies are already retained in the VIPACH repository `images/wix-mirror/` (all 40 works and all 34 portrait image source IDs have matched files). The image binaries have **not** been copied into the public Exhibition repository or its live Pages deployment. No unverified image is newly published via GitHub Pages.

## Publication barriers

- Review artifact only. `staging-preview/` is not part of the current Exhibition production build and carries `noindex,nofollow,noimageindex`.
- User-requested content assembly is separate from image-use permissions. All 40 art works and 34 portraits remain **rights-review-required** or **license-verification-required**, not cleared for a new release.
- Three gallery works' artist identification is still unresolved. Their images are staged with provenance; no artist name was invented.
- At least three source art descriptions are absent from the verified matching CMS record; those fields remain clearly unconfirmed.
- Original English/German translations of individual artist biographies and artwork descriptions are not available in the verified Wix CMS source. Their absence is not hidden.
- Existing SPONTÁN live pages, current sitemap, GitHub Pages configuration, DNS and `www.vipach.at` remain unchanged.

## Release prerequisites

1. Visual review of the six generated pages including the 74 image slots and long biographies.
2. Source/editorial review of missing work titles and three unidentified artist credits; resolve show-date source conflicts.
3. Verify actual usage permissions for the images **before** copying new binaries into the public Exhibition deploy.
4. Translate/approve source biographies and work narratives if full HU/EN/DE linguistic parity is required.
5. Convert the reviewed staging pages into production `full-html` templates only after rights and content sign-off, then run CI and exact-live verification.

**No DNS, no automatic merge, no rights inference, no production deployment.**
