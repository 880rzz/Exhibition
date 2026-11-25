import fs from 'node:fs';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
import path from 'node:path';
import { archive2025Release } from './exhibition-2025-release-scope.mjs';
const release=archive2025Release();
assert.ok(release,'archive release evidence missing');
const candidateMode=process.argv.includes('--candidate');
const root=candidateMode?'private-review/exhibition-candidate':'.';
const cms=JSON.parse(fs.readFileSync('data/staging/2025-cms-editorial-source.json','utf8')).records;
const cmsById=new Map(cms.map(x=>[x.id,x]));
const editorial=JSON.parse(fs.readFileSync('data/staging/2025-editorial-copy.json','utf8'));
const sourceBodies=editorial.exhibitions;
const translations=JSON.parse(fs.readFileSync('data/staging/2025-archive-translations.json','utf8')).exhibitions;
const slugOrder=['spontan-2026','eletem-kepe','as-i-like-it-austria'];
const site='https://exhibition.vipach.at';
const langCodes={en:'en',de:'de-AT',hu:'hu'};
const escape=t=>String(t).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#39;');
const count=(html,marker)=>html.split(marker).length-1;
const text=(pathname)=>fs.readFileSync(path.join(root,pathname.slice(1),'index.html'),'utf8');
const section=(html,id)=>[...html.matchAll(/<section\b[^>]*>[\s\S]*?<\/section>/g)].find(([block])=>block.slice(0,block.indexOf('>')).includes('id="'+id+'"'))?.[0];
for (const lang of ['en','hu','de']){
 const prefix=lang==='en'?'':'/'+lang;
 const urls=slugOrder.map(slug=>prefix+'/'+slug+'/');
 for(const url of [prefix+'/',...urls]){
  const html=text(url),menu=html.match(/<nav\b[^>]*id="site-menu"[^>]*>([\s\S]*?)<\/nav>/)?.[1];
  assert.ok(menu,url);
  const menuUrls=[...menu.matchAll(/<a class="exhibition-menu-entry[^"]*" href="([^"]+)"/g)].map(m=>m[1]);
  assert.deepEqual(menuUrls,urls,url+' permanent dropdown order');
  assert.ok(html.includes('<a class="brand" href="'+prefix+'/'+(lang==='en'?'?lang=en':'')+'"'),url+' distinct latest home');
  const history=section(html,'history');
  if(url===urls[2])assert.equal(history,undefined,url+' earliest has no predecessor section');
  else {
   const prev=url===urls[1]?urls[2]:urls[1];
   assert.equal(count(history||'','href="'+prev+'" rel="prev"'),1,url+' explicit predecessor link');
   if(url!==urls[1])assert.equal(count(history||'','href="'+urls[2]+'"'),1,url+' older archive still present');
  }
  const ex=release.shows.find(x=>url.endsWith('/'+x.slug+'/'));
  if(!ex)continue;
  assert.ok(html.includes('<link rel="canonical" href="'+site+url+'">'),url+' self canonical');
  assert.ok(html.includes('content="'+(candidateMode?'noindex,nofollow,noimageindex':'index,follow')+'"'),url+' robots scope');
  for (const [l,code] of Object.entries(langCodes)){
   const other=(l==='en'?'':'/'+l)+'/'+ex.slug+'/';
   assert.ok(html.includes('hreflang="'+code+'" href="'+site+other+'"'),url+' reciprocal hreflang '+code);
  }
  assert.equal(count(html,'class="exhibitor-card"'),ex.artistProfiles.length);
  assert.equal(count(html,'class="exhibitor-portrait"'),ex.artistProfiles.length);
  assert.equal(count(html,'class="exhibitor-work-image"'),20);
  const missing=ex.works.filter(w=>!editorial.workDescriptionCrosswalk[w.id] && !cmsById.get(w.wixRecordId)?.[w.sourceImageSlot==='artwork-1'?'firstArtworkDescription':w.sourceImageSlot==='artwork-2'?'secondArtworkDescription':'']).length;
  assert.equal(missing,ex.slug==='eletem-kepe'?1:0);
  const derived=ex.works.find(w=>editorial.workDescriptionCrosswalk[w.id]);
  assert.ok(derived);
  assert.equal(count(html,'data-description-basis='+JSON.stringify(editorial.workDescriptionCrosswalk[derived.id].basis)),1);
  const workStart=html.indexOf('id='+JSON.stringify(derived.id));
  assert.notEqual(workStart,-1);
  assert.ok(!html.slice(workStart,html.indexOf('</figure>',workStart)).includes('A kép ára'));
  assert.ok(html.includes('Mahlerstraße 11, 1010 Wien'));
  assert.ok(html.includes(ex.slug==='eletem-kepe'?' · 16:00':' · 16:00–19:00'));
  assert.equal(count(html,'class="ex25-unverified"'),missing);
  const records=Object.values(translations[ex.slug]).flatMap(group=>Object.values(group));
  const reviewed=records.filter(row=>row.status==='reviewed');
  const withheld=records.filter(row=>row.status==='withheld');
  assert.equal(records.length,ex.artistProfiles.length+20-missing);
  assert.equal(withheld.length,ex.slug==='eletem-kepe'?2:7);
  assert.equal(count(html,'class="ex25-editorial-withheld"'),withheld.length);
  assert.equal(count(html,'class="prose ex25-source-text" lang="hu"'),reviewed.length);
  assert.equal(count(html,'class="ex25-original-text"'),lang==='hu'?0:reviewed.length);
  assert.equal(count(html,'class="prose ex25-translated-text" lang="'+langCodes[lang]+'"'),lang==='hu'?0:reviewed.length);
  for(const row of withheld)assert.deepEqual(Object.keys(row).sort(),['sourceSha256','status']);
  for(const row of reviewed){
   assert.ok(row.en.trim()&&row.de.trim()&&/^[a-f0-9]{64}$/.test(row.sourceSha256));
   if(lang!=='hu')assert.ok(html.includes(escape(row[lang].trim().split('\n')[0])),url+' missing reviewed text');
  }
  const priorText=JSON.parse(fs.readFileSync('data/staging/2025-cms-editorial-source.json','utf8')).records;
  for(const row of priorText){
   for(const old of [row.biography,row.firstArtworkDescription,row.secondArtworkDescription]){
    if(!old||!withheld.some(r=>r.sourceSha256===createHash('sha256').update(old).digest('hex')))continue;
    const first=old.trim().split('\n')[0];
    if(first.length>30)assert.ok(!html.includes(escape(first)),url+' re-exposed withheld content');
   }
  }
  assert.equal(count(html,'referrerpolicy="no-referrer"'),ex.artistProfiles.length+22);
  const cover=release.heroDisplay.images[ex.slug];
  assert.ok(html.includes('<div class="hero-visual ex25-archive-cover"><img src="'+cover.url+'" width="'+cover.width+'" height="'+cover.height+'" alt="'),url+' exact Wix hero');
  assert.ok(/class="hero-visual ex25-archive-cover"><img [^>]+alt="[^"]+" referrerpolicy="no-referrer"/.test(html),url+' descriptive cover');
  for (const a of ex.artistProfiles){
   const boundary=html.indexOf('id="artist-'+a.id+'"');
   assert.notEqual(boundary,-1,a.id);
   const card=html.slice(boundary,html.indexOf('</article>',boundary));
   assert.ok(card.includes('src="'+a.portraitSourceUrl+'"'));
   for(const w of ex.works.filter(w=>w.galleryEvidence.artistProfileId===a.id)){
    assert.ok(card.includes('id="'+w.id+'"'),w.id+' outside attributed artist card');
    assert.ok(card.includes('src="'+w.imageSourceUrl+'"'),w.id+' source media changed');
   }
  }
  if(lang==='hu')for (const paragraph of sourceBodies[ex.slug].hu.sourceOriginalIntro){
   assert.ok(html.includes(escape(paragraph)),ex.slug+' exact Hungarian original omitted');
  }
  assert.equal(count(html,'class="ex-press-item"'),3,url+' known source only');
  assert.equal(count(html,'data-map-load'),0,url+' no automatically loaded map');
 }
}
console.log('PASS 12 localized routes, exact permanent menu and predecessor direction, 74 scoped media uses, 34 profile displays, 64 approved paired translations, 9 withheld texts, one absent note and 18 archive press displays.');
