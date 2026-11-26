#!/usr/bin/env node
/**
 * VIPACH Exhibition engine build
 * - Featured exhibition → `/`, `/hu/`, `/de/` (live continuity)
 * - Every exhibition → permanent `/{slug}/`, `/hu/{slug}/`, `/de/{slug}/`
 * - full-html exhibitions use frozen templates under templates/exhibitions/<slug>/
 * - archive exhibitions render templates/exhibition-archive.html from JSON
 */
import fs from 'node:fs';
import { updateExhibitionPublicLinks } from './exhibition-public-links.mjs';
import { pressTitleFor } from './exhibition-press-language.mjs';
import { venueEvidenceMarkup } from './exhibition-venue-evidence.mjs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { archive2025Release } from './exhibition-2025-release-scope.mjs';
import { rewriteSpontanSeo, publicExhibitionsPath, spontanVenueSource } from './exhibition-seo.mjs';
import { publicExhibitionFacts } from './exhibition-public-data.mjs';
import { newestFeatured, menuExhibitions, exhibitionDate } from './exhibition-chronology.mjs';
import { renderExhibitionNavigation } from './exhibition-navigation.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const dataDir = path.join(root, 'data');
const exhibitionsDir = path.join(dataDir, 'exhibitions');
const site = JSON.parse(fs.readFileSync(path.join(dataDir, 'site.json'), 'utf8'));
const baseUrl = site.baseUrl.replace(/\/$/, '');
const scopedArchives=archive2025Release();

const copy = {
  en: {
    navHome: 'Current exhibition', skip: 'Skip to content', language: 'Language',
    openMenu: 'Open exhibitions menu', navigation: 'Exhibition navigation',
    exhibition: 'Exhibition', brand: 'VIPACH Exhibition', archive: 'VIPACH Exhibition Archive',
    labelWhen: 'Date', labelWhere: 'Venue', sectionTitle: 'About this entry',
    dateUnconfirmed: 'The exact dates are not confirmed.',
    venueUnconfirmed: 'The venue is not confirmed.',
    historyLink: 'VIPACH exhibition history (in Hungarian)', sourceLink: 'VIPACH exhibition page',
    eventLink: 'VIPACH event page', privacy: 'Legal notice and privacy',
    historicalSummary: 'This exhibition appears in the VIPACH exhibition history. The listing gives the year and venue but does not specify the exact visiting dates.',
    plannedSummary: 'This exhibition is planned. Exact dates, venue and participants have not been announced here.',
    status: {
      historical: 'Exhibition archive', planned: 'Planned exhibition',
      closed: 'Closed exhibition', active: 'Open exhibition', open: 'Open exhibition',
    },
  },
  hu: {
    navHome: 'Aktuális kiállítás', skip: 'Ugrás a tartalomra', language: 'Nyelv',
    openMenu: 'A kiállítási menü megnyitása', navigation: 'Kiállítási navigáció',
    exhibition: 'Kiállítás', brand: 'VIPACH kiállítás', archive: 'VIPACH kiállítási archívum',
    labelWhen: 'Időpont', labelWhere: 'Helyszín', sectionTitle: 'Az archív bejegyzésről',
    dateUnconfirmed: 'A pontos időpont még nem ismert.',
    venueUnconfirmed: 'A helyszín még nem ismert.',
    historyLink: 'A VIPACH korábbi kiállításai', sourceLink: 'A kiállítás a VIPACH oldalán',
    eventLink: 'A VIPACH eseményoldala', privacy: 'Impresszum és adatvédelem',
    historicalSummary: 'A kiállítás szerepel a VIPACH kiállítási összefoglalójában. A forrás az évet és a helyszínt közli, a látogatás pontos időpontját nem.',
    plannedSummary: 'A kiállítás tervezés alatt áll. A pontos időpontot, a helyszínt és a résztvevőket itt még nem tettük közzé.',
    status: {
      historical: 'Kiállítási archívum', planned: 'Tervezett kiállítás',
      closed: 'Lezárt kiállítás', active: 'Látogatható kiállítás', open: 'Látogatható kiállítás',
    },
  },
  de: {
    navHome: 'Aktuelle Ausstellung', skip: 'Zum Inhalt springen', language: 'Sprache',
    openMenu: 'Ausstellungsmenü öffnen', navigation: 'Ausstellungsnavigation',
    exhibition: 'Ausstellung', brand: 'VIPACH-Ausstellung', archive: 'VIPACH-Ausstellungsarchiv',
    labelWhen: 'Zeitraum', labelWhere: 'Ort', sectionTitle: 'Zu diesem Archiveintrag',
    dateUnconfirmed: 'Die genauen Termine stehen noch nicht fest.',
    venueUnconfirmed: 'Der Veranstaltungsort steht noch nicht fest.',
    historyLink: 'Bisherige VIPACH-Ausstellungen (auf Ungarisch)', sourceLink: 'Ausstellungsseite von VIPACH',
    eventLink: 'Veranstaltungsseite von VIPACH', privacy: 'Impressum und Datenschutz',
    historicalSummary: 'Die Ausstellung ist in der VIPACH-Ausstellungsübersicht verzeichnet. Die Quelle nennt das Jahr und den Veranstaltungsort, aber keine genauen Besuchstermine.',
    plannedSummary: 'Die Ausstellung ist geplant. Genaue Termine, Veranstaltungsort und Mitwirkende wurden hier noch nicht bekannt gegeben.',
    status: {
      historical: 'Ausstellungsarchiv', planned: 'Geplante Ausstellung',
      closed: 'Beendete Ausstellung', active: 'Laufende Ausstellung', open: 'Laufende Ausstellung',
    },
  },
};

function readExhibitions() {
  return fs
    .readdirSync(exhibitionsDir)
    .filter((f) => f.endsWith('.json'))
    .map((f) => JSON.parse(fs.readFileSync(path.join(exhibitionsDir, f), 'utf8')))
    .sort((a, b) => String(a.slug).localeCompare(String(b.slug)));
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function writeFile(filePath, contents) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, contents);
}

function localeMeta(id) {
  return site.locales.find((l) => l.id === id);
}

function featuredPaths(localeId) {
  const loc = localeMeta(localeId);
  return loc.pathPrefix ? `${loc.pathPrefix}/` : '/';
}

function slugPaths(slug, localeId) {
  const loc = localeMeta(localeId);
  return loc.pathPrefix ? `${loc.pathPrefix}/${slug}/` : `/${slug}/`;
}

function absoluteUrl(pathname) {
  return `${baseUrl}${pathname}`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function titleFor(exhibition, localeId) {
  return exhibition.titles?.[localeId] || exhibition.titles?.en || exhibition.slug;
}

function subtitleFor(exhibition, localeId) {
  return exhibition.subtitle?.[localeId] || exhibition.subtitle?.en || '';
}


function archiveNavigationHtml(exhibitions, featured, localeId, currentSlug, mode) {
  return renderExhibitionNavigation(menuExhibitions(exhibitions, featured), localeId, currentSlug,
    ex => ex.slug === featured.slug && !scopedArchives ? featuredPaths(localeId) : slugPaths(ex.slug,localeId),
    {historicalSections: Boolean(scopedArchives)});
}

function renderPressSection(exhibition, localeId) {
  const press = exhibition.pressCoverage?.items || [];
  if (!Array.isArray(press) || press.length === 0) return '';
  const copy = {
    en: { kicker: 'In the press', title: 'Press coverage', read: 'Read original article', type: { 'exhibition-report': 'Exhibition report', 'opening-report': 'Opening report', 'advance-mention': 'Exhibition preview', 'exhibition-mention': 'Exhibition mention' } },
    hu: { kicker: 'Sajtómegjelenések', title: 'A kiállítás a sajtóban', read: 'Eredeti cikk megnyitása', type: { 'exhibition-report': 'Kiállítási riport', 'opening-report': 'Megnyitóbeszámoló', 'advance-mention': 'Előzetes sajtóemlítés', 'exhibition-mention': 'Kiállítási sajtóemlítés' } },
    de: { kicker: 'Presse', title: 'Die Ausstellung in den Medien', read: 'Originalartikel öffnen', type: { 'exhibition-report': 'Ausstellungsbericht', 'opening-report': 'Eröffnungsbericht', 'advance-mention': 'Vorbericht', 'exhibition-mention': 'Erwähnung der Ausstellung' } },
  }[localeId];
  const esc = escapeHtml;
  const items = press.map((item) => {
    if (!/^https:\/\//.test(item.url || '')) throw new Error('Non-HTTPS press source: ' + exhibition.slug);
    const lang = item.language === 'de' ? 'de' : item.language === 'hu' ? 'hu' : 'en';
    const published = /^\d{4}-\d{2}-\d{2}$/.test(item.date || '') ? item.date : '';
    const type = copy.type[item.type];
    if (!type || !item.title || !item.publication || !item.description?.[localeId]) throw new Error('Incomplete press source: ' + exhibition.slug + '/' + item.id);
    return '<article class="ex-press-item">' +
      '<div class="ex-press-meta"><span>' + esc(item.publication) + '</span><span>' + esc(type) + '</span>' +
      (published ? '<time datetime="' + published + '">' + published + '</time>' : '') + '</div>' +
      '<h3><a href="' + esc(item.url) + '" hreflang="' + lang + '" target="_blank" rel="noopener noreferrer external">' + esc(pressTitleFor(item,localeId)) + '</a></h3>' +
      '<p lang="' + (localeId === 'de' ? 'de' : localeId) + '">' + esc(item.description[localeId]) + '</p>' +
      '<a class="ex-press-read" href="' + esc(item.url) + '" target="_blank" rel="noopener noreferrer external">' +
      esc(copy.read) + ' ↗</a></article>';
  });
  return '<section class="ex-press-section" id="press" aria-labelledby="ex-press-title">' +
    '<div class="ex-press-inner"><p class="kicker">' + esc(copy.kicker) + '</p>' +
    '<h2 class="display-2" id="ex-press-title">' + esc(copy.title) + '</h2>' +
    '<div class="ex-press-list">' + items.join('') + '</div></div></section>';
}

function rewriteFullHtml({ html, exhibition, localeId, mode, exhibitions, featured }) {
  const slug = exhibition.slug;
  const routes = {
    en: mode === 'featured' ? featuredPaths('en') : slugPaths(slug, 'en'),
    hu: mode === 'featured' ? featuredPaths('hu') : slugPaths(slug, 'hu'),
    de: mode === 'featured' ? featuredPaths('de') : slugPaths(slug, 'de'),
  };
  let out = html;
  const menu = archiveNavigationHtml(exhibitions, featured, localeId, slug, mode);
  const siteMenu = /(<nav\b[^>]*\bid="site-menu"[^>]*>)([\s\S]*?)(<\/nav>)/i;
  if (!siteMenu.test(out)) throw new Error('Missing hamburger site-menu in full HTML template: ' + slug + '/' + localeId);
  out = out.replace(siteMenu, (_whole, open, inner, close) => open + menu + close);

  // Language switcher + hreflang + canonical
  out = out
    .replace(/href="https:\/\/exhibition\.vipach\.at\/"/g, `href="${absoluteUrl(routes.en)}"`)
    .replace(/href="https:\/\/exhibition\.vipach\.at\/hu\/"/g, `href="${absoluteUrl(routes.hu)}"`)
    .replace(/href="https:\/\/exhibition\.vipach\.at\/de\/"/g, `href="${absoluteUrl(routes.de)}"`);

  // Relative language nav commonly used in templates
  out = out
    .replace(/href="\/"(?=[^>]*>\s*EN)/i, `href="${routes.en}"`)
    .replace(/href="\/hu\/"/g, `href="${routes.hu}"`)
    .replace(/href="\/de\/"/g, `href="${routes.de}"`);

  // Canonical specifically
  out = out.replace(
    /<link\s+rel="canonical"\s+href="[^"]*"\s*>/i,
    `<link rel="canonical" href="${absoluteUrl(routes[localeId])}">`
  );

  if (localeId === 'en') out = out.replace('<a class="brand" href="/"', '<a class="brand" href="/?lang=en"');
  // Only the root is locale-neutral. Manual English links bypass detection, without storage.
  if (mode === 'featured') {
    out = out.replace(/(<nav class="lang-nav"[^>]*>)([\s\S]*?)(<\/nav>)/,
      (_all, start, links, end) => start + links.replace('href="/"', 'href="/?lang=en"') + end);
    if (localeId === 'en') out = out.replace('</head>', '<script src="/assets/entry-language.js"></script>\n</head>');
  }

  if (mode === 'slug') {
    if (slug !== 'spontan-2026') {
      // Preserve legacy full-HTML behavior for any future template not using the shared SEO layer.
      const pageUrl = absoluteUrl(routes[localeId]);
      out = out.replaceAll('https://exhibition.vipach.at/#event', absoluteUrl(slugPaths(slug, 'en')) + '#event')
        .replace(/"url": "https:\/\/exhibition\.vipach\.at\/(?:hu\/|de\/)?"/g,
          '"url": "' + pageUrl + '"');
    }
    // Annotate slug permanence without inventing new claims
    if (!out.includes('data-exhibition-slug=')) {
      out = out.replace('<body', `<body data-exhibition-slug="${slug}" data-route-mode="slug"`);
    }
  } else if (!out.includes('data-exhibition-slug=')) {
    out = out.replace('<body', `<body data-exhibition-slug="${slug}" data-route-mode="featured"`);
  }

  out = out.replace('<!-- EXHIBITION_VENUE_EVIDENCE -->', venueEvidenceMarkup(slug, localeId));
  if (slug === 'spontan-2026') out = rewriteSpontanSeo(out, localeId, absoluteUrl(routes[localeId]), exhibition);

  const pressSection = renderPressSection(exhibition, localeId);
  if (pressSection) {
    if (!out.includes('</main>')) throw new Error('Full HTML missing main close for press: ' + slug);
    out = out.replace('</main>', pressSection + '</main>');
  }
  return out.replace(/^[ \t]+$/gm, '');
}

// Generic public entries render only known structured values, never source TODO strings.
const archivedCityNames = {
  Wien: { en: 'Vienna', hu: 'Bécs', de: 'Wien' },
  München: { en: 'Munich', hu: 'München', de: 'München' },
};

function verifiedText(value) {
  return typeof value === 'string' && value.trim() && !/^missing\b/i.test(value) ? value.trim() : undefined;
}

function whenText(exhibition, localeId) {
  const d = exhibition.dates?.publicVisit;
  const lang = localeMeta(localeId).htmlLang;
  if (/^\d{4}-\d{2}-\d{2}$/.test(d?.start || '') && /^\d{4}-\d{2}-\d{2}$/.test(d?.end || '')) {
    const range = new Intl.DateTimeFormat(lang, { dateStyle: 'long', timeZone: 'UTC' });
    return range.formatRange(new Date(d.start), new Date(d.end));
  }
  if (/^\d{4}-\d{2}$/.test(d?.month || '')) {
    return new Intl.DateTimeFormat(lang, { year: 'numeric', month: 'long', timeZone: 'UTC' }).format(new Date(d.month + '-01'));
  }
  return Number.isInteger(exhibition.year) ? String(exhibition.year) : copy[localeId].dateUnconfirmed;
}

function whereText(exhibition, localeId) {
  const v = exhibition.venue || {};
  const city = verifiedText(v.addressLocality);
  const country = verifiedText(v.addressCountry);
  const lang = localeMeta(localeId).htmlLang;
  const parts = [
    verifiedText(v.name), verifiedText(v.streetAddress), verifiedText(v.postalCode),
    archivedCityNames[city]?.[localeId] || city,
    /^[A-Z]{2}$/.test(country || '') ? new Intl.DisplayNames(lang, { type: 'region' }).of(country) : undefined,
  ].filter(Boolean);
  return parts.length ? parts.join(', ') : copy[localeId].venueUnconfirmed;
}

function renderArchive(exhibition, localeId, exhibitions, featured) {
  const t = copy[localeId];
  const title = titleFor(exhibition, localeId);
  const subtitle = subtitleFor(exhibition, localeId);
  const pathName = slugPaths(exhibition.slug, localeId);
  const canonical = absoluteUrl(pathName);
  const loc = localeMeta(localeId);
  const planned = exhibition.status === 'planned';
  const robots = planned ? 'noindex,follow' : 'index,follow';
  const summary = planned ? t.plannedSummary : t.historicalSummary;
  const venueName = verifiedText(exhibition.venue?.name);
  const homeHref = localeId === 'en' ? '/?lang=en' : featuredPaths(localeId);
  const privacyHref = `${loc.pathPrefix}/privacy/`;
  const hreflangLinks = site.locales
    .map((l) => {
      const href = absoluteUrl(slugPaths(exhibition.slug, l.id));
      return `<link rel="alternate" hreflang="${l.hreflang}" href="${href}">`;
    })
    .concat([`<link rel="alternate" hreflang="x-default" href="${absoluteUrl(slugPaths(exhibition.slug, 'en'))}">`])
    .join('\n  ');

  const langNav = site.locales
    .map((l) => {
      const href = slugPaths(exhibition.slug, l.id);
      const label = l.id.toUpperCase();
      const current = l.id === localeId ? ' aria-current="page"' : '';
      return `<a href="${href}" lang="${l.htmlLang}"${current}>${label}</a>`;
    })
    .join('\n      ');

  const external = exhibition.external || {};
  const linkItems = [];
  if (external.vipachHistoryListing) {
    linkItems.push(`<a href="${escapeHtml(external.vipachHistoryListing)}" hreflang="hu" rel="noopener">${t.historyLink}</a>`);
  }
  if (external.vipachPage) {
    const page = external.vipachPage[localeId] || external.vipachPage.en || external.vipachPage.hu;
    if (page) linkItems.push(`<a href="${escapeHtml(page)}" rel="noopener">${t.sourceLink}</a>`);
  }
  if (external.vipachEventPage) {
    linkItems.push(`<a href="${escapeHtml(external.vipachEventPage)}" rel="noopener">${t.eventLink}</a>`);
  }
  const externalLinks = linkItems.length
    ? `<div class="archive-links">${linkItems.join('')}</div>`
    : '';

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        '@id': `${canonical}#webpage`,
        url: canonical,
        name: `${title} — ${t.archive}`,
        description: subtitle || summary,
        inLanguage: loc.htmlLang,
        isPartOf: { '@id': `${baseUrl}/#website` },
        about: { '@id': `${canonical}#exhibition` },
        publisher: { '@id': site.organization.url },
      },
      {
        '@type': 'ExhibitionEvent',
        '@id': `${canonical}#exhibition`,
        name: title,
        description: subtitle || undefined,
        location: venueName
          ? {
              '@type': 'Place',
              name: venueName,
              address: {
                '@type': 'PostalAddress',
                addressLocality: verifiedText(exhibition.venue.addressLocality),
                addressCountry: verifiedText(exhibition.venue.addressCountry),
              },
            }
          : undefined,
      },
    ],
  };

  // Remove undefined recursively
  const clean = (value) => {
    if (Array.isArray(value)) return value.map(clean).filter((v) => v !== undefined);
    if (value && typeof value === 'object') {
      const o = {};
      for (const [k, v] of Object.entries(value)) {
        const cv = clean(v);
        if (cv !== undefined) o[k] = cv;
      }
      return o;
    }
    return value;
  };

  let template = fs.readFileSync(path.join(root, 'templates/exhibition-archive.html'), 'utf8');
  const replacements = {
    htmlLang: loc.htmlLang,
    docTitle: escapeHtml(`${title} — ${t.brand}`),
    description: escapeHtml(subtitle || summary),
    robots,
    canonical,
    hreflangLinks,
    ogLocale: localeId === 'de' ? 'de_AT' : localeId === 'hu' ? 'hu_HU' : 'en_US',
    jsonLd: JSON.stringify(clean(jsonLd), null, 2),
    homeHref, privacyHref, langNav,
    archiveMenu: archiveNavigationHtml(exhibitions, featured, localeId, exhibition.slug, 'slug'),
    navHome: t.navHome, skip: t.skip, brand: t.brand, exhibition: t.exhibition,
    language: t.language, openMenu: t.openMenu, navigation: t.navigation, privacy: t.privacy,
    statusLabel: t.status[exhibition.status] || t.status.historical,
    kicker: t.archive,
    title: escapeHtml(title),
    lede: escapeHtml(subtitle || ''),
    labelWhen: t.labelWhen,
    labelWhere: t.labelWhere,
    whenText: escapeHtml(whenText(exhibition, localeId)),
    whereText: escapeHtml(whereText(exhibition, localeId)),
    sectionTitle: t.sectionTitle,
    sectionBody: escapeHtml(summary),
    externalLinks,
    pressSection: renderPressSection(exhibition, localeId),
    footerOrg: escapeHtml(site.organization.name),
    footerLegal: `ZVR ${escapeHtml(site.organization.zvr)}`,
  };

  for (const [key, value] of Object.entries(replacements)) {
    template = template.replaceAll(`{{${key}}}`, String(value));
  }
  return template.replace(/^[ \t]+$/gm, '');
}

function outputPathFor(localeId, slug, mode) {
  if (mode === 'featured') {
    if (localeId === 'en') return path.join(root, 'index.html');
    return path.join(root, localeId, 'index.html');
  }
  if (localeId === 'en') return path.join(root, slug, 'index.html');
  return path.join(root, localeId, slug, 'index.html');
}

function buildSitemap(exhibitions, featured) {
  const urls = [];
  const lastmod = new Date().toISOString().slice(0, 10);

  function pushTriple(getPath) {
    const en = absoluteUrl(getPath('en'));
    const hu = absoluteUrl(getPath('hu'));
    const de = absoluteUrl(getPath('de'));
    for (const loc of [en, hu, de]) {
      urls.push(
        `  <url><loc>${loc}</loc><lastmod>${lastmod}</lastmod>` +
          `<xhtml:link rel="alternate" hreflang="en" href="${en}"/>` +
          `<xhtml:link rel="alternate" hreflang="de-AT" href="${de}"/>` +
          `<xhtml:link rel="alternate" hreflang="hu" href="${hu}"/>` +
          `<xhtml:link rel="alternate" hreflang="x-default" href="${en}"/>` +
          `</url>`
      );
    }
  }

  pushTriple((localeId) => slugPaths('events', localeId));
  if (featured) {
    pushTriple((localeId) => featuredPaths(localeId));
  }
  for (const exhibition of exhibitions) {
    // Planned stubs stay reachable but can remain noindex; still list historical/closed/active.
    if (exhibition.status === 'planned') continue;
    pushTriple((localeId) => slugPaths(exhibition.slug, localeId));
  }

  return (
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n` +
    urls.join('\n') +
    `\n</urlset>\n`
  );
}

function buildLlms(facts, featured) {
  const lines = [
    '# VIPACH Exhibition Archive',
    '',
    '> Official directory of past VIPACH photography exhibitions in Vienna, Austria. Exhibitions are offered in Hungarian, English and Austrian German.',
    '',
    '- [Exhibition facts (JSON)](' + baseUrl + publicExhibitionsPath + '): source-linked exhibition dates, venue, catalogue counts and display status.',
    '- [VIPACH](https://vipach.at/): the community photography club in Vienna and Budapest; it grew from the Vienna Hungarian School photo club within the Central Federation.',
    '- This domain is the VIPACH cultural exhibition archive, not a separate organization or a commercial service.',
    '- [BANHALMI Photography](https://www.banhalmiphotography.com/) is the photography practice of Banhalmi Norbert e.U. [VIPACH for Business](https://business.vipach.at/) is a separate commercial digital-advertising service of that practice, not an activity of the association or this archive.',
    '- Use the privacy notice of the site visited. Shared names and links do not imply common legal control, consent or reuse permission.',
    '',
    '## Published exhibitions',
  ];
  for (const e of facts.exhibitions) {
    lines.push(
      '- [' + e.title.en + '](' + e.urls.en + '): ' + e.publicVisit.start + ' through ' + e.publicVisit.end +
        ' at CITYgalleryVIENNA (Mahlerstraße 11, 1010 Vienna, Austria); ' + e.catalogue.works + ' works and ' +
        e.catalogue.identifiedArtists + ' identified artists. [Hungarian](' + e.urls.hu + ') · [German](' + e.urls.de + '). [Venue record](' + e.sources.venueExhibitionListing + ').',
    );
  }
  if (featured?.slug === 'spontan-2026') {
    lines.push('', '## SPONTÁN date and source note',
      '- [CITYgalleryVIENNA venue listing](' + spontanVenueSource + ') confirms public visits from 15 through 21 November 2026, closing at 20:00 Vienna time on the 21st. The 15 November reception began at 16:00 and the official opening at 17:00.',
      '- The original poster shows 22 November; it is kept unaltered in the exhibition archive. The final public visiting day was 21 November 2026.'
    );
  }
  lines.push('', '## Credits and rights',
    '- Read the exhibition pages for creators, the original source material, translations where available, and press context. Exhibition display is not permission to republish, download, train on or otherwise reuse media.',
    '- Contact: office@vipach.at.'
  );
  return lines.join('\n') + '\n';
}

function main() {
  // Keep aggregate counts derived from works[] before emitting HTML.
  const regen = spawnSync(process.execPath, [path.join(root, 'scripts/regenerate_exhibition_counts.mjs')], {
    cwd: root,
    stdio: 'inherit',
  });
  if (regen.status !== 0) throw new Error('regenerate_exhibition_counts failed');

  const exhibitions = readExhibitions();
  if (!exhibitions.length) throw new Error('No exhibitions found in data/exhibitions');

  const featured = newestFeatured(exhibitions);
  const featuredSlug = featured.slug;

  for (const exhibition of exhibitions) {
    for (const locale of site.locales) {
      const localeId = locale.id;
      if (exhibition.render === 'full-html') {
        const templatePath = path.join(
          root,
          exhibition.templateDir || `templates/exhibitions/${exhibition.slug}`,
          `${localeId}.html`
        );
        if (!fs.existsSync(templatePath)) {
          throw new Error(`Missing full-html template: ${templatePath}`);
        }
        const source = fs.readFileSync(templatePath, 'utf8');

        // Featured landing
        if (exhibition.slug === featuredSlug) {
          const featuredHtml = rewriteFullHtml({
            html: source,
            exhibition,
            localeId,
            mode: 'featured',
            exhibitions,
            featured,
          });
          writeFile(outputPathFor(localeId, exhibition.slug, 'featured'), featuredHtml);
        }

        // Permanent slug mirror
        const slugHtml = rewriteFullHtml({
          html: source,
          exhibition,
          localeId,
          mode: 'slug',
          exhibitions,
          featured,
        });
        writeFile(outputPathFor(localeId, exhibition.slug, 'slug'), slugHtml);
      } else {
        const html = renderArchive(exhibition, localeId, exhibitions, featured);
        writeFile(outputPathFor(localeId, exhibition.slug, 'slug'), html);
      }
    }
  }

  if (scopedArchives) {
    const a = spawnSync(process.execPath, [path.join(root,'scripts/build-2025-staging-previews.mjs'),'--render-reviewed-archive'], {cwd:root,stdio:'inherit'});
    if (a.status !== 0) throw new Error('Scoped 2025 archive render failed');
  }

  updateExhibitionPublicLinks(root,exhibitions);

  writeFile(path.join(root, 'sitemap.xml'), buildSitemap(exhibitions, featured));
  const facts = publicExhibitionFacts(exhibitions, scopedArchives);
  writeFile(path.join(root, publicExhibitionsPath.slice(1)), JSON.stringify(facts, null, 2) + '\n');
  writeFile(path.join(root, 'llms.txt'), buildLlms(facts, featured));

  const manifest = {
    builtAt: new Date().toISOString(),
    featuredExhibitionSlug: featuredSlug,
    featuredSelection: 'latest published full-html exhibition by opening date at build time',
    menuSlugs: menuExhibitions(exhibitions, featured).map(e=>e.slug),
    exhibitions: exhibitions.map((e) => ({
      slug: e.slug,
      status: e.status,
      render: e.render,
      routes: {
        featured: e.slug === featuredSlug ? {
          en: featuredPaths('en'),
          hu: featuredPaths('hu'),
          de: featuredPaths('de'),
        } : null,
        permanent: {
          en: slugPaths(e.slug, 'en'),
          hu: slugPaths(e.slug, 'hu'),
          de: slugPaths(e.slug, 'de'),
        },
      },
    })),
  };
  writeFile(path.join(root, 'data/build-manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
  console.log(`Built ${exhibitions.length} exhibitions (featured: ${featuredSlug}).`);
}

main();
