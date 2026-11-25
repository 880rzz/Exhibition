import fs from 'node:fs';
import assert from 'node:assert/strict';
const slugs=fs.readdirSync('data/exhibitions').filter(f=>f.endsWith('.json')).map(f=>f.slice(0,-5));
const css=fs.readFileSync('assets/public-links.css','utf8');
assert.ok(css.includes('data:image/svg+xml')&&css.includes('position:fixed'));
assert.match(css,/body\.menu-open \.vipach-wa,\.vipach-wa~\.vipach-contact-dock\{display:none\}/);
const client=fs.readFileSync('assets/site.js','utf8');
assert.ok(client.includes("querySelector('.vipach-wa,.vipach-contact-dock')"));
for(const l of ['en','de','hu']){
 const p=l==='en'?'':l+'/';
 for(const f of ['index.html','events/index.html','privacy/index.html',...slugs.map(x=>x+'/index.html')]){
  const s=fs.readFileSync(p+f,'utf8');assert.equal((s.match(/class="vipach-wa"/g)||[]).length,1,p+f);
  assert.ok(s.includes('href="https://wa.me/4367761655592"')&&s.includes('/assets/public-links.css?v=20261125-mobile'),p+f);
  if(!/^(privacy|events)\//.test(f))assert.ok(s.includes('class="calendar-menu-link" href="/'+p+'events/"'),p+f);
  if(f!=='events/index.html')continue;
  assert.ok(s.includes('&amp;hl='+l)&&s.includes('mailto:office@vipach.at')&&s.includes('data-vip-calendar=')&&!/<iframe/i.test(s),p+f);
  assert.ok(s.includes('https://exhibition.vipach.at/'+p+'events/'),p+f);
 }
}
console.log('PASS local-language calendars and direct WhatsApp, vector link indicator and no eager calendar iframe.');
