#!/usr/bin/env node
/**
 * Source/production separation for 2025 VIPACH exhibition media.
 * Data staging may be in this public source repository, but rights-unverified
 * works and artist portraits must never be copied into served public assets.
 *
 * Conservative checks:
 *  - staging source path is excluded from Jekyll output
 *  - no identical private-mirror image SHA256 or basename is in public assets
 *  - no unapproved 2025 work/portrait source URL is embedded in public pages
 * The Jekyll build output is separately inspected by the workflow.
 */
import assert from 'node:assert/strict';
import { archive2025Release } from './exhibition-2025-release-scope.mjs';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
const root=process.cwd();
const src=JSON.parse(fs.readFileSync('data/staging/2025-two-exhibitions.json','utf8'));
const config=fs.readFileSync('_config.yml','utf8');
if(!/exclude:\s*\n(?:(?:\s*-\s*[^\n]*\n)*)\s*-\s*['"]?data\/staging['"]?(?:\s|$)/m.test(config)){
 throw new Error('PUBLICATION BLOCKER: data/staging missing from GitHub Pages Jekyll exclude list');
}
if(src.exhibitions.length!==2)throw new Error('Unexpected historical exhibition count');
const restricted=new Map();
const urls=[];
for(const exhibition of src.exhibitions){
 for(const work of exhibition.works){
  if(work.publicReleaseApproved!==false)throw new Error('Unexpected work release state: '+work.id);
  restricted.set(work.sourceSha256,work.id);
  restricted.set(path.basename(work.imageMirrorRef||''),work.id);
  urls.push(work.imageSourceUrl);
 }
 for(const artist of exhibition.artistProfiles){
  if(!['rights-review-required','license-verification-required'].includes(artist.portraitStatus)) throw new Error('Unexpected portrait release state: '+artist.id);
  restricted.set(artist.portraitSha256,artist.id);
  restricted.set(path.basename(artist.portraitPrivateMirrorRef||''),artist.id);
  urls.push(artist.portraitSourceUrl);
 }
}
if(urls.length!==74)throw new Error('Expected exactly 40 works and 34 portrait uses');
const mediaExt=/\.(webp|png|jpe?g|avif|gif|tiff?)$/i;
const roots=['gallery','images','media','assets','public'];
let visited=0;
function walk(folder){
 if(!fs.existsSync(folder))return;
 for(const file of fs.readdirSync(folder,{withFileTypes:true})){
  const full=path.join(folder,file.name);
  if(file.isDirectory()){walk(full);continue;}
  if(!file.isFile()||!mediaExt.test(file.name))continue;
  visited++;
  if(restricted.has(file.name))throw new Error('UNAPPROVED_2025_MEDIA_FILENAME: '+full);
  const digest=crypto.createHash('sha256').update(fs.readFileSync(full)).digest('hex');
  if(restricted.has(digest))throw new Error('UNAPPROVED_2025_MEDIA_SHA256: '+full);
 }
}
for(const folder of roots)walk(path.join(root,folder));
// Strictly match each approved use on its own show route and in the
// designated gallery role. Duplicate hero, teaser, metadata and other
// route embeddings remain unauthorized even when the organizer gate is on.
const scope=archive2025Release();
const permitted=new Map();
for (const ex of src.exhibitions) for (const lang of ['en','hu','de']) {
 const rel=path.join(...(lang==='en'?[]:[lang]),ex.slug,'index.html');
 assert(fs.existsSync(rel),rel);
 if(scope)permitted.set(rel,[
  ...ex.works.map(w=>[w.imageSourceUrl,'exhibitor-work-image']),
  ...ex.artistProfiles.map(p=>[p.portraitSourceUrl,'exhibitor-portrait'])
 ]);
}
const allUrls=new Set(urls);
const nonPublic=new Set(['.git','.github','staging-preview','private-review','docs','scripts','templates','node_modules','_site']);
function scan(dir='.') {
 for(const entry of fs.readdirSync(dir,{withFileTypes:true})){
  if(nonPublic.has(entry.name))continue;
  const file=path.join(dir,entry.name);
  if(entry.isDirectory()){scan(file);continue;}
  if(!entry.isFile() || !entry.name.endsWith('.html'))continue;
  const html=fs.readFileSync(file,'utf8');
  const expected=permitted.get(file)||[];
  const attrs=[...html.matchAll(/<figure class="(exhibitor-work-image|exhibitor-portrait)"><img src="([^"]+)"[^>]*referrerpolicy="no-referrer"/g)];
  const uniqueMedia=new Map(expected.map(([url,role])=>[url+'|'+role,0]));
  for(const [,role,url] of attrs)if(uniqueMedia.has(url+'|'+role))uniqueMedia.set(url+'|'+role,uniqueMedia.get(url+'|'+role)+1);
  for(const [url,role] of expected)assert.equal(uniqueMedia.get(url+'|'+role),1,file+' missing/duplicate media in '+role+': '+url);
  for(const url of allUrls)assert.equal(html.split(url).length-1,expected.filter(([u])=>u===url).length,file+' has out-of-scope art/portrait URL: '+url);
  if(expected.length)assert(!/rel="license"|license-url|<meta[^>]+(?:og:image|twitter:image)|creativecommons\.org\/licenses/i.test(html),file+' unauthorized cover or reuse licence');
 }
}
scan();
console.log(JSON.stringify({
 state:scope?'PASS_OWNER_ATTESTED_ARCHIVE_USES':'PASS_SOURCE_ONLY',
 pages:6,
 reviewedMediaUses:urls.length,
 independentlyVerifiedUseCount:0,
 checkedPublicAssets:visited,
 jekyllExclusion:'data/staging,private-review',
 imagesCopiedIntoPublicAssets:false,
 ownerAttestedArchiveUses:scope?74:0
}));
