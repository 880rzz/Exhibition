import assert from 'node:assert/strict';
import fs from 'node:fs';
import {venueSources, venueHome} from './exhibition-venue-evidence.mjs';
for(const locale of ['en','hu','de']){
 const prefix=locale==='en'?'':locale+'/';
 for(const [slug,venue] of Object.entries(venueSources)){
  const files=[prefix+slug+'/index.html',...(slug==='spontan-2026'?[prefix+'index.html']:[])];
  for(const file of files){
   const h=fs.readFileSync(file,'utf8');
   const section=h.match(/<section[^>]+id="venue-evidence"[^>]*>[\s\S]+?<\/section>/)?.[0];
   assert.ok(section?.includes('href="'+venue.url+'"'),file+' exact gallery source');
   assert.ok(section.includes('href="'+venueHome+'"'),file+' separate venue website');
   assert.ok(section.includes('1010 Wien')&&h.indexOf('id="venue-evidence"')<h.indexOf('id="press"'),file+' venue has address and is separate from press');
   assert.ok(h.includes('href="/'+prefix+'privacy/"'),file+' locale privacy');
   assert.ok(!/data-map-load|localStorage\.|<iframe\b/i.test(h),file+' archive still embeds a map or stores the chosen language');
  }
 }
}
for(const prefix of ['', 'hu/', 'de/'])assert.ok(fs.existsSync(prefix+'privacy/index.html'));
assert.ok(!/<iframe|<form|wixforms\.com/i.test(fs.readFileSync('artist-submission/index.html','utf8')));
console.log('PASS 12 localized venue evidence sections, separate press, legal links and retired form.');
