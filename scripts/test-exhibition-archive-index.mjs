import assert from 'node:assert/strict';
import fs from 'node:fs';
const source = fs.readdirSync('data/exhibitions').filter(x=>x.endsWith('.json'))
  .map(x=>JSON.parse(fs.readFileSync('data/exhibitions/'+x,'utf8')));
const sitemap=fs.readFileSync('sitemap.xml','utf8');
for(const [lang,prefix] of [['en',''],['de','/de'],['hu','/hu']]){
  const file=prefix.slice(1)+(prefix?'/':'')+'archive/index.html';
  const html=fs.readFileSync(file,'utf8'), url='https://exhibition.vipach.at'+prefix+'/archive/';
  assert.ok(html.includes('<link rel="canonical" href="'+url+'">'), file);
  assert.ok(sitemap.includes('<loc>'+url+'</loc>'), file);
  assert.equal((html.match(/hreflang=/g)||[]).length,4);
  assert.ok(html.includes('aria-controls="site-menu"') && html.includes('id="site-menu"'));
  const [past,planned]=html.split('id="planned"');
  for(const exhibition of source){
    const target=prefix+'/'+exhibition.slug+'/';
    assert.ok(fs.existsSync(target.slice(1)+'index.html'),target);
    const section=(exhibition.status==='planned'?planned:past);
    assert.ok(section.includes('<h3><a href="'+target+'">'),target);
    if(exhibition.status==='planned')assert.ok(!sitemap.includes('<loc>https://exhibition.vipach.at'+target+'</loc>'),target);
  }
}
console.log('PASS localized canonical archive, hamburger, eight resolvable listings and distinct planned section.');
