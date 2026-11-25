#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const dir='data/exhibitions';
const displays={
  'spontan-2026':2,
  'eletem-kepe':3,
  'as-i-like-it-austria':3,
  'touch-2-0':0,
  'en-a-no':0,
  'famme-fatale':0,
  'eletem-kepe-2-0':0,
  'famme-fatale-2-0':0
};
const articles={
  'spontan-2026':[
    'https://www.becsiszelet.at/post/spontan-fotokiallitas-megnyito-becs-2026',
    'https://www.becsiszelet.at/de/post/spontan-fotoausstellung-eroeffnung-wien-2026'
  ],
  'eletem-kepe':[
    'https://volksgruppen.orf.at/magyarok/stories/3332313/',
    'https://rolunk.at/kultura/egyeves-a-bmi-fotoklub-hogyan-teremt-kozosseget-a-muveszet/',
    'https://www.stihon.eu/wp-content/uploads/2026/01/Horizont.03.Web_.pdf#page=7'
  ],
  'as-i-like-it-austria':[
    'https://volksgruppen.orf.at/magyarok/stories/3332313/',
    'https://rolunk.at/kultura/egyeves-a-bmi-fotoklub-hogyan-teremt-kozosseget-a-muveszet/',
    'https://www.stihon.eu/wp-content/uploads/2026/01/Horizont.03.Web_.pdf#page=7'
  ]
};
assert.equal(fs.readdirSync(dir).filter(f=>f.endsWith('.json')).length,Object.keys(displays).length,'unexpected exhibition count');
for(const [slug,n] of Object.entries(displays)){
  const e=JSON.parse(fs.readFileSync(path.join(dir,slug+'.json'),'utf8'));
  assert.equal(e.slug,slug);
  assert.equal(e.pressCoverage?.items?.length,n,slug+' press item count');
  for(const item of e.pressCoverage.items){
    assert.ok(/^https:\/\//.test(item.url),slug+' HTTPS only');
    assert(item.date ? /^\d{4}-\d{2}-\d{2}$/.test(item.date) : item.issue==='2026/3 · 12–13');
    assert.ok(item.publication&&item.title&&item.type);
    assert.ok(['opening-report','exhibition-report','advance-mention','exhibition-mention'].includes(item.type));
    for(const lang of ['en','hu','de'])assert.ok(item.description[lang]?.length>10,slug+' '+lang+' description');
    assert.ok(articles[slug].includes(item.url),slug+' unexpected source '+item.url);
  }
}
for(const lang of ['en','hu','de']){
  const prefix=lang==='en'?'':lang+'/';
  const routes=[
    [prefix+'index.html','spontan-2026'],
    [prefix+'spontan-2026/index.html','spontan-2026'],
    [prefix+'eletem-kepe/index.html','eletem-kepe'],
    [prefix+'as-i-like-it-austria/index.html','as-i-like-it-austria']
  ];
  for(const [route,slug] of routes){
    const html=fs.readFileSync(route,'utf8');
    assert.equal(html.split('id="ex-press-title"').length-1,1,route+' press heading unique');
    assert.equal(html.split('class="ex-press-item"').length-1,displays[slug],route+' exact sourced press items');
    assert.equal(html.split('class="ex-press-section"').length-1,1,route+' no duplicate press section');
    for(const url of articles[slug])assert.ok(html.includes('href="'+url+'"'),route+' missing source URL');
    assert.ok(html.includes('id="press"'),route);
  }
}
console.log('PASS: press sources 8 exhibition-article relationships; 12 rendered HU/EN/DE routes; 0 fabricated historical/2027 sources');
