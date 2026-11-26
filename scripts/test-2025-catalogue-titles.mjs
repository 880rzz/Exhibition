import fs from 'node:fs';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { catalogueTitle } from './exhibition-catalogue-titles.mjs';

const read = name => fs.readFileSync(new URL('../'+name, import.meta.url), 'utf8');
const staged = name => JSON.parse(read('data/staging/'+name+'.json'));
const { exhibitions } = staged('2025-two-exhibitions');
const rows = staged('2025-catalogue-titles').shows;
const cms = new Map(staged('2025-cms-editorial-source').records.map(r=>[r.id,r]));
const translations = staged('2025-archive-translations').exhibitions;
const crosswalk = staged('2025-editorial-copy').workDescriptionCrosswalk;
const hash = text => createHash('sha256').update(text).digest('hex');
const escape = text => text.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#39;');
const norm = text => text.normalize('NFD').replace(/\p{Diacritic}/gu,'').toLowerCase().replace(/[^a-z0-9]/g,'');
const basis = {'wix-description':0,'reviewed-variant-description':0,'visible-gallery-photo':0};

assert.deepEqual(Object.keys(rows),exhibitions.map(e=>e.slug));
for (const show of exhibitions) {
  const entries = rows[show.slug];
  assert.equal(show.works.length,20,show.slug);
  assert.deepEqual(Object.keys(entries),show.works.map(w=>w.id),show.slug);
  for (const w of show.works) {
    const t=entries[w.id], note=crosswalk[w.id], source=translations[show.slug].works[w.id];
    assert.equal(t.galleryImageFileId,w.galleryEvidence.imageFileId,w.id);
    assert.ok(w.imageSourceUrl.endsWith('/'+t.galleryImageFileId),w.id);
    assert.ok(Object.hasOwn(basis,t.basis),w.id);
    basis[t.basis]++;
    for(const lang of ['hu','en','de']) {
      assert.equal(t.titles[lang],t.titles[lang]?.trim(),w.id);
      assert.ok(t.titles[lang]?.length>3&&t.titles[lang].length<65,w.id+'/'+lang);
    }
    if(t.basis==='visible-gallery-photo') {
      // Do not draw an editorial label from withheld written material or expose it.
      assert.notEqual(source?.status,'reviewed',w.id);
      assert.equal(t.descriptionSha256,undefined,w.id);
      assert.equal(t.sourceTitle,undefined,w.id);
      continue;
    }
    assert.equal(source.status,'reviewed',w.id);
    const rec=cms.get(note?.sourceRecordId || w.wixRecordId);
    const field=note?.field || (w.sourceImageSlot==='artwork-1'?'firstArtworkDescription':'secondArtworkDescription');
    assert.equal(norm(rec.artistName),norm(w.creator),w.id);
    if(note) {
      assert.equal(t.basis,'reviewed-variant-description',w.id);
      assert.equal(note.galleryImageFileId,t.galleryImageFileId,w.id);
      assert.equal(note.artistProfileId,w.galleryEvidence.artistProfileId,w.id);
    } else {
      assert.equal(t.basis,'wix-description',w.id);
      assert.ok(['artwork-1','artwork-2'].includes(w.sourceImageSlot),w.id);
    }
    const expectedFile=note?.sourceImageFileId||t.galleryImageFileId;
    assert.ok(rec[field.replace('Description','Media')].includes('/'+expectedFile+'/'),w.id);
    const text=note?rec[field].replace(/^A kép ára:[^\n]*(?:\n+|$)/u,''):rec[field];
    if (t.sourceTitle) {
      assert.ok(['en','de','hu','mul'].includes(t.sourceTitle.lang),w.id);
      assert.ok(text.includes(t.sourceTitle.title),w.id+' source title must match the text verbatim');
    }
    if (note?.verifiedSourceTitle) assert.equal(t.sourceTitle?.title,note.verifiedSourceTitle,w.id);
    assert.equal(hash(text),t.descriptionSha256,w.id);
    assert.equal(t.descriptionSha256,source.sourceSha256,w.id);
  }
  for (const [lang,prefix] of [['en',''],['de','de/'],['hu','hu/']]) {
    const html=read(prefix+show.slug+'/index.html'), unique=new Set();
    assert.equal([...html.matchAll(/class="ex25-title-basis"/g)].length,20,show.slug+'/'+lang);
    assert.equal([...html.matchAll(/class="ex25-original-title"/g)].length,show.slug==='eletem-kepe'?14:5,show.slug+'/'+lang);
    const graph=JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1])['@graph'];
    for(const w of show.works) {
      const c=catalogueTitle(show.slug,w,lang),node=graph.find(x=>x['@id']?.endsWith('/#'+w.id));
      const section=html.split('id="'+w.id+'"')[1];
      assert.match(section,/^><p class="kicker">[^<]*<\/p><h4 class="exhibitor-extra-title">/);
      assert.ok(section.startsWith('><p class="kicker">')&&section.slice(0,470).includes(
        '<h4 class="exhibitor-extra-title">'+escape(c.title)+'</h4><p class="ex25-title-basis">'+escape(c.provenanceLabel)+'</p>'),w.id+'/'+lang);
      assert.equal(node.name,c.title,w.id);
      assert.equal(node.disambiguatingDescription,c.provenanceLabel,w.id);
      assert.equal(node.alternateName,c.originalTitle,w.id);
      if(c.originalTitle) assert.ok(section.slice(0,520).includes(escape(c.originalTitleLabel)+': <span lang="'+c.originalTitleLang+'">'+escape(c.originalTitle)+'</span>'),w.id);
      assert.ok(!unique.has(c.title),w.id+'/'+lang);
      unique.add(c.title);
    }
  }
}
assert.deepEqual(basis,{'wix-description':32,'reviewed-variant-description':2,'visible-gallery-photo':6});
for(const p of ['','de/','hu/']) for(const slug of ['','spontan-2026/']) assert.doesNotMatch(read(p+slug+'index.html'),/ex25-title-basis/);
console.log('PASS 40 image-bound editorial titles × three languages, including two reviewed variants, six visually grounded titles, and 19 separately displayed titles explicitly recorded in the reviewed texts.');
