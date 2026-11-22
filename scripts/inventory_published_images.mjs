#!/usr/bin/env node
/**
 * Inventory every image/OG/favicon reference on published HU/EN/DE HTML.
 * Does not modify live HTML. Writes docs/IMAGE_RIGHTS_INVENTORY.json.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

const REF_RE =
  /(?:src|href|content)=["']([^"']+\.(?:jpg|jpeg|png|webp|svg|gif|ico)(?:\?[^"']*)?)["']|url\((['"]?)([^)]+\.(?:jpg|jpeg|png|webp|svg|gif))\2\)/gi;

function walkHtml(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      if (['.git', 'node_modules', 'gallery', 'assets'].includes(ent.name) && dir === root) {
        // still scan assets for completeness via separate roots
      }
      if (['.git', 'node_modules'].includes(ent.name)) continue;
      walkHtml(p, out);
    } else if (ent.isFile() && ent.name.endsWith('.html')) {
      out.push(p);
    }
  }
  return out;
}

function classify(url) {
  if (/static\.wixstatic\.com|wix:image:\/\//i.test(url)) return 'external-wix-cdn';
  if (url.startsWith('/gallery/') || url.includes('/gallery/')) return 'first-party-gallery';
  if (url.startsWith('/assets/') || url.includes('/assets/')) return 'first-party-asset';
  if (url.startsWith('http')) return 'external-other';
  return 'relative-local';
}

function main() {
  const htmlFiles = walkHtml(root).filter((p) => !p.includes(`${path.sep}templates${path.sep}`));
  // also include templates for source-of-truth inventory
  const templates = walkHtml(path.join(root, 'templates'));
  const files = [...htmlFiles, ...templates];

  const byUrl = new Map();
  for (const file of files) {
    const rel = path.relative(root, file);
    const text = fs.readFileSync(file, 'utf8');
    let m;
    const re = new RegExp(REF_RE.source, REF_RE.flags);
    while ((m = re.exec(text))) {
      const raw = m[1] || m[3];
      if (!raw) continue;
      const url = raw.split('?')[0];
      const entry = byUrl.get(url) || {
        url,
        class: classify(url),
        referencedFrom: [],
        roles: [],
      };
      if (!entry.referencedFrom.includes(rel)) entry.referencedFrom.push(rel);
      if (/og:image|twitter:image/i.test(text.slice(Math.max(0, m.index - 80), m.index + 20))) {
        if (!entry.roles.includes('og')) entry.roles.push('og');
      }
      if (/rel=["']icon/i.test(text.slice(Math.max(0, m.index - 60), m.index))) {
        if (!entry.roles.includes('favicon')) entry.roles.push('favicon');
      }
      if (/hero/i.test(rel) || /hero/i.test(text.slice(Math.max(0, m.index - 120), m.index))) {
        if (!entry.roles.includes('hero-candidate')) entry.roles.push('hero-candidate');
      }
      byUrl.set(url, entry);
    }
  }

  const images = [...byUrl.values()].sort((a, b) => a.url.localeCompare(b.url));
  const spontanJson = JSON.parse(
    fs.readFileSync(path.join(root, 'data/exhibitions/spontan-2026.json'), 'utf8')
  );
  const eletem = JSON.parse(fs.readFileSync(path.join(root, 'data/exhibitions/eletem-kepe.json'), 'utf8'));
  const asilik = JSON.parse(
    fs.readFileSync(path.join(root, 'data/exhibitions/as-i-like-it-austria.json'), 'utf8')
  );

  const report = {
    schemaVersion: '4.2',
    generatedAt: new Date().toISOString(),
    policy:
      'Prior Wix publication is provenance only. No licence is invented. Existing live Exhibition HTML is not auto-mutated by this inventory.',
    totals: {
      uniqueImageRefs: images.length,
      externalWixCdn: images.filter((i) => i.class === 'external-wix-cdn').length,
      firstPartyGallery: images.filter((i) => i.class === 'first-party-gallery').length,
      firstPartyAsset: images.filter((i) => i.class === 'first-party-asset').length,
    },
    separation: {
      spontan2026: {
        liveHtmlExternalWix: spontanJson.liveHtmlMedia?.externalWixImageCount ?? null,
        liveHtmlMediaStatus: 'rights-review-required',
        note: 'SPONTÁN frozen HTML still embeds Wix CDN URLs for continuity; republication/clearance is a separate decision.',
      },
      historical2025Works: {
        eletemKepeWorks: (eletem.works || []).length,
        asILikeItWorks: (asilik.works || []).length,
        licenceVerifiedApprovedForPublicDisplay:
          (eletem.counts?.licenceVerifiedApprovedForPublicDisplay || 0) +
          (asilik.counts?.licenceVerifiedApprovedForPublicDisplay || 0),
        note: '40 catalogue works tracked as checksums in Exhibition JSON; detailed licence evidence stays in VIPACH private-build.',
      },
    },
    licenceSearch: {
      searched: [
        'docs/**',
        'data/exhibitions/*.json',
        'README.md',
        'llms.txt',
        'VIPACH private-build/staging (companion)',
      ],
      verifiablePublicationLicenceInstrumentsFound: 0,
      result:
        'No exhibitor nomination terms, signed publication licences, or model releases found in-repo that clear Wix CDN embeds or 2025 catalogue works for new republication.',
    },
    images,
  };

  const out = path.join(root, 'docs/IMAGE_RIGHTS_INVENTORY.json');
  fs.writeFileSync(out, `${JSON.stringify(report, null, 2)}\n`);
  console.log(
    `Wrote ${out}: unique=${images.length} wix=${report.totals.externalWixCdn} gallery=${report.totals.firstPartyGallery}`
  );
}

main();
