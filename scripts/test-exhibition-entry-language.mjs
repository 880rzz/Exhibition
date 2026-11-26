import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const script = fs.readFileSync('assets/entry-language.js','utf8');
function run(url, languages, language) {
 const u=new URL(url, 'https://exhibition.vipach.at');
 const targets=[];
 vm.runInNewContext(script,{URLSearchParams,location:{pathname:u.pathname,search:u.search,hash:u.hash,replace:x=>targets.push(x)},navigator:{languages,language}});
 return targets;
}
for(const [url,languages,fallback,expected] of [
 ['/', ['de-AT','en-GB'], null, ['/de/']],
 ['/', ['hu-HU','de-AT'], null, ['/hu/']],
 ['/', ['en-US','de-AT'], null, []],
 ['/', ['fr-FR','de-AT'], null, ['/de/']],
 ['/', ['fr-FR','it-IT'], null, []],
 ['/', undefined, 'hu-HU', ['/hu/']],
 ['/?utm_source=press', ['de-AT'], null, ['/de/?utm_source=press']],
 ['/?lang=en', ['de-AT'], null, []],
 ['/#press', ['de-AT'], null, []],
 ['/#gartner-edit', ['de-AT'], null, []],
 ['/hu/', ['de-AT'], null, []],
 ['/de/', ['hu-HU'], null, []],
 ['/spontan-2026/', ['hu-HU'], null, []],
 ['/as-i-like-it-austria/', ['de-AT'], null, []],
]) assert.deepEqual(run(url,languages,fallback), expected, url);
assert.doesNotMatch(script,/localStorage|sessionStorage|document\.cookie|fetch\(/);
for (const prefix of ['', 'de/', 'hu/']){
 const root=fs.readFileSync(prefix+'index.html','utf8');
 assert.equal(root.includes('src="/assets/entry-language.js"'),!prefix);
 const nav=root.match(/<nav class="lang-nav"[^>]*>(.*?)<\/nav>/)[1];
 assert.match(nav, /href="\/\?lang=en"[^>]*>EN<.*>DE<.*>HU</);
 for (const slug of ['spontan-2026','eletem-kepe','as-i-like-it-austria']){
  const html=fs.readFileSync(prefix+slug+'/index.html','utf8');
  assert.doesNotMatch(html,/entry-language\.js/);
  assert.match(html.match(/<nav class="lang-nav"[^>]*>(.*?)<\/nav>/)[1],/>EN<.*>DE<.*>HU</);
 }
}
console.log('PASS root language selection, English fallback, explicit language/deep-link preservation, and EN/DE/HU switcher order.');
