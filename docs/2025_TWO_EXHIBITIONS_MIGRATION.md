# VIPACH — Two 2025 exhibitions: content-first migration handoff

## Release candidate dated 2026-11-25

This update supersedes the staging-only release status below, which is retained as a dated migration record. The VIPACH organizer attested that rights-holder permission covers the **40 catalogue work display uses and 34 portrait display uses** in these two official archives on `exhibition.vipach.at`. This attestation is recorded without private correspondence or named licence instruments in the repository. No individual instrument was independently verified; the separate instrument-verification preflight still reports zero. Public re-use, third-party licensing, other websites, extra cover/OG uses and photo downloads are not authorized by this release.

- `data/staging/2025-archive-release-scope.json` binds the exact attested inventory to SHA-256. Substitution, additional scopes or a mismatched hash fails closed. The scope is organizer-attested, not a claim of ownership or open rights.
- The reviewed renderer uses 72 distinct existing Wix CDN originals for 74 uses, with a no-referrer image policy and no new asset copies, hero reuse or public license markup. The existing private VIPACH mirror is preserved for continuity, not exposed.
- The permanent routes use SPONTÁN’s layout in three languages with the exact existing Hungarian Wix biographies and 39 source-based work descriptions (37 direct plus two explicitly attributed variants), properly language-tagged. One description remains explicitly unavailable. No unsupported titles are fabricated: missing titles use original gallery position.
- The six production-format archive routes, six SPONTÁN home/permanent pages, direct predecessors, stable language switchers and confirmed press items are tested. No Wix, DNS, price, menu data for later events, or unverified stronger rights changes.
- Reviewer-only output: `node scripts/build-2025-staging-previews.mjs --archive-candidate` creates `private-review/exhibition-candidate/` with 12 local routes and noindex/disallow. Normal regeneration, once this draft is reviewed and merged, is `node scripts/build-exhibitions.mjs`. Production deployment must still be checked separately; a PR or an artifact does not mean live.


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
| Works without a Wix gallery artist link | 0 | 0 | **0** |
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
- All 40 gallery images now have exact Wix Pro Gallery item IDs and direct artist-profile links. Three previously unidentified works are attributed to Denise Trajkovska, Norbert Bánhalmi and NaylivArt. This is authorship provenance, **not** a publication licence.
- At least three source art descriptions are absent from the verified matching CMS record; those fields remain clearly unconfirmed.
- Original English/German translations of individual artist biographies and artwork descriptions are not available in the verified Wix CMS source. Their absence is not hidden.
- Existing SPONTÁN live pages, current sitemap, GitHub Pages configuration, DNS and `www.vipach.at` remain unchanged.

## Release prerequisites

1. Visual review of the six generated pages including the 74 image slots and long biographies.
2. Source/editorial review of unverified work titles, three missing work descriptions and any show-date source conflicts. All 40 artist links are now mapped from Wix.
3. Verify actual usage permissions for the images **before** copying new binaries into the public Exhibition deploy.
4. Translate/approve source biographies and work narratives if full HU/EN/DE linguistic parity is required.
5. Convert the reviewed staging pages into production `full-html` templates only after rights and content sign-off, then run CI and exact-live verification.

**No DNS, no automatic merge, no rights inference, no production deployment.**


## Central Exhibition repository — confirmed delivery architecture

- The **Exhibition** repository owns the public exhibition directory, permanent slug pages, shared SPONTÁN visual structure, three-language navigation and archive chronology.
- `main` already contains the live central Exhibition navigation (#81, #82). The current featured exhibition is SPONTÁN (2026); the two 2025 shows are listed in its menu.
- This PR's additional material is **prepublication staging** only: editorial originals, album references, SPONTÁN-component six-page renderer and review CI. It does not modify `index.html` or publish withheld works.
- The private **VIPACH** repository temporarily retains the rights-unverified binary mirror. A read-only PR #6 workflow builds an **internal, self-contained photo review artifact** by copying the 40 works and 34 portrait uses (72 distinct files) and checking every SHA-256 against the private mirror. It does not push those images into public Exhibition.
- Once the actual permissions and copy signoff are recorded, the permanent **Exhibition** repository will hold the publication-approved binaries in exhibition-specific public galleries, and the corresponding `data/exhibitions/*.json` records will become the canonical source of public pages.

### Rights and editorial release preflight

Run locally without any rights manifest:

```sh
node scripts/check-2025-publication-gate.mjs --expect-blocked
```

For a genuine release review, supply **outside this public repository** both a trusted private evidence directory and a separate JSON manifest:

```sh
VIPACH_PRIVATE_EVIDENCE_DIR=/secure/rights-documents \
VIPACH_RIGHTS_MANIFEST=/secure/2025-rights.json \
node scripts/check-2025-publication-gate.mjs --require-go
```

Private JSON schema: `schemaVersion: "vipach-2025-rights-v1"`; `usageApprovals` contains 74 per-use approvals, keyed `<exhibition-slug>/work/<work-id>` or `<exhibition-slug>/portrait/<artist-id>`. Each record must carry `key`, exact matching image `sha256`, `approved:true`, `scope:"VIPACH Exhibition website archive"`, `copyrightHolder`, `licensee`, `approvedBy`, `approvalDate`, a relative `evidenceFile` under the trusted private directory, and the evidence document's `evidenceSha256`. Expired permissions and absent/mismatched files fail.

**This automated validation does not replace a human legal review of the evidence and its scope.** No manifest currently exists, and the current preflight is NO-GO. All 40 work-to-artist links are now mapped from Wix; image republication remains blocked by absent rights evidence.

### No production promotion without new reviewed PR

After rights sign-off, prepare exact `full-html` publication templates for both exhibitions using the SPONTÁN classes and same canonical asset/design authority. Move only approved original media into corresponding public gallery paths. Set `render:"full-html"` and `publicationState:"published"` / `publicReleaseApproved:true` only after separate CI, legal and editorial checks.

`node scripts/build-exhibitions.mjs` must then generate updated permanent HTML routes in all three languages, sitemap, and chronology. Review the committed generated HTML before Pages deploy; CI-only build output does **not** prove Pages will serve it. Verify the live custom domain, images, menu links, mobile layout and exact deployed SHA. No DNS change is part of this exhibition release.

### Lingual and historical editorial gaps

The 32 original Wix CMS biographies and 37 matched work narratives are **Hungarian originals**, not EN/DE translations. The six page structures and exhibition introductions are localized, but full individual biography/artwork translation requires a separate factual translation pass. All 40 works now have original Wix gallery-to-artist provenance. Three source descriptions remain absent from verified CMS records; these descriptions must not be invented.

### Original Wix photo-to-artist mapping (2026-11-22)

The Wix Pro Gallery API was queried directly for gallery IDs `6633bc43-2980-4c26-b5d8-ff681a94d44c` (Életem képe) and `adbad2f0-6faf-45ab-84a8-131723699615` (As I Like It Austria). All 40 images matched by **exact Wix media file ID** and each gallery entry's explicitly configured artist link. Evidence for all 40 works — source image ID, gallery item ID, original gallery position, artist profile URL, corresponding work ID and media SHA-256 — is preserved in `data/staging/2025-progallery-artist-mapping.json` and checked by `scripts/check-2025-gallery-attribution.mjs` in CI.

Three previously unresolved credits are now traced to the original Wix gallery links: Életem képe #2 → Denise Trajkovska (`/artist/denisetrajkovska`), Életem képe #20 → Norbert Bánhalmi (`https://www.norbertbanhalmi.com/mybest`), As I Like It Austria #20 → NaylivArt (`https://www.bmifotoklub.at/artist/naylivart`). The external Norbert page is retained as the original Wix source link. This mapping does **not** imply that these photographers consented to image republication in the public Exhibition repository; the 74-usage rights gate stays NO-GO.
