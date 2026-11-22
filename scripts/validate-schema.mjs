#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const orgUrl = 'https://www.vipach.at/#organization';
const wd = 'https://www.wikidata.org/wiki/Q138416887';
const profile = 'https://okoszisztema.kozpontiszovetseg.at/intezmenyek/vipach/';
const base = 'https://exhibition.vipach.at';

const site = JSON.parse(fs.readFileSync(path.join(root, 'data/site.json'), 'utf8'));
const exhibitions = fs
  .readdirSync(path.join(root, 'data/exhibitions'))
  .filter((f) => f.endsWith('.json'))
  .map((f) => JSON.parse(fs.readFileSync(path.join(root, 'data/exhibitions', f), 'utf8')));

assert.ok(exhibitions.length >= 2, 'expected multi-exhibition data set');
assert.ok(
  exhibitions.some((e) => e.slug === site.featuredExhibitionSlug),
  'featured exhibition missing from data/'
);

function readLdJson(filePath) {
  const source = fs.readFileSync(filePath, 'utf8');
  const blocks = [...source.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
  assert.equal(blocks.length, 1, `${filePath}: exactly one structured-data graph`);
  return { source, doc: JSON.parse(blocks[0][1]) };
}

function pagePath(localeId, slug, mode) {
  if (mode === 'featured') {
    return localeId === 'en' ? 'index.html' : path.join(localeId, 'index.html');
  }
  return localeId === 'en' ? path.join(slug, 'index.html') : path.join(localeId, slug, 'index.html');
}

function localeCode(localeId) {
  return localeId === 'de' ? 'de-AT' : localeId;
}

// --- Featured SPONTÁN full graph regression (root + permanent slug) ---
const featured = exhibitions.find((e) => e.slug === site.featuredExhibitionSlug);
assert.equal(featured?.render, 'full-html', 'featured exhibition must be full-html for live continuity');

for (const mode of ['featured', 'slug']) {
  for (const localeId of ['en', 'hu', 'de']) {
    const rel = pagePath(localeId, featured.slug, mode);
    const filePath = path.join(root, rel);
    assert.ok(fs.existsSync(filePath), `missing ${rel}`);
    const { doc } = readLdJson(filePath);
    assert.equal(doc['@context'], 'https://schema.org', rel);
    assert(Array.isArray(doc['@graph']) && doc['@graph'].length >= 64, `${rel}: art/artist graph missing`);
    const graph = doc['@graph'];
    const ids = graph.map((x) => x['@id']).filter(Boolean);
    assert.equal(new Set(ids).size, ids.length, `${rel}: duplicate @id`);
    const org = graph.find((x) => x['@id'] === orgUrl);
    assert(org?.sameAs?.includes(wd), `${rel}: canonical VIPACH identity`);
    assert.equal(org.subjectOf?.['@id'], profile, `${rel}: federation source profile`);

    const eventId =
      mode === 'featured'
        ? `${base}/#event`
        : `${base}/${featured.slug}/#event`;
    const event = graph.find((x) => x['@id'] === eventId);
    assert.ok(event, `${rel}: exhibition event @id ${eventId}`);
    assert.equal(event?.organizer?.['@id'], orgUrl, `${rel}: event organizer`);

    const mainPage = graph.find(
      (x) => x['@type'] === 'WebPage' && String(x.url || '').startsWith(base)
    );
    assert.equal(mainPage?.inLanguage, localeCode(localeId), `${rel}: page language`);
    assert.equal(mainPage?.publisher?.['@id'], orgUrl, `${rel}: page publisher`);

    const creator = graph.find((x) => x['@id'] === `${base}/#norbert-banhalmi`);
    assert(creator?.sameAs?.includes('https://www.wikidata.org/wiki/Q56391118'), `${rel}: Norbert identity`);
    assert(
      graph.filter((x) => x['@type'] === 'ImageObject' || String(x['@id']).includes('#licensed-image')).length >= 20,
      `${rel}: artwork images lost`
    );

    if (featured.counts) {
      assert.equal(featured.counts.photographers, 16, 'SPONTÁN photographer count');
      assert.equal(featured.counts.worksClaimed, 20, 'SPONTÁN works claim');
    }
  }
}

// --- Archive / planned stubs: lighter schema, durable URLs ---
for (const exhibition of exhibitions.filter((e) => e.render === 'archive')) {
  for (const localeId of ['en', 'hu', 'de']) {
    const rel = pagePath(localeId, exhibition.slug, 'slug');
    const filePath = path.join(root, rel);
    assert.ok(fs.existsSync(filePath), `missing archive page ${rel}`);
    const { doc, source } = readLdJson(filePath);
    assert.equal(doc['@context'], 'https://schema.org', rel);
    assert(Array.isArray(doc['@graph']) && doc['@graph'].length >= 2, `${rel}: archive graph too small`);
    const page = doc['@graph'].find((x) => x['@type'] === 'WebPage');
    assert.equal(page?.inLanguage, localeCode(localeId), `${rel}: archive language`);
    assert.equal(page?.publisher?.['@id'], orgUrl, `${rel}: archive publisher`);
    const event = doc['@graph'].find((x) => x['@type'] === 'ExhibitionEvent');
    assert.ok(event, `${rel}: ExhibitionEvent missing`);
    assert.equal(event?.organizer?.['@id'], orgUrl, `${rel}: archive organizer`);
    assert.match(source, /Missing|Hiányzó|Fehlend/, `${rel}: missing-fields callout required`);
    if (exhibition.status === 'planned') {
      assert.match(source, /noindex/i, `${rel}: planned pages should noindex`);
      assert.equal(exhibition.realized, false, `${exhibition.slug} must remain unrealised`);
    }
    if (exhibition.slug === 'touch-2-0') {
      assert.match(
        source,
        /predate|Historical|történelmi|Historisch|VIPACH-only|organizational/i,
        `${rel}: touch-2-0 must not read as VIPACH-only rebrand`
      );
    }
  }
}

// --- Counts must be derived from works[], never stale marketing approvals ---
for (const exhibition of exhibitions.filter((e) => Array.isArray(e.works) && e.works.length)) {
  const works = exhibition.works;
  const identified = new Set(
    works
      .filter((w) => w.creatorIdentificationStatus === 'identified' && w.creatorName)
      .map((w) => String(w.creatorName).trim())
  );
  const licenceVerified = works.filter(
    (w) =>
      w.publicationStatus === 'approved-for-public-display' &&
      w.licenseVerificationStatus === 'verified' &&
      w.publicReleaseApproved === true
  ).length;
  assert.equal(
    exhibition.counts?.licenceVerifiedApprovedForPublicDisplay,
    licenceVerified,
    `${exhibition.slug}: licenceVerified count must match works`
  );
  assert.equal(
    exhibition.counts?.approvedForPublicDisplay,
    licenceVerified,
    `${exhibition.slug}: approvedForPublicDisplay must equal licence-verified (not prior-Wix counts)`
  );
  assert.equal(
    exhibition.counts?.identifiedCatalogueCreators,
    identified.size,
    `${exhibition.slug}: identifiedCatalogueCreators must match works`
  );
  assert.equal(
    exhibition.counts?.photographers,
    identified.size,
    `${exhibition.slug}: photographers field is identified catalogue creators`
  );
  assert.equal(licenceVerified, 0, `${exhibition.slug}: expected 0 licence-verified until instruments exist`);
  assert.equal(
    exhibition.cover?.publicationStatus,
    'rights-review-required',
    `${exhibition.slug}: cover must remain rights-review-required until verified`
  );
  if (exhibition.slug === 'eletem-kepe') {
    assert.equal(exhibition.counts.sourceClaimedPhotographers, 15, 'Életem képe source claim stays 15');
    assert.equal(exhibition.counts.identifiedCatalogueCreators, 13, 'Életem képe identified creators = 13');
  }
}

assert.equal(
  exhibitions.find((e) => e.slug === 'spontan-2026')?.cover?.publicationStatus,
  'rights-review-required',
  'SPONTÁN cover/OG not cleared for republication without licence evidence'
);

// --- Sitemap / robots continuity ---
const sitemap = fs.readFileSync(path.join(root, 'sitemap.xml'), 'utf8');
assert.match(sitemap, /https:\/\/exhibition\.vipach\.at\//, 'featured EN in sitemap');
assert.match(sitemap, /https:\/\/exhibition\.vipach\.at\/spontan-2026\//, 'permanent SPONTÁN slug in sitemap');
assert.match(sitemap, /https:\/\/exhibition\.vipach\.at\/as-i-like-it-austria\//, 'archive slug in sitemap');
assert.doesNotMatch(sitemap, /eletem-kepe-2-0/, 'planned exhibitions excluded from sitemap');
const robots = fs.readFileSync(path.join(root, 'robots.txt'), 'utf8');
assert.match(robots, /Sitemap:\s*https:\/\/exhibition\.vipach\.at\/sitemap\.xml/, 'robots sitemap');

console.log(
  `PASS: multi-exhibition schema OK — featured full graphs (root+slug ×3 locales), ${exhibitions.length} data files, archive stubs validated.`
);
