import {venueSources, venueHome} from './exhibition-venue-evidence.mjs';
const base = 'https://exhibition.vipach.at';
const orgId = 'https://www.vipach.at/#organization';
const webSiteId = base + '/#website';
const venueId = base + '/#venue';
const federationProfile = 'https://okoszisztema.kozpontiszovetseg.at/intezmenyek/vipach/';
export const gallerySources = Object.freeze(Object.fromEntries(Object.entries(venueSources).map(([slug,e])=>[slug,e.url])));
export const spontanVenueSource = gallerySources['spontan-2026'];
export const publicExhibitionsPath = '/data/public/exhibitions.json';
export const legacySourcePaths = ['spontan-2026', 'eletem-kepe', 'as-i-like-it-austria'].map(slug => 'data/exhibitions/' + slug + '.json');

const copy = {
  'spontan-2026': {
    en: ['SPONTANEOUS — VIPACH Photo Exhibition 2026, Vienna', 'Explore 20 works by 16 photographers from VIPACH’s third group exhibition, held 15–21 November 2026 at CITYgalleryVIENNA in Vienna.'],
    hu: ['SPONTÁN — VIPACH fotókiállítás, Bécs, 2026', 'A VIPACH harmadik bécsi közös fotókiállításán 16 alkotó 20 képe szerepelt. A tárlat 2026. november 15–21. között volt látható a CITYgalleryVIENNA galériában.'],
    de: ['SPONTAN — VIPACH-Fotoausstellung, Wien 2026', 'Die dritte VIPACH-Gruppenausstellung zeigte 20 Werke von 16 Fotografierenden. Sie war vom 15. bis 21. November 2026 in der CITYgalleryVIENNA zu sehen.'],
  },
  'eletem-kepe': {
    en: ['The Image of My Life — VIPACH Photo Exhibition, Vienna 2025', 'At CITYgalleryVIENNA, 15 Hungarian photographers showed 20 works for The Image of My Life, a VIPACH group exhibition held 7–13 December 2025.'],
    hu: ['Életem képe — VIPACH fotókiállítás, Bécs, 2025', 'Tizenöt magyar fotográfus 20 műve az Életem képe című VIPACH-kiállításról, amely 2025. december 7–13. között volt látható Bécsben, a CITYgalleryVIENNA galériában.'],
    de: ['Das Bild meines Lebens — VIPACH-Fotoausstellung, Wien 2025', '15 ungarische Fotografinnen und Fotografen zeigten 20 Werke bei der VIPACH-Ausstellung vom 7. bis 13. Dezember 2025 in der CITYgalleryVIENNA.'],
  },
  'as-i-like-it-austria': {
    en: ['As I Like It Austria — VIPACH Photo Exhibition, Vienna 2025', 'Explore 20 photographs on Hungarian and Austrian perspectives from the VIPACH exhibition held 30 November–6 December 2025 at CITYgalleryVIENNA.'],
    hu: ['As I Like It Austria — VIPACH fotókiállítás, Bécs, 2025', 'Húsz fotó a magyar és osztrák nézőpontok találkozásáról a VIPACH 2025. november 30. és december 6. között, a CITYgalleryVIENNA galériában rendezett tárlatáról.'],
    de: ['As I Like It Austria — VIPACH-Fotoausstellung, Wien 2025', '20 Fotografien über ungarische und österreichische Perspektiven aus der VIPACH-Ausstellung vom 30. November bis 6. Dezember 2025 in der CITYgalleryVIENNA.'],
  },
};
const locale = lang => lang === 'de' ? 'de-AT' : lang;
const socialLocales = { en: 'en_GB', hu: 'hu_HU', de: 'de_AT' };
const id = key => ({ '@id': key });
const assert = (val, why) => { if (!val) throw new Error(why); return val; };
const uniq = vals => [...new Set(vals.filter(Boolean))];
const route = (slug, lang) => base + (lang === 'en' ? '' : '/' + lang) + '/' + slug + '/';
const esc = x => String(x).replaceAll('&', '&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const scriptEscape = obj => JSON.stringify(obj).replaceAll('<', '\\u003c');

export function exhibitionMeta(slug, lang, canonical) {
  const [title, description] = assert(copy[slug]?.[lang], 'No reviewed exhibition metadata for ' + slug + ':' + lang);
  const meta = [
    '<meta name="author" content="VIPACH — Vienna Photo Art &amp; Creative Hub">',
    '<link rel="alternate" type="text/plain" href="/llms.txt" title="Exhibition guide">',
    '<link rel="alternate" type="application/json" href="' + publicExhibitionsPath + '" title="Exhibition facts">',
    '<meta property="og:type" content="website">',
    '<meta property="og:site_name" content="VIPACH Exhibition">',
    '<meta property="og:title" content="' + esc(title) + '">',
    '<meta property="og:description" content="' + esc(description) + '">',
    '<meta property="og:url" content="' + esc(canonical) + '">',
    '<meta property="og:locale" content="' + socialLocales[lang] + '">',
    ...Object.entries(socialLocales).filter(([l]) => l !== lang).map(([, l]) => '<meta property="og:locale:alternate" content="' + l + '">'),
    '<meta name="twitter:card" content="summary">',
    '<meta name="twitter:title" content="' + esc(title) + '">',
    '<meta name="twitter:description" content="' + esc(description) + '">',
  ].join('');
  return { title, description, meta };
}

function organisation() {
  return { '@type': 'Organization', '@id': orgId, name: 'VIPACH — Vienna Photo Art & Creative Hub', url: 'https://vipach.at/',
    sameAs: ['https://www.wikidata.org/wiki/Q138416887'],
    subjectOf: { '@type': 'WebPage', '@id': federationProfile, url: federationProfile, about: id(orgId) } };
}
function siteGraph() {
  return { '@type': 'WebSite', '@id': webSiteId, url: base + '/', name: 'VIPACH Exhibition', publisher: id(orgId) };
}

export function archiveGraph({ ex, current, lang, name, description, workName, canonical }) {
  const eventUrl = route(ex.slug, 'en'), eventId = eventUrl + '#event';
  const people = ex.artistProfiles.map(p => ({
    '@type': 'Person', '@id': eventUrl + '#artist-' + p.id, name: p.name,
  }));
  const works = ex.works.map(w => ({
    '@type': 'VisualArtwork', '@id': eventUrl + '#' + w.id,
    // Catalog label, not a proposed title. Never add the Wix exhibit-only bytes in another use.
    name: workName(w), artform: 'Photography', creator: id(eventUrl + '#artist-' + w.galleryEvidence.artistProfileId),
    mainEntityOfPage: canonical + '#' + w.id,
  }));
  const place = { '@type': 'Place', '@id': venueId, name: current.venue.name, url: venueHome,
    address: { '@type': 'PostalAddress', streetAddress: current.venue.streetAddress, postalCode: current.venue.postalCode,
      addressLocality: current.venue.addressLocality, addressCountry: current.venue.addressCountry } };
  const event = { '@type': 'ExhibitionEvent', '@id': eventId, url: eventUrl, name, description, organizer: id(orgId),
    sponsor: { '@type': 'Organization', name: 'OM SYSTEM' },
    startDate: current.dates.publicVisit.start, endDate: current.dates.publicVisit.end, location: id(venueId),
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    subjectOf: [{ '@type': 'WebPage', url: gallerySources[ex.slug] }], workFeatured: works.map(w => id(w['@id'])) };
  const page = { '@type': 'WebPage', '@id': canonical + '#webpage', url: canonical, name, description, inLanguage: locale(lang),
    isPartOf: id(webSiteId), mainEntity: id(eventId), about: [id(eventId), id(venueId)], publisher: id(orgId),
    citation: uniq([gallerySources[ex.slug],
      ...(current.pressCoverage?.items || []).map(p => p.url)]) };
  return { '@context': 'https://schema.org', '@graph': [siteGraph(), organisation(), place, page, event, ...people, ...works] };
}

export function rewriteSpontanSeo(html, lang, canonical, exhibition) {
  const newMeta = exhibitionMeta(exhibition.slug, lang, canonical);
  const eventUrl = route(exhibition.slug, 'en'), eventId = eventUrl + '#event';
  return html.replace(/<head>[\s\S]*?<\/head>/i, head => head
    .replace(/<title>[\s\S]*?<\/title>/i,'<title>' + esc(newMeta.title) + '</title>')
    .replace(/<meta name="description" content="[^"]+"\s*>/i,'<meta name="description" content="' + esc(newMeta.description) + '">')
    .replace(/<meta (?:name="(?:author|twitter:[^"]+)"|property="og:[^"]+")[^>]*>/g,'')
    .replace(/<link rel="alternate" type="text\/plain" href="\/llms\.txt"[^>]*>/g,'')
    .replace(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/i, (_all, json) => {
      const graph = JSON.parse(json);
      const event = assert(graph['@graph'].find(n => n['@type'] === 'ExhibitionEvent'), 'No SPONTÁN event');
      const page = assert(graph['@graph'].find(n => n['@type'] === 'WebPage'), 'No SPONTÁN page node');
      const venue = assert(graph['@graph'].find(n => n['@type'] === 'Place' && n['@id'] === venueId),'No SPONTÁN venue');
      venue.url = venueHome;
      const oldEventId = event['@id'];
      const oldPageId = page['@id'];
      const preserveReferences = obj => {
        if (!obj || typeof obj !== 'object') return;
        if (obj['@id'] === oldEventId) obj['@id'] = eventId;
        if (obj['@id'] === oldPageId) obj['@id'] = canonical + '#webpage';
        Object.values(obj).forEach(preserveReferences);
      };
      preserveReferences(graph);
      Object.assign(page, { url: canonical, name: newMeta.title, description: newMeta.description,
        citation: uniq([spontanVenueSource, ...(page.citation || []), ...(exhibition.pressCoverage?.items || []).map(p => p.url)]) });
      Object.assign(event, { url: eventUrl, startDate: exhibition.dates.opening.officialStart,
        endDate: exhibition.dates.publicVisit.verifiedClosingTime, doorTime: exhibition.dates.opening.doorTime,
        subjectOf: { '@type': 'WebPage', url: spontanVenueSource } });
      delete event.sameAs; // Replaced by the original host record as subjectOf, not identity equivalence.
      delete event.offers; // no current admission availability claim on a past exhibition
      delete event.eventStatus;
      delete event.image; // legacy cover stays in the page hero; no free-standing publicity claim
      return newMeta.meta + '<script type="application/ld+json">' + scriptEscape(graph) + '</script>';
    }));
}
