import { venueSources } from './exhibition-venue-evidence.mjs';

const copy = {
  en: {
    title: 'At a glance', nav: 'On this exhibition page', works: 'Works', artists: 'Find an artist',
    venue: 'Venue record', press: 'Press coverage', venueLink: 'Original event listing',
  },
  de: {
    title: 'Die Ausstellung auf einen Blick', nav: 'Auf dieser Ausstellungsseite', works: 'Werke', artists: 'Kunstschaffende finden',
    venue: 'Veranstaltungseintrag', press: 'Presseberichte', venueLink: 'Ursprünglicher Veranstaltungseintrag',
  },
  hu: {
    title: 'A kiállítás röviden', nav: 'Ezen a kiállítási oldalon', works: 'Művek', artists: 'Alkotók keresése',
    venue: 'Helyszíni forrás', press: 'Sajtómegjelenések', venueLink: 'Eredeti eseményadatok',
  },
};

// These summaries report the existing catalogue and archive evidence, not additional rights or provenance.
const summary = {
  'spontan-2026': {
    year: 2026,
    en: ['Unplanned moments, from a fleeting gesture to a change in the light, are at the heart of VIPACH’s third group exhibition in Vienna.', 'Sixteen photographers showed twenty works at CITYgalleryVIENNA from 15 to 21 November 2026.'],
    de: ['Ein flüchtiger Blick, eine Geste, ein Wechsel des Lichts: Ungeplante Augenblicke stehen im Mittelpunkt der dritten Wiener Gruppenausstellung von VIPACH.', 'Sechzehn Fotografinnen und Fotografen zeigten vom 15. bis 21. November 2026 zwanzig Werke in der CITYgalleryVIENNA.'],
    hu: ['Egy futó pillantás, egy gesztus, a fény változása: a VIPACH harmadik bécsi közös tárlata a váratlan pillanatokra figyelt.', 'Tizenhat fotós húsz munkáját mutatták be a CITYgalleryVIENNA galériában 2026. november 15–21. között.'],
  },
  'eletem-kepe': {
    year: 2025,
    en: ['What makes a photograph the one you carry with you? The Vienna Hungarian School Photography Club invited its members to share images that held personal meaning.', 'Fifteen photographers showed twenty works at CITYgalleryVIENNA, Mahlerstraße 11, 1010 Vienna, from 7 to 13 December 2025.'],
    de: ['Welches Bild bleibt einem ein Leben lang wichtig? Der Fotoklub der Wiener Ungarischen Schule zeigte Fotografien, die für ihre Urheberinnen und Urheber eine besondere Bedeutung haben.', 'Fünfzehn Kunstschaffende zeigten vom 7. bis 13. Dezember 2025 zwanzig Werke in der CITYgalleryVIENNA, Mahlerstraße 11, 1010 Wien.'],
    hu: ['Mitől lesz egy fotó életünk képe? A Bécsi Magyar Iskola Fotóklubja olyan felvételeket mutatott be, amelyek különösen sokat jelentenek az alkotóiknak.', 'Tizenöt alkotó húsz munkája szerepelt a tárlaton 2025. december 7–13. között a CITYgalleryVIENNA galériában (Mahlerstraße 11, 1010 Bécs).'],
  },
  'as-i-like-it-austria': {
    year: 2025,
    en: ['The photography club of the Vienna Hungarian School brought together Hungarian and Austrian perspectives on everyday life, city architecture and human connection.', 'Twenty photographs were shown from 30 November to 6 December 2025 at CITYgalleryVIENNA, Mahlerstraße 11, 1010 Vienna. The original VIPACH gallery credits 19 photographers; a contemporary report listed 18.'],
    de: ['Der Fotoklub der Wiener Ungarischen Schule brachte ungarische und österreichische Sichtweisen auf den Alltag, die Architektur der Stadt und menschliche Beziehungen zusammen.', 'Zwanzig Fotografien waren vom 30. November bis 6. Dezember 2025 in der CITYgalleryVIENNA, Mahlerstraße 11, 1010 Wien, zu sehen. Die ursprüngliche VIPACH-Galerie nennt 19 Kunstschaffende, ein zeitgenössischer Bericht 18.'],
    hu: ['A Bécsi Magyar Iskola Fotóklubjának tárlata magyar és osztrák nézőpontokat hozott össze a mindennapokról, a város építészetéről és az emberi kapcsolatokról.', 'Húsz fénykép szerepelt a kiállításon 2025. november 30. és december 6. között a CITYgalleryVIENNA galériában (Mahlerstraße 11, 1010 Bécs). A VIPACH eredeti galériája 19 alkotót tüntet fel, egy korabeli beszámoló 18-at.'],
  },
};

const escape = x => String(x).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
export function exhibitionEditorialMarkup(slug, locale, { hasPress = false } = {}) {
  const c=copy[locale], facts=summary[slug], venue=venueSources[slug];
  if (!c || !facts || !venue) return '';
  const titleId = facts.year === 2025 ? 'ex25-context-title' : 'exhibition-overview-title';
  const refs = [['exhibitors',c.works],['exhibitor-index',c.artists],['venue-evidence',c.venue]];
  if (hasPress) refs.push(['press',c.press]);
  return '<section class="section exhibition-overview'+(facts.year === 2025?' ex25-context':'')+'" aria-labelledby="'+titleId+'">'
    +'<div class="section-inner editorial-grid"><div><p class="kicker">VIPACH · '+facts.year+'</p><h2 class="display-2" id="'+titleId+'">'+escape(c.title)+'</h2></div>'
    +'<div class="prose">'+facts[locale].map(p=>'<p>'+escape(p)+'</p>').join('')
    +(facts.year === 2025?'<p><a href="'+escape(venue.url)+'" rel="noreferrer">'+escape(c.venueLink)+'</a></p>':'')
    +'<nav class="exhibition-overview-nav" aria-label="'+escape(c.nav)+'"><ul>'
    +refs.map(([id,label])=>'<li><a href="#'+id+'">'+escape(label)+'</a></li>').join('')
    +'</ul></nav></div></div></section>';
}
