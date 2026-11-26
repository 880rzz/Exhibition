#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { archive2025Release } from './exhibition-2025-release-scope.mjs';
import { fileURLToPath } from 'node:url';

import { gallerySources } from './exhibition-seo.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const orgUrl = 'https://www.vipach.at/#organization';
const wd = 'https://www.wikidata.org/wiki/Q138416887';
const profile = 'https://okoszisztema.kozpontiszovetseg.at/intezmenyek/vipach/';
const base = 'https://exhibition.vipach.at';
const reviewedArchives=archive2025Release();

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
    const { doc, source } = readLdJson(filePath);
    assert.equal(doc['@context'], 'https://schema.org', rel);
    assert(Array.isArray(doc['@graph']) && doc['@graph'].length >= 64, `${rel}: art/artist graph missing`);
    const graph = doc['@graph'];
    const ids = graph.map((x) => x['@id']).filter(Boolean);
    assert.equal(new Set(ids).size, ids.length, `${rel}: duplicate @id`);
    const org = graph.find((x) => x['@id'] === orgUrl);
    assert(org?.sameAs?.includes(wd), `${rel}: canonical VIPACH identity`);
    assert.equal(org.subjectOf?.['@id'], profile, `${rel}: federation source profile`);

    const eventId = base + '/' + featured.slug + '/#event';
    const event = graph.find((x) => x['@id'] === eventId);
    assert.ok(event, `${rel}: exhibition event @id ${eventId}`);
    assert.equal(event?.organizer?.['@id'], orgUrl, `${rel}: event organizer`);

    const mainPage = graph.find(
      (x) => x['@type'] === 'WebPage' && String(x.url || '').startsWith(base)
    );
    const canonical = source.match(/<link rel="canonical" href="([^"]+)">/)?.[1];
    assert.equal(mainPage?.['@id'], canonical + '#webpage', rel);
    assert.equal(mainPage?.url, canonical, rel);
    assert.equal(mainPage?.mainEntity?.['@id'], eventId, rel);
    assert.equal(event.url, base + '/' + featured.slug + '/', rel);
    assert.equal(event.endDate, '2026-11-21T20:00:00+01:00', rel);
    assert.ok(!event.offers, rel + ': do not claim current availability for a past show');
    assert.ok(!event.image, rel + ': do not publish reviewed-only poster as metadata');
    assert.ok(source.includes('<meta property="og:url" content="' + canonical + '">'), rel);
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
    if (reviewedArchives?.slugs.includes(exhibition.slug)) {
      assert.equal(event?.organizer?.['@id'], orgUrl, `${rel}: reviewed archive organizer`);
      assert.match(source, /data-route-mode="slug"/, rel);
      assert.match(source, /content="index,follow"/, rel);
      const graph = doc['@graph'];
      const show = reviewedArchives.shows.find(x => x.slug === exhibition.slug);
      const eventId = base + '/' + exhibition.slug + '/#event';
      assert.equal(page?.mainEntity?.['@id'], eventId, rel);
      assert.equal(event['@id'], eventId, rel);
      assert.equal(event.url, base + '/' + exhibition.slug + '/', rel);
      const location = graph.find(x => x['@id'] === event.location['@id']);
      assert.equal(location?.address?.streetAddress, 'Mahlerstraße 11', rel);
      assert.ok(page.citation.includes(gallerySources[exhibition.slug]), rel);
      assert.ok(event.subjectOf.some(x=>x.url===gallerySources[exhibition.slug]), rel);
      assert.equal(location?.address?.postalCode, '1010', rel);
      const works = graph.filter(x=>x['@type']==='VisualArtwork');
      const people = new Set(graph.filter(x=>x['@type']==='Person').map(x=>x['@id']));
      assert.equal(works.length, 20, rel);
      assert.equal(people.size, show.artistProfiles.length, rel);
      assert.deepEqual(event.workFeatured.map(x=>x['@id']), works.map(x=>x['@id']), rel);
      assert.ok(works.every(w => people.has(w.creator['@id']) && !w.image && !w.license), rel);
      assert.match(page.description, /[.!?]$/, rel + ': use a complete description');
      assert.ok(source.includes('<meta property="og:url" content="' + page.url + '">'), rel);
      assert.doesNotMatch(source, /<meta[^>]+(?:og:image|twitter:image)/, rel);

    } else {
      const expected = {
        en: { brand: 'VIPACH Exhibition', archive: 'VIPACH Exhibition Archive', language: 'Language', privacy: 'Legal notice and privacy', planned: 'This exhibition is planned.', historical: 'This exhibition appears in the VIPACH exhibition history.' },
        hu: { brand: 'VIPACH kiállítás', archive: 'VIPACH kiállítási archívum', language: 'Nyelv', privacy: 'Impresszum és adatvédelem', planned: 'A kiállítás tervezés alatt áll.', historical: 'A kiállítás szerepel a VIPACH kiállítási összefoglalójában.' },
        de: { brand: 'VIPACH-Ausstellung', archive: 'VIPACH-Ausstellungsarchiv', language: 'Sprache', privacy: 'Impressum und Datenschutz', planned: 'Die Ausstellung ist geplant.', historical: 'Die Ausstellung ist in der VIPACH-Ausstellungsübersicht verzeichnet.' },
      }[localeId];
      assert.match(source, new RegExp(`<title>[^<]+ — ${expected.brand}</title>`), `${rel}: localized title`);
      assert.ok(page.name.endsWith(` — ${expected.archive}`), `${rel}: localized WebPage name`);
      assert.ok(source.includes(`class="lang-nav" aria-label="${expected.language}"`), `${rel}: localized accessible label`);
      assert.ok(source.includes(`>${expected.privacy}</a>`), `${rel}: localized privacy link`);
      assert.ok(source.includes(expected[exhibition.status]), `${rel}: localized source qualification`);
      assert.doesNotMatch(source, /not yet migrated|Text-level archive stub|missing —|>missing<|VIPACH-only/i, `${rel}: no internal build notes`);
      assert.ok(!event.organizer && !event.eventStatus && !event.startDate && !event.endDate, `${rel}: no unsupported event details`);
      assert.ok(exhibition.status !== 'planned' || !event.location, `${rel}: no placeholder planned venue`);
      assert.ok(exhibition.status !== 'historical' || event.location?.name === exhibition.venue.name, `${rel}: keep sourced venue`);
    }
    if (exhibition.status === 'planned') {
      assert.match(source, /noindex/i, `${rel}: planned pages should noindex`);
      assert.equal(exhibition.realized, false, `${exhibition.slug} must remain unrealised`);
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

const spontan = exhibitions.find((e) => e.slug === 'spontan-2026');
assert.ok(spontan?.liveHtmlMedia?.externalWixImageCount > 0, 'SPONTÁN must inventory live Wix embeds');
assert.equal(spontan.liveHtmlMedia.ogImage.publicationStatus, 'rights-review-required');
assert.ok(spontan.liveHtmlMedia.externalWixImages.every((x) => x.publicationStatus === 'rights-review-required'));
assert.equal(spontan.counts.licenceVerifiedApprovedForPublicDisplay, 0);
assert.equal(spontan.counts.approvedForPublicDisplay, 0);


// --- Sitemap / robots continuity ---
const sitemap = fs.readFileSync(path.join(root, 'sitemap.xml'), 'utf8');
const permanent = {
  en: 'https://exhibition.vipach.at/spontan-2026/',
  'de-AT': 'https://exhibition.vipach.at/de/spontan-2026/',
  hu: 'https://exhibition.vipach.at/hu/spontan-2026/',
  'x-default': 'https://exhibition.vipach.at/spontan-2026/',
};
// CITYgalleryVIENNA's original SPONTÁN record links to these fragments on the old root.
const legacyArtistIds = [
  'gartner-edit','loksi67','adrian-ferenczik','kanya-judit','eszter-holcz','sardi-peter-krisztina',
  'denise-trajkovska','janos-klotz','balogh-david-exhibitor','katifoto-exhibitor','toth-mano-exhibitor',
  'gabor-exhibitor','naylivart-exhibitor','adamszki-exhibitor','lena-banhalmi','norbert-banhalmi-exhibitor',
];
for (const [prefix, locale] of [['','en'],['de/','de-AT'],['hu/','hu']]) {
  const alias = fs.readFileSync(path.join(root, prefix, 'index.html'), 'utf8');
  const slug = fs.readFileSync(path.join(root, prefix, 'spontan-2026/index.html'), 'utf8');
  const body = html => html.match(/<main\b[\s\S]*?<\/main>/)?.[0];
  assert.ok(body(alias) && body(alias) === body(slug), prefix + ' keep the full root catalogue and its links and anchors');
  for (const id of legacyArtistIds) assert.ok(body(alias).includes('id="'+id+'"'), prefix + ' preserve the old artist fragment #' + id);
  for (const html of [alias, slug]) {
    assert.ok(html.includes('<link rel="canonical" href="'+permanent[locale]+'">'));
    assert.deepEqual(Object.fromEntries([...html.matchAll(/<link rel="alternate" hreflang="([^"]+)" href="([^"]+)">/g)].map(m=>m.slice(1))), permanent);
  }
  const aliasUrl = 'https://exhibition.vipach.at/' + prefix;
  assert.ok(!sitemap.includes('<loc>' + aliasUrl + '</loc>'), prefix + ' no duplicate featured aliases in sitemap');
  assert.equal(sitemap.split('<loc>' + permanent[locale] + '</loc>').length, 2, prefix + ' keep one same-language permanent address in sitemap');
}
assert.match(sitemap, /https:\/\/exhibition\.vipach\.at\/spontan-2026\//, 'permanent SPONTÁN slug in sitemap');
assert.match(sitemap, /https:\/\/exhibition\.vipach\.at\/as-i-like-it-austria\//, 'archive slug in sitemap');
assert.doesNotMatch(sitemap, /eletem-kepe-2-0/, 'planned exhibitions excluded from sitemap');
const robots = fs.readFileSync(path.join(root, 'robots.txt'), 'utf8');
assert.match(robots, /Sitemap:\s*https:\/\/exhibition\.vipach\.at\/sitemap\.xml/, 'robots sitemap');

console.log(
  `PASS: multi-exhibition schema OK — featured full graphs (root+slug ×3 locales), ${exhibitions.length} data files, archive stubs validated.`
);
