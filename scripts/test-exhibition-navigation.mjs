#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { newestFeatured, menuExhibitions } from './exhibition-chronology.mjs';
const site=JSON.parse(fs.readFileSync('data/site.json','utf8'));
const exhibits=fs.readdirSync('data/exhibitions').filter(f=>f.endsWith('.json'))
  .map(f=>JSON.parse(fs.readFileSync('data/exhibitions/'+f,'utf8')));
const featured=newestFeatured(exhibits,new Date('2026-11-22T12:00:00Z'));
assert.equal(featured.slug,'spontan-2026');
const menu=menuExhibitions(exhibits,featured,new Date('2026-11-22T12:00:00Z'));
assert.deepEqual(menu.slice(0,3).map(e=>e.slug),['spontan-2026','eletem-kepe','as-i-like-it-austria']);
const future={slug:'2027-test-exhibition',status:'planned',realized:false,render:'full-html',
  dates:{opening:{officialStart:'2027-01-10T17:00:00+01:00'}},publicationState:'published',publicReleaseApproved:true};
assert.equal(newestFeatured([...exhibits,future],new Date('2027-01-15T12:00:00Z')).slug,'spontan-2026');
const notApproved={...future,status:'closed',realized:true,publicReleaseApproved:false};
assert.equal(newestFeatured([...exhibits,notApproved],new Date('2027-01-15T12:00:00Z')).slug,'spontan-2026');
const approved={...notApproved,publicReleaseApproved:true};
assert.equal(newestFeatured([...exhibits,approved],new Date('2027-01-15T12:00:00Z')).slug,'2027-test-exhibition');
assert.equal(newestFeatured([...exhibits,approved],new Date('2026-11-22T12:00:00Z')).slug,'spontan-2026');
assert.equal(site.featuredExhibitionSlug,'spontan-2026');
const pages=[
  ['index.html',''],['hu/index.html','/hu'],['de/index.html','/de'],
  ['spontan-2026/index.html',''],['hu/spontan-2026/index.html','/hu'],['de/spontan-2026/index.html','/de'],
  ['eletem-kepe/index.html',''],['hu/eletem-kepe/index.html','/hu'],['de/eletem-kepe/index.html','/de'],
  ['as-i-like-it-austria/index.html',''],['hu/as-i-like-it-austria/index.html','/hu'],['de/as-i-like-it-austria/index.html','/de']
];
for(const [path,prefix] of pages){
  const html=fs.readFileSync(path,'utf8');
  assert.match(html,/class="exhibition-nav-group"/,path+' must contain shared hamburger exhibition navigation');
  for(const slug of ['eletem-kepe','as-i-like-it-austria']){
    assert.ok(html.includes('href="'+prefix+'/'+slug+'/'),path+' missing historical exhibition '+slug);
  }
  assert.match(html,/id="site-menu"/,path+' missing menu');
  const nav=html.match(/<nav\b[^>]*id="site-menu"[^>]*>([\s\S]*?)<\/nav>/)[1];
  assert.ok(!/^\s*<a\b/.test(nav),path+' no standalone section navigation');
  const groups=[...nav.matchAll(/<details class="exhibition-disclosure" data-exhibition="([^"]+)">([\s\S]*?)<\/details>/g)];
  assert.deepEqual(groups.map(g=>g[1]),['spontan-2026','eletem-kepe','as-i-like-it-austria']);
  for(const [_,slug,group] of groups){
    assert.match(group,/<summary class="exhibition-menu-summary">/);
    const refs=[...group.matchAll(/href="([^"#]*)#([^"]+)"/g)];
    assert.ok(refs.length>=5,path+' '+slug);
    for(const [,route,id] of refs){
      const target=route?route.slice(1)+'index.html':path;
      assert.ok(fs.readFileSync(target,'utf8').includes('id="'+id+'"'),path+' broken section '+route+'#'+id);
    }
    if(slug==='as-i-like-it-austria')assert.ok(!group.includes('#history'),path+' earliest exhibition has no history section');
  }
}
console.log('PASS: newest released show on homepage, two archive entries in HU/EN/DE, future-dated/unapproved content excluded');
