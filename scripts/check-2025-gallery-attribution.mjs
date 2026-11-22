#!/usr/bin/env node
/**
 * Verifies the exact two 2025 Wix Pro Gallery photo-to-artist links.
 * Rights are checked separately; attribution is not republication consent.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
const main=JSON.parse(fs.readFileSync('data/staging/2025-two-exhibitions.json','utf8'));
const wix=JSON.parse(fs.readFileSync('data/staging/2025-progallery-artist-mapping.json','utf8'));
assert.equal(main.exhibitions.length,2);
assert.equal(wix.rows.length,40);
assert.equal(wix.photoPublicationRightsVerified,false);
assert.equal(main.readiness.productionReleaseApproved,false);
const expected={"eletem-kepe":"6633bc43-2980-4c26-b5d8-ff681a94d44c","as-i-like-it-austria":"adbad2f0-6faf-45ab-84a8-131723699615"};
const seenRows=new Set();
const suffix=s=>String(s||'').split('?')[0].split('#')[0].replace(/\/+$/,'').split('/').at(-1).toLowerCase();
for(const exhibition of main.exhibitions){
  assert.equal(exhibition.works.length,20);
  assert.equal(exhibition.unresolvedWorkCount,0);
  const gid=expected[exhibition.slug];
  assert.ok(gid,exhibition.slug);
  const positions=new Set();
  const roster=new Map(exhibition.artistProfiles.map(p=>[p.id,p]));
  for(const work of exhibition.works){
    assert.equal(work.creatorStatus,'identified',work.id);
    const e=work.galleryEvidence;
    assert.ok(e,'Missing gallery attribution '+work.id);
    assert.equal(e.galleryId,gid,work.id);
    assert.equal(e.imageFileId,work.imageSourceUrl.split('/').at(-1),work.id);
    assert.ok(e.galleryPosition>=1&&e.galleryPosition<=20,work.id);
    assert.ok(!positions.has(e.galleryPosition),'Duplicate photo position '+work.id);
    positions.add(e.galleryPosition);
    const artist=roster.get(e.artistProfileId);
    assert.ok(artist,'Missing profile '+work.id);
    assert.equal(work.creator,artist.name,work.id);
    assert.ok(e.linkedArtistProfile?.startsWith('https://'),work.id);
    const sameSlug=suffix(e.linkedArtistProfile)===suffix(artist.legacyProfileUrl);
    const isNorbertPortfolio=exhibition.slug==='eletem-kepe'&&work.creator==='Norbert Bánhalmi'&&
      e.linkedArtistProfile==='https://www.norbertbanhalmi.com/mybest';
    assert.ok(sameSlug||isNorbertPortfolio,'Artist link mismatch '+work.id);
    assert.equal(work.licenseVerificationStatus,'license-verification-required',work.id);
    assert.equal(work.publicReleaseApproved,false,work.id);
    const row=wix.rows.find(x=>x.workId===work.id&&x.exhibitionSlug===exhibition.slug);
    assert.ok(row,'Missing forensic provenance row '+work.id);
    assert.equal(row.sourceImageUrl,work.imageSourceUrl,work.id);
    assert.equal(row.linkedArtistProfile,e.linkedArtistProfile,work.id);
    assert.equal(row.sourceImageFileId,e.imageFileId,work.id);
    assert.equal(row.artworkSha256,work.sourceSha256,work.id);
    assert.equal(row.galleryItemId,e.galleryItemId,work.id);
    assert.equal(row.galleryPosition,e.galleryPosition,work.id);
    assert.equal(row.artistName,work.creator,work.id);
    assert.ok(!seenRows.has(row.workId),work.id);
    seenRows.add(row.workId);
  }
  assert.equal(positions.size,20,exhibition.slug);
}
assert.equal(seenRows.size,40);
console.log('PASS 40/40 Wix gallery photos matched to roster profiles; no unknown credits, 0 public image licences inferred');
