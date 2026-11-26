import fs from 'node:fs';
import assert from 'node:assert/strict';
const slugs=fs.readdirSync('data/exhibitions').filter(f=>f.endsWith('.json')).map(f=>f.slice(0,-5));
const css=fs.readFileSync('assets/public-links.css','utf8');
assert.ok(css.includes('data:image/svg+xml')&&css.includes('position:fixed'));
assert.match(css,/a\[data-external-action\]\[href\^="https:\/\/"\]/);
assert.doesNotMatch(css,/a:is\(\[href\^=/);
assert.match(css,/\.vipach-wa\{[^}]*width:52px;height:52px[^}]*background:#765812/);
assert.match(css,/\.vipach-wa::after\{content:none\}/);
assert.match(css,/body\.menu-open \.vipach-wa,\.vipach-wa~\.vipach-contact-dock\{display:none\}/);
const client=fs.readFileSync('assets/site.js','utf8');
assert.ok(client.includes("querySelector('.vipach-wa,.vipach-contact-dock')"));
for(const l of ['en','de','hu']){
 const p=l==='en'?'':l+'/';
 for(const f of ['index.html','events/index.html','privacy/index.html',...slugs.map(x=>x+'/index.html')]){
  const s=fs.readFileSync(p+f,'utf8');assert.equal((s.match(/class="vipach-wa"/g)||[]).length,1,p+f);
  assert.ok(s.includes('href="https://wa.me/4367761655592"')&&s.includes('/assets/public-links.css?v=20261126-quiet'),p+f);
  if(!/^(privacy|events)\//.test(f))assert.ok(s.includes('class="calendar-menu-link" href="/'+p+'events/"'),p+f);
  const wa=s.match(/<a class="vipach-wa"[^>]*aria-label="([^"]+)"[^>]*>([\s\S]+?)<\/a>/);
  assert.ok(wa && wa[1].includes('WhatsApp') && !wa[1].includes('+43'),p+f);
  assert.match(wa[2],/^<svg [^>]*aria-hidden="true"[^>]*><path [^>]*><\/path><\/svg>$/,p+f);
  assert.doesNotMatch(s,/https:\/\/(?:www\.)?vipach\.at\/(?:artist\/|event-details\/|kapcsolat\/impresszum|eletemkepe(?:["?]|\b)|asilikeit(?:["?]|\b))/,p+f);
  const strong=[...s.matchAll(/<a\b[^>]*\bdata-external-action(?:[ >])[^>]*>/g)].map(m=>m[0]);
  const expected=f==='index.html'||f==='spontan-2026/index.html'?3: ['as-i-like-it-austria/index.html','eletem-kepe/index.html'].includes(f)?4:f==='events/index.html'?1:0;
  assert.equal(strong.length,expected,p+f+' strong actions');
  for(const tag of strong){
   assert.match(tag,/href="https:\/\//,p+f);
   assert.doesNotMatch(tag,/vipach-wa|hero-sponsor-link|brand|https:\/\/exhibition\.vipach\.at/,p+f);
  }
  assert.doesNotMatch(s.match(/<footer\b[\s\S]*?<\/footer>/)?.[0]??'',/data-external-action|↗|→/,p+f);
  assert.doesNotMatch(s,/<a\b[^>]*>[^<]*[↗→][^<]*<\/a>/,p+f);
  if(f==='privacy/index.html'){
   const legal=l==='hu'?'':'/'+l;
   assert.ok(s.includes('href="https://vipach.at'+legal+'/impresszum.html"'),p+f);
  }
  if(f==='index.html'||f==='spontan-2026/index.html'){
   assert.match(s,/<figure class="hero-visual exhibition-poster"><img [^>]+><figcaption class="poster-date-note">[^<]+<\/figcaption><\/figure>/,p+f);
   assert.match(s,/<figcaption class="poster-date-note">[^<]*22[^<]*21[^<]*<\/figcaption>/,p+f);
   const graph=JSON.parse(s.match(/<script type="application\/ld\+json">(.+?)<\/script>/)[1])['@graph'];
   const event=graph.find(x=>x['@type']==='ExhibitionEvent');
   const org=graph.find(x=>x['@id']==='https://www.vipach.at/#organization'&&x['@type']==='Organization');
   assert.equal(event.subjectOf.url,'https://publicartists.online/event/vipach-151126/',p+f);
   assert.equal(event.sameAs,undefined,p+f);
   assert.equal(org.url,'https://vipach.at/',p+f);
  }
  if(['as-i-like-it-austria/index.html','eletem-kepe/index.html'].includes(f)){
   const anchors=[...s.matchAll(/href="#(artist-[^"]+)"/g)].map(x=>x[1]);
   assert.equal(anchors.length,f.startsWith('as-i')?19:15,p+f);
   assert.equal(anchors.filter(id=>s.includes('id="'+id+'"')).length,anchors.length,p+f);
  }
  if(f!=='events/index.html')continue;
  assert.ok(s.includes('&amp;hl='+l)&&s.includes('mailto:office@vipach.at')&&s.includes('data-vip-calendar=')&&!/<iframe/i.test(s),p+f);
  assert.ok(s.includes('https://exhibition.vipach.at/'+p+'events/'),p+f);
 }
}
console.log('PASS local-language calendars and direct WhatsApp, vector link indicator and no eager calendar iframe.');
