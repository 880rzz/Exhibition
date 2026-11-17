#!/usr/bin/env node
import fs from 'node:fs';
import assert from 'node:assert/strict';

const url = 'https://www.vipach.at/#organization';
const wd = 'https://www.wikidata.org/wiki/Q138416887';
const profile = 'https://okoszisztema.kozpontiszovetseg.at/intezmenyek/vipach/';
const files = [
  ['index.html', 'en'],
  ['hu/index.html', 'hu'],
  ['de/index.html', 'de-AT']
];
const eventId = 'https://exhibition.vipach.at/#event';
for (const [path, locale] of files) {
  const source = fs.readFileSync(path, 'utf8');
  const blocks = [...source.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
  assert.equal(blocks.length, 1, path + ': exactly one structured-data graph');
  const doc = JSON.parse(blocks[0][1]);
  assert.equal(doc['@context'], 'https://schema.org', path);
  assert(Array.isArray(doc['@graph']) && doc['@graph'].length >= 64, path + ': art/artist graph missing');
  const graph = doc['@graph'];
  const ids = graph.map(x => x['@id']).filter(Boolean);
  assert.equal(new Set(ids).size, ids.length, path + ': duplicate @id');
  const org = graph.find(x => x['@id'] === url);
  assert(org?.sameAs?.includes(wd), path + ': canonical VIPACH identity');
  assert.equal(org.subjectOf?.['@id'], profile, path + ': federation source profile');
  const event = graph.find(x => x['@id'] === eventId);
  assert.equal(event?.organizer?.['@id'], url, path + ': event organizer');
  const mainPage = graph.find(x => x['@type'] === 'WebPage' && x.url?.startsWith('https://exhibition.vipach.at/'));
  assert.equal(mainPage?.inLanguage, locale, path + ': page language');
  assert.equal(mainPage?.publisher?.['@id'], url, path + ': page publisher');
  const creator = graph.find(x => x['@id'] === 'https://exhibition.vipach.at/#norbert-banhalmi');
  assert(creator?.sameAs?.includes('https://www.wikidata.org/wiki/Q56391118'), path + ': Norbert identity');
  assert(graph.filter(x => x['@type'] === 'ImageObject' || String(x['@id']).includes('#licensed-image')).length >= 20, path + ': artwork images lost');
}
console.log('PASS: Exhibition HU/EN/DE valid schema, 64 nodes, VIPACH official and federation links.');
