#!/usr/bin/env node
/**
 * 2025 exhibitions: fail-closed image rights + editorial release preflight.
 * Does not mutate site/data and cannot publish images by itself.
 *
 * Usage:
 *   node scripts/check-2025-publication-gate.mjs --expect-blocked
 *   VIPACH_PRIVATE_EVIDENCE_DIR=/path/to/private-approved-documents \
 *   VIPACH_RIGHTS_MANIFEST=/path/to/private-rights-evidence.json \
 *      node scripts/check-2025-publication-gate.mjs --require-go
 *
 * The manifest is supplied securely from outside the public Exhibition repo.
 * For every artist portrait AND every exhibited work, require a matching usage
 * record with identity, SHA256, copyright holder, licensee, public-web scope
 * and a verifiable, locally present rights document with SHA256 evidence.
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const stage=JSON.parse(fs.readFileSync(path.join(ROOT,'data/staging/2025-two-exhibitions.json'),'utf8'));
const expected=[];
const shaRe=/^[a-f0-9]{64}$/i;
const LABEL='VIPACH Exhibition website archive';
const now=Date.now();

function requireString(v){return typeof v==='string'&&v.trim().length>0;}
function digest(file){return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');}

for(const ex of stage.exhibitions){
 for(const w of ex.works){
  if(!shaRe.test(w.sourceSha256||''))throw new Error('Missing catalog artwork digest: '+w.id);
  expected.push({key:ex.slug+'/work/'+w.id,show:ex.slug,role:'work',id:w.id,sha:w.sourceSha256,creatorStatus:w.creatorStatus});
 }
 for(const a of ex.artistProfiles){
  if(!shaRe.test(a.portraitSha256||''))throw new Error('Missing portrait digest: '+ex.slug+'/'+a.id);
  expected.push({key:ex.slug+'/portrait/'+a.id,show:ex.slug,role:'portrait',id:a.id,sha:a.portraitSha256,creatorStatus:'identified'});
 }
}
if(expected.length!==74 || stage.exhibitions.length!==2)throw new Error('Unexpected 2025 exhibition source coverage');

const reasons=[];
const unidentified=expected.filter(x=>x.role==='work' && x.creatorStatus!=='identified');
if(unidentified.length)reasons.push('UNRESOLVED_ARTIST_CREDITS:'+unidentified.map(x=>x.key).join(','));
let evidence=null;
const manifestPath=process.env.VIPACH_RIGHTS_MANIFEST||'';
const evidenceRoot=process.env.VIPACH_PRIVATE_EVIDENCE_DIR||'';
if(manifestPath && fs.existsSync(manifestPath)){
 try {evidence=JSON.parse(fs.readFileSync(manifestPath,'utf8'));}catch(err){reasons.push('MALFORMED_MANIFEST:'+err.message);}
}else{
 reasons.push('MISSING_PRIVATE_RIGHTS_MANIFEST');
}

const records=evidence?.usageApprovals;
if(evidence && (!Array.isArray(records) || evidence.schemaVersion!=='vipach-2025-rights-v1'))reasons.push('INVALID_RIGHTS_MANIFEST_SCHEMA');
const byKey=new Map((Array.isArray(records)?records:[]).map(x=>[x.key,x]));
if(evidence && byKey.size!==records?.length)reasons.push('DUPLICATED_USAGE_APPROVAL_KEYS');

let verified=0;
for(const asset of expected){
 const record=byKey.get(asset.key);
 if(!record){reasons.push('MISSING_APPROVAL:'+asset.key);continue;}
 if(record.sha256!==asset.sha){reasons.push('IMAGE_DIGEST_MISMATCH:'+asset.key);continue;}
 if(record.approved!==true || record.scope!==LABEL){reasons.push('NOT_APPROVED_FOR_PUBLIC_WEB:'+asset.key);continue;}
 if(!requireString(record.copyrightHolder)||!requireString(record.licensee)||!requireString(record.approvedBy)||!requireString(record.approvalDate)){
   reasons.push('INCOMPLETE_LICENSE_METADATA:'+asset.key);continue;
 }
 if(record.expiresAt && Date.parse(record.expiresAt)<now){reasons.push('EXPIRED_PERMISSION:'+asset.key);continue;}
 if(!evidenceRoot || !requireString(record.evidenceFile) || !shaRe.test(record.evidenceSha256||'')){
   reasons.push('MISSING_PRIVATE_EVIDENCE_FILE:'+asset.key);continue;
 }
 try{
   const dir=fs.realpathSync(evidenceRoot);
   const p=fs.realpathSync(path.resolve(dir,record.evidenceFile));
   if(!p.startsWith(dir+path.sep))throw new Error('evidence outside trusted directory');
   if(!fs.statSync(p).isFile())throw new Error('not regular evidence file');
   if(digest(p)!==record.evidenceSha256)throw new Error('evidence digest mismatch');
   verified++;
 }catch(err){reasons.push('INVALID_PRIVATE_EVIDENCE:'+asset.key+':'+err.message);}
}

const summary={
 status:reasons.length?'NO-GO':'GO',
 publicationEligible:reasons.length===0,
 exhibitions:stage.exhibitions.map(x=>x.slug),
 artworkCount:40,
 portraitUseCount:34,
 imageUseCount:expected.length,
 verifiedUseCount:verified,
 unidentifiedArtistCredits:unidentified.length,
 reasons,
 rightsManifestMustRemainPrivate:true,
 appliedToProduction:false
};
console.log(JSON.stringify(summary,null,2));
if(process.argv.includes('--require-go') && reasons.length)process.exitCode=1;
if(process.argv.includes('--expect-blocked') && (!reasons.length || summary.status!=='NO-GO'))process.exitCode=1;
