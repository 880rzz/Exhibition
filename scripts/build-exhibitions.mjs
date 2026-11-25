#!/usr/bin/env node
/**
 * VIPACH Exhibition engine build
 * - Featured exhibition → `/`, `/hu/`, `/de/` (live continuity)
 * - Every exhibition → permanent `/{slug}/`, `/hu/{slug}/`, `/de/{slug}/`
 * - full-html exhibitions use frozen templates under templates/exhibitions/<slug>/
 * - archive exhibitions render templates/exhibition-archive.html from JSON
 */
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { archive2025Release } from './exhibition-2025-release-scope.mjs';
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
    navHome: 'Current exhibition',
    labelWhen: 'When',
    labelWhere: 'Where',
    labelContext: 'Context',
    sectionTitle: 'Archive record',
    missingTitle: 'Missing / not yet migrated',
    footerOrg: 'VIPACH — Vienna Photo Art & Creative Hub',
    footerLegal: 'ZVR 079797621 · Text-level archive stub. Images and rights are not asserted here.',
    status: {
      historical: 'Historical archive',
      planned: 'Planned — not realised',
      closed: 'Closed exhibition',
      active: 'Open exhibition',
      open: 'Open exhibition',
    },
  },
  hu: {
    navHome: 'Aktuális kiállítás',
    labelWhen: 'Időpont',
    labelWhere: 'Helyszín',
    labelContext: 'Kontextus',
    sectionTitle: 'Archív bejegyzés',
    missingTitle: 'Hiányzó / még nem migrált adatok',
    footerOrg: 'VIPACH — Vienna Photo Art & Creative Hub',
    footerLegal: 'ZVR 079797621 · Szöveges archív stub. Képek és jogok itt nem kerülnek állításra.',
    status: {
      historical: 'Történelmi archívum',
      planned: 'Tervezett — nem valósult meg',
      closed: 'Lezárt kiállítás',
      active: 'Nyitott kiállítás',
      open: 'Nyitott kiállítás',
    },
  },
  de: {
    navHome: 'Aktuelle Ausstellung',
    labelWhen: 'Wann',
    labelWhere: 'Wo',
    labelContext: 'Kontext',
    sectionTitle: 'Archiv-Eintrag',
    missingTitle: 'Fehlend / noch nicht migriert',
    footerOrg: 'VIPACH — Vienna Photo Art & Creative Hub',
    footerLegal: 'ZVR 079797621 · Textarchiv-Stub. Bilder und Rechte werden hier nicht behauptet.',
    status: {
      historical: 'Historisches Archiv',
      planned: 'Geplant — nicht realisiert',
      closed: 'Beendete Ausstellung',
      active: 'Laufende Ausstellung',
      open: 'Laufende Ausstellung',
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
      '<h3><a href="' + esc(item.url) + '" hreflang="' + lang + '" lang="' + lang +
      '" target="_blank" rel="noopener noreferrer external">' + esc(item.title) + '</a></h3>' +
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

  // Browser language redirect should only auto-bounce the featured EN root
  if (!(mode === 'featured' && localeId === 'en')) {
    out = out.replace(
      /<script>\/\* BROWSER-LANGUAGE-V1 \*\/[\s\S]*?<\/script>/,
      '<!-- browser-language redirect disabled on non-featured or non-EN routes -->'
    );
  }

  if (mode === 'slug') {
    // Keep root event @id stable on featured pages; slug pages use permanent slug ids + sameAs.
    out = out.replaceAll(
      'https://exhibition.vipach.at/#event',
      `https://exhibition.vipach.at/${slug}/#event`
    );
    out = out.replace(
      `"@type": "ExhibitionEvent"`,
      `"@type": "ExhibitionEvent"`
    );
    // Point WebPage url to slug route
    const pageUrl = absoluteUrl(routes[localeId]);
    out = out.replace(
      /"@type": "WebPage",\s*"@id": "https:\/\/exhibition\.vipach\.at\/(?:hu\/|de\/)?#webpage"/,
      (match) => match // leave complex graph intact; update obvious url fields below
    );
    out = out.replace(
      /"url": "https:\/\/exhibition\.vipach\.at\/(?:hu\/|de\/)?"/g,
      `"url": "${pageUrl}"`
    );
    // Annotate slug permanence without inventing new claims
    if (!out.includes('data-exhibition-slug=')) {
      out = out.replace('<body', `<body data-exhibition-slug="${slug}" data-route-mode="slug"`);
    }
  } else if (!out.includes('data-exhibition-slug=')) {
    out = out.replace('<body', `<body data-exhibition-slug="${slug}" data-route-mode="featured"`);
  }

  const pressSection = renderPressSection(exhibition, localeId);
  if (pressSection) {
    if (!out.includes('</main>')) throw new Error('Full HTML missing main close for press: ' + slug);
    out = out.replace('</main>', pressSection + '</main>');
  }
  return out;
}

function whenText(exhibition, localeId) {
  const d = exhibition.dates || {};
  if (typeof d.publicVisit === 'string') return d.publicVisit;
  if (d.publicVisit?.start && d.publicVisit?.end) {
    return `${d.publicVisit.start} – ${d.publicVisit.end}`;
  }
  if (d.publicVisit?.month) {
    return `${d.publicVisit.month}${d.publicVisit.exactDays && d.publicVisit.exactDays !== 'missing' ? ` (${d.publicVisit.exactDays})` : ''} — ${d.publicVisit.status || exhibition.status}`;
  }
  if (exhibition.year) return String(exhibition.year);
  return 'missing';
}

function whereText(exhibition) {
  const v = exhibition.venue || {};
  const parts = [v.name, v.streetAddress, v.postalCode, v.addressLocality, v.addressCountry]
    .filter((p) => p && p !== 'missing' && !String(p).startsWith('missing'));
  return parts.length ? parts.join(', ') : 'missing';
}

function renderArchive(exhibition, localeId, exhibitions, featured) {
  const t = copy[localeId];
  const title = titleFor(exhibition, localeId);
  const subtitle = subtitleFor(exhibition, localeId);
  const pathName = slugPaths(exhibition.slug, localeId);
  const canonical = absoluteUrl(pathName);
  const loc = localeMeta(localeId);
  const robots = exhibition.status === 'planned' ? 'noindex,follow' : 'index,follow';
  const missing = Array.isArray(exhibition.missing) ? [...exhibition.missing] : ['missing field list not provided'];
  const counts = exhibition.counts || {};
  if (Array.isArray(exhibition.works) && exhibition.works.length) {
    missing.unshift(
      `Licence-verified approved for public display: ${counts.licenceVerifiedApprovedForPublicDisplay ?? 0} (must be regenerated from works[])`,
      `Identified catalogue creators: ${counts.identifiedCatalogueCreators ?? counts.photographers ?? 0}` +
        (counts.sourceClaimedPhotographers != null
          ? ` · source-claimed participants: ${counts.sourceClaimedPhotographers}`
          : ''),
      `Cover/OG: ${exhibition.cover?.publicationStatus || 'rights-review-required'} — not embedded as cleared media`
    );
  }
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
    linkItems.push(`<a href="${external.vipachHistoryListing}" rel="noopener">VIPACH exhibition history</a>`);
  }
  if (external.vipachPage) {
    const page = external.vipachPage[localeId] || external.vipachPage.en || external.vipachPage.hu;
    if (page) linkItems.push(`<a href="${page}" rel="noopener">VIPACH page</a>`);
  }
  if (external.vipachEventPage) {
    linkItems.push(`<a href="${external.vipachEventPage}" rel="noopener">VIPACH event page</a>`);
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
        name: `${title} — VIPACH Exhibition archive`,
        inLanguage: loc.htmlLang === 'de-AT' ? 'de-AT' : localeId,
        isPartOf: { '@id': `${baseUrl}/#website` },
        about: { '@id': `${canonical}#exhibition` },
        publisher: { '@id': site.organization.url },
      },
      {
        '@type': 'ExhibitionEvent',
        '@id': `${canonical}#exhibition`,
        name: title,
        description: subtitle || undefined,
        eventStatus:
          exhibition.status === 'planned'
            ? 'https://schema.org/EventScheduled'
            : exhibition.status === 'historical' || exhibition.status === 'closed'
              ? 'https://schema.org/EventScheduled'
              : 'https://schema.org/EventScheduled',
        organizer: { '@id': site.organization.url },
        location: exhibition.venue?.name
          ? {
              '@type': 'Place',
              name: exhibition.venue.name,
              address: {
                '@type': 'PostalAddress',
                addressLocality: exhibition.venue.addressLocality || undefined,
                addressCountry: exhibition.venue.addressCountry || undefined,
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
    docTitle: `${title} — VIPACH Exhibition`,
    description: subtitle || `${title} archive record.`,
    robots,
    canonical,
    hreflangLinks,
    ogLocale: localeId === 'de' ? 'de_AT' : localeId === 'hu' ? 'hu_HU' : 'en_US',
    jsonLd: JSON.stringify(clean(jsonLd), null, 2),
    homeHref: featuredPaths(localeId),
    langNav,
    archiveMenu: archiveNavigationHtml(exhibitions, featured, localeId, exhibition.slug, 'slug'),
    navHome: t.navHome,
    statusLabel: t.status[exhibition.status] || exhibition.status,
    kicker: 'VIPACH Exhibition archive',
    title: escapeHtml(title),
    lede: escapeHtml(subtitle || exhibition.organizationContext || ''),
    labelWhen: t.labelWhen,
    labelWhere: t.labelWhere,
    labelContext: t.labelContext,
    whenText: escapeHtml(whenText(exhibition, localeId)),
    whereText: escapeHtml(whereText(exhibition)),
    contextText: escapeHtml(exhibition.organizationContext || 'missing'),
    sectionTitle: t.sectionTitle,
    sectionBody: escapeHtml(
      exhibition.status === 'planned'
        ? 'This exhibition is planned and not realised. No artists, artworks or image rights are claimed on this stub.'
        : Array.isArray(exhibition.works) && exhibition.works.length
          ? `Text-level archive stub. Catalogue works: ${counts.works ?? exhibition.works.length}. Licence-verified public artworks: ${counts.licenceVerifiedApprovedForPublicDisplay ?? 0}. Cover/OG is not rights-cleared.`
          : 'Text-level archive stub generated from exhibition data. Missing images and rights are marked explicitly.'
    ),
    externalLinks,
    pressSection: renderPressSection(exhibition, localeId),
    missingTitle: t.missingTitle,
    missingItems: missing.map((item) => `<li>${escapeHtml(item)}</li>`).join('\n            '),
    footerOrg: t.footerOrg,
    footerLegal: t.footerLegal,
  };

  for (const [key, value] of Object.entries(replacements)) {
    template = template.replaceAll(`{{${key}}}`, String(value));
  }
  return template;
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

function buildLlms(exhibitions, featured) {
  const lines = [
    '# VIPACH Exhibition engine',
    '',
    'Multilingual static exhibition site for VIPACH — Vienna Photo Art & Creative Hub.',
    '',
    '## Architecture',
    `- Featured landing (EN/HU/DE): \`/\`, \`/hu/\`, \`/de/\` → currently ${featured?.titles?.en || featured?.slug}`,
    '- Permanent exhibition URLs: `/{slug}/`, `/hu/{slug}/`, `/de/{slug}/`',
    '- Source data: `data/exhibitions/*.json`',
    '- Build: `node scripts/build-exhibitions.mjs`',
    '',
    '## Exhibitions',
  ];
  for (const e of exhibitions) {
    const title = e.titles?.en || e.titles?.hu || e.slug;
    lines.push(`- ${title} (\`${e.slug}\`) — status: ${e.status}${e.realized === false ? ', not realised' : ''}`);
    lines.push(`  - EN: ${absoluteUrl(slugPaths(e.slug, 'en'))}`);
    lines.push(`  - HU: ${absoluteUrl(slugPaths(e.slug, 'hu'))}`);
    lines.push(`  - DE: ${absoluteUrl(slugPaths(e.slug, 'de'))}`);
  }
  if (featured?.slug === 'spontan-2026') {
    lines.push(
      '',
      '## SPONTÁN 2026 date sources',
      '- Opening: 2026-11-15 17:00 (doorTime 16:00), Europe/Vienna',
      '- Public visit on live microsite/schema: 15–21 November 2026',
      '- README / some public copy: 15–22 November 2026',
      '- VIPACH Wix event page: through 2026-11-22 23:59',
      '',
      '## SPONTÁN team',
      '- Curator: Balogh Dávid',
      '- Organizers: Hölcz Eszter & Ayadi Lívia',
      '- Patron: Bánhalmi Norbert',
      '- Featured event supporter: OM SYSTEM Shop (SPONTÁN-only; brand partnership lives on vipach.at)',
      '- 16 photographers · 20 works (VisualArtwork graph)',
      '',
      '## Contact',
      '- office@vipach.at',
      '- +43 677 616 55592',
      '- https://www.vipach.at/'
    );
  }
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

  writeFile(path.join(root, 'sitemap.xml'), buildSitemap(exhibitions, featured));
  writeFile(path.join(root, 'llms.txt'), buildLlms(exhibitions, featured));

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
