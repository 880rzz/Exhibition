#!/usr/bin/env node
/**
 * Regenerate exhibition aggregate counts from work records (not hand-edited constants).
 * Separates source-claimed participant counts from identified catalogue creators.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const exhibitionsDir = path.join(root, 'data/exhibitions');

function deriveCounts(exhibition) {
  const works = Array.isArray(exhibition.works) ? exhibition.works : [];
  const identifiedCreators = [
    ...new Set(
      works
        .filter((w) => w.creatorIdentificationStatus === 'identified' && w.creatorName)
        .map((w) => String(w.creatorName).trim())
        .filter(Boolean)
    ),
  ].sort((a, b) => a.localeCompare(b));

  const licenceVerifiedApprovedForPublicDisplay = works.filter(
    (w) =>
      w.publicationStatus === 'approved-for-public-display' &&
      w.licenseVerificationStatus === 'verified' &&
      w.publicReleaseApproved === true
  ).length;

  const priorWixPublicationOnlyLicenseVerificationRequired = works.filter(
    (w) =>
      w.publicationStatus === 'license-verification-required' ||
      w.licenseVerificationStatus === 'license-verification-required'
  ).length;

  const rightsReviewRequiredUnidentified = works.filter(
    (w) =>
      w.publicationStatus === 'rights-review-required' ||
      w.creatorIdentificationStatus === 'unidentified' ||
      w.licenseVerificationStatus === 'absent'
  ).length;

  const withheldRightsReviewRequired = works.filter(
    (w) => w.publicationStatus === 'rights-review-required'
  ).length;

  const approvedForPublicDisplay = licenceVerifiedApprovedForPublicDisplay;

  // Source-claimed participant count (marketing/page claim) vs catalogue-identified creators.
  const sourceClaimedPhotographers =
    exhibition.counts?.sourceClaimedPhotographers ??
    exhibition.counts?.photographersSourceClaim ??
    null;

  const out = {
    works: works.length,
    identifiedCatalogueCreators: identifiedCreators.length,
    identifiedCatalogueCreatorNames: identifiedCreators,
    approvedForPublicDisplay,
    withheldRightsReviewRequired,
    licenceVerifiedApprovedForPublicDisplay,
    priorWixPublicationOnlyLicenseVerificationRequired,
    rightsReviewRequiredUnidentified,
    derivedFromWorksAt: new Date().toISOString().slice(0, 10),
    derivation: 'scripts/regenerate_exhibition_counts.mjs — counts must match works[]',
  };

  if (sourceClaimedPhotographers != null) {
    out.sourceClaimedPhotographers = sourceClaimedPhotographers;
  }

  // Keep SPONTÁN schema claim fields when no works[] inventory exists yet.
  if (!works.length && exhibition.counts) {
    return {
      ...exhibition.counts,
      approvedForPublicDisplay: exhibition.counts.approvedForPublicDisplay ?? 0,
      licenceVerifiedApprovedForPublicDisplay:
        exhibition.counts.licenceVerifiedApprovedForPublicDisplay ?? 0,
      note: 'No works[] inventory yet; schema claim counts retained. Do not invent approvedForPublicDisplay.',
    };
  }

  // photographers field = identified catalogue creators when works exist (not stale marketing 18/19).
  out.photographers = identifiedCreators.length;
  return out;
}

function hardenCover(cover) {
  const blocked =
    'unverified — do not embed as cleared cover/OG until licence evidence exists';
  if (!cover || typeof cover !== 'object') {
    return {
      url: 'missing',
      rights: blocked,
      publicationStatus: 'rights-review-required',
      publicReleaseApproved: false,
    };
  }
  const url = cover.url && cover.url !== 'missing' ? cover.url : 'missing';
  return {
    ...cover,
    url,
    rights: blocked,
    publicationStatus: 'rights-review-required',
    publicReleaseApproved: false,
  };
}

function main() {
  const files = fs.readdirSync(exhibitionsDir).filter((f) => f.endsWith('.json'));
  for (const file of files) {
    const full = path.join(exhibitionsDir, file);
    const exhibition = JSON.parse(fs.readFileSync(full, 'utf8'));
    const previous = exhibition.counts || {};

    // Preserve explicit source claim for Életem képe (15 on VIPACH page vs 13 identified).
    if (exhibition.slug === 'eletem-kepe') {
      exhibition.counts = {
        ...deriveCounts({
          ...exhibition,
          counts: {
            ...previous,
            sourceClaimedPhotographers: 15,
          },
        }),
        sources: previous.sources || [
          'https://www.vipach.at/eletemkepe (15 Hungarian photographers / 20 works)',
          'https://exhibition.vipach.at/ history copy',
        ],
        participantCountNote:
          'sourceClaimedPhotographers=15 (VIPACH page claim); identifiedCatalogueCreators derived from works[] (currently 13). Do not collapse these into one number.',
      };
    } else if (Array.isArray(exhibition.works) && exhibition.works.length) {
      exhibition.counts = {
        ...previous,
        ...deriveCounts(exhibition),
      };
      // Drop stale marketing photographer override when works exist.
      delete exhibition.counts.sources;
    } else if (exhibition.counts) {
      exhibition.counts = {
        ...exhibition.counts,
        approvedForPublicDisplay: exhibition.counts.approvedForPublicDisplay ?? 0,
        licenceVerifiedApprovedForPublicDisplay:
          exhibition.counts.licenceVerifiedApprovedForPublicDisplay ?? 0,
      };
    }

    if (exhibition.cover) {
      exhibition.cover = hardenCover(exhibition.cover);
    } else if (exhibition.slug === 'eletem-kepe' || exhibition.slug === 'as-i-like-it-austria') {
      exhibition.cover = hardenCover({ url: 'missing' });
    }

    if (exhibition.rightsInventory?.counts && Array.isArray(exhibition.works) && exhibition.works.length) {
      const c = exhibition.counts;
      exhibition.rightsInventory.counts = {
        licenceVerifiedApprovedForPublicDisplay: c.licenceVerifiedApprovedForPublicDisplay,
        priorWixPublicationOnlyLicenseVerificationRequired:
          c.priorWixPublicationOnlyLicenseVerificationRequired,
        rightsReviewRequiredUnidentified: c.rightsReviewRequiredUnidentified,
      };
      exhibition.rightsInventory.schema = 'public-safe-summary-v4';
      exhibition.rightsInventory.note =
        'Aggregates regenerated from works[]. Detailed licence evidence stays in VIPACH private-build/staging.';
    }

    fs.writeFileSync(full, `${JSON.stringify(exhibition, null, 2)}\n`);
    console.log(
      `${exhibition.slug}: works=${exhibition.counts?.works ?? 0} ` +
        `identifiedCreators=${exhibition.counts?.identifiedCatalogueCreators ?? 'n/a'} ` +
        `approvedForPublicDisplay=${exhibition.counts?.approvedForPublicDisplay ?? 0} ` +
        `licenceVerified=${exhibition.counts?.licenceVerifiedApprovedForPublicDisplay ?? 0}`
    );
  }
}

main();
