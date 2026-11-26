// Owner-supplied images for the two archive heroes (2026-11-26).
// The underlying archive work/portrait permissions and public reuse remain unchanged.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createHash } from 'node:crypto';
const assets = {
  "eletem-kepe": {
    "height": 888,
    "hash": "b5c40563545e10556e3db985d2f73fb49356bc714243bef481d9dd670c2be42e",
    "source": "f8cf3b69e775918f9a7ff74710343b70deb3e215c6b56c82ef0a5e1e94081ad8",
    "url": "/assets/exhibition-covers/eletem-kepe-2025-cover.webp",
    "width": 1000,
    "alt": {
      "en": "A visitor looking at an illuminated frame in a dark gallery",
      "hu": "Látogató egy megvilágított képkeret előtt egy sötét galériában",
      "de": "Ein Besucher vor einem beleuchteten Bilderrahmen in einer dunklen Galerie"
    }
  },
  "as-i-like-it-austria": {
    "height": 1000,
    "hash": "04da2d75c6d70d1149be1693eeec4bb1709fa34f1d6b607946025dbe9b77e590",
    "source": "6412c46d49f0f2ff6a131fb06257726dba1ab404396f5d2f370f0da1219e6ee0",
    "url": "/assets/exhibition-covers/as-i-like-it-austria-2025-cover.webp",
    "width": 1000,
    "alt": {
      "en": "As I Like It Austria exhibition poster in an illuminated display",
      "hu": "Az As I Like It Austria kiállítás plakátja egy világító vitrinben",
      "de": "Das Ausstellungsplakat von As I Like It Austria in einem beleuchteten Schaukasten"
    }
  }
};
export function archiveCoverFor(slug) {
  assert.ok(Object.hasOwn(assets,slug),'Unexpected archive cover: '+slug);
  const item=assets[slug];
  const bytes=fs.readFileSync(new URL('..'+item.url,import.meta.url));
  assert.equal(createHash('sha256').update(bytes).digest('hex'),item.hash,slug+' owner-supplied cover hash');
  return item;
}
