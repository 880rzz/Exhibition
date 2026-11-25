import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
const root=new URL('../',import.meta.url);
const read=(p)=>fs.readFileSync(new URL(p,root));
const digest=(b)=>crypto.createHash('sha256').update(b).digest('hex');
const dataPath='data/staging/2025-two-exhibitions.json';
const approvalPath='data/staging/2025-archive-release-scope.json';
export function archive2025Release() {
 if(!fs.existsSync(new URL(approvalPath,root)))return null;
 const a=JSON.parse(read(approvalPath));
 assert.equal(a.schemaVersion,'vipach-2025-organizer-archive-attestation-v1');
 assert.equal(a.authority,'VIPACH organizer attestation; independent permissions not reviewed');
 assert.equal(a.permittedUse,'display-on-exhibition.vipach.at-archive-only');
 assert.equal(a.mediaHosting,'existing-public-wix-source-no-copy');
 assert.equal(a.publicReuseAuthorized,false);
 assert.equal(a.independentlyVerifiedUseCount,0);
 assert.equal(a.approvedOn,'2026-11-25');
 assert.deepEqual(a.slugs,['eletem-kepe','as-i-like-it-austria']);
 const source=read(dataPath);
 assert.equal(digest(source),a.exactSourceInventorySha256,'organizer attestation no longer binds to the exact source inventory');
 const shows=JSON.parse(source).exhibitions;
 const roles={'work':0,'portrait':0};const uses=new Set();
 for(const x of shows){
  assert(a.slugs.includes(x.slug),x.slug);
  for(const w of x.works){
   assert.equal(w.creatorStatus,'identified',w.id);
   assert.equal(path.basename(new URL(w.imageSourceUrl).pathname),w.galleryEvidence.imageFileId,w.id);
   assert.match(w.sourceSha256,/^[a-f0-9]{64}$/);
   uses.add(x.slug+'/work/'+w.id);roles.work++;
  }
  for(const p of x.artistProfiles){
   assert.match(p.portraitSha256,/^[a-f0-9]{64}$/);
   assert.equal(new URL(p.portraitSourceUrl).hostname,'static.wixstatic.com');
   uses.add(x.slug+'/portrait/'+p.id);roles.portrait++;
  }
 }
 assert.deepEqual(roles,{work:40,portrait:34});
 assert.equal(uses.size,74);
 return {...a,shows};
}
