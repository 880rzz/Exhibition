#!/usr/bin/env node
/**
 * VIPACH 2025: two Exhibition-style archival previews.
 * Produces review-only HTML in staging-preview/, never production routes.
 * All art references remain historical Wix URLs until publication rights clear.
 * Run: node scripts/build-2025-staging-previews.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const OUT=path.join(ROOT,'staging-preview');
const source=JSON.parse(fs.readFileSync(path.join(ROOT,'data/staging/2025-two-exhibitions.json'),'utf8'));
const editorial=JSON.parse(fs.readFileSync(path.join(ROOT,'data/staging/2025-editorial-copy.json'),'utf8'));
const cmsSource=JSON.parse(fs.readFileSync(path.join(ROOT,'data/staging/2025-cms-editorial-source.json'),'utf8'));
const cmsById=new Map(cmsSource.records.map(r=>[r.id,r]));
const allowed=new Set(['eletem-kepe','as-i-like-it-austria']);
const locales=['hu','en','de'];
const A=v=>String(v??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
const absUrl=u=>/^https:\/\/(?:www\.vipach\.at|static\.wixstatic\.com)\//.test(u||'')?u:'';
const badge=(text)=>'<p class="kicker">'+A(text)+'</p>';
const noTitle=(w,c)=>w.title?.[c]||w.title?.hu||null;
const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'');
const formatSourceText=s=>String(s||'').split(/\n\s*\n/).map(p=>'<p>'+A(p.trim()).replace(/\n/g,'<br>')+'</p>').join('');
const sourceDetails=(body,label)=>body?'<details class="ex25-original"><summary>'+A(label)+'</summary><div class="ex25-original-prose" lang="hu">'+formatSourceText(body)+'</div></details>':'';
const srcImage=(url,alt,cls)=>url?'<img class="'+cls+'" src="'+A(url)+'" alt="'+A(alt)+'" loading="lazy" decoding="async">':'<div class="no-portrait" aria-hidden="true">VIPACH</div>';
function render(ex,lang){
  const c=editorial.exhibitions[ex.slug][lang];
  const title=c.title;
  const titleText=(ex.slug==='eletem-kepe'?'Életem képe':'As I Like It Austria');
  const dateRange=ex.slug==='eletem-kepe'?'07—13.12.2025':'30.11—06.12.2025';
  const rootPrefix=lang==='en'?'':('/'+lang);
  const hreflang=locales.map(l=>'<link rel="alternate" hreflang="'+(l==='de'?'de-AT':l)+'" href="https://exhibition.vipach.at/'+(l==='en'?'':l+'/')+ex.slug+'/">').join('\n');
  const languageNav=locales.map(l=>'<a lang="'+(l==='de'?'de-AT':l)+'" href="'+(l==='en'?'':('/'+l))+'/'+ex.slug+'/"'+(lang===l?' aria-current="page"':'')+'>'+l.toUpperCase()+'</a>').join('');
  const artistPanels=ex.artistProfiles.map((p,i)=>{
    const image=absUrl(p.portraitSourceUrl);
    const cmsArtist=cmsSource.records.find(r=>r.exhibitionId===ex.wixExhibitionId && norm(r.artistName)===norm(p.name));
    const originalBio=cmsArtist?.biography||'';
    const bio=sourceDetails(originalBio,lang==='hu'?'Teljes alkotói bemutatkozás (Wix-forrás)':lang==='de'?'Vollständige Künstlerbiografie (ungarischer Originaltext)':'Full artist biography (Hungarian source text)');
    return '<article class="ex25-artist reveal" id="artist-'+A(p.id)+'">'
    +'<div class="ex25-portrait">'+srcImage(image,p.name+' — Wix-archívum, portré', 'ex25-portrait-img')+'</div>'
    +'<div class="ex25-artist-body"><span class="ex25-number">'+String(i+1).padStart(2,'0')+'</span>'
    +'<h3>'+A(p.name)+'</h3>'
    +'<a href="'+A(p.legacyProfileUrl)+'" rel="noopener noreferrer" target="_blank">'+A(c.source)+'</a>'+bio+'</div></article>';
  }).join('\n');
  const works=ex.works.map((w,i)=>{
    const artist=w.creator&&w.creatorStatus==='identified'?w.creator:c.unknown;
    const titleValue=noTitle(w,lang)||c.untitled;
    const image=absUrl(w.imageSourceUrl);
    const alt=(w.creatorStatus==='identified'?artist+': ':'')+titleValue;
    const cmsWork=cmsById.get(w.wixRecordId);
    const originalDescription=cmsWork&&(w.sourceImageSlot==='artwork-1'?cmsWork.firstArtworkDescription:w.sourceImageSlot==='artwork-2'?cmsWork.secondArtworkDescription:'');
    const desc=sourceDetails(originalDescription,lang==='hu'?'Eredeti műleírás a Wixről':lang==='de'?'Originale Werkbeschreibung aus Wix (ungarisch)':'Original artwork description from Wix (Hungarian)');
    return '<figure class="ex25-work reveal" id="work-'+A(w.id)+'">'
      +'<div class="ex25-work-media">'+srcImage(image,alt,'ex25-work-img')+'</div>'
      +'<figcaption><span class="ex25-number">'+String(i+1).padStart(2,'0')+' / 20</span>'
      +'<strong>'+A(artist)+'</strong><span>'+A(titleValue)+'</span>'
      +'<small>'+A(w.creatorStatus!=='identified'?'Attribution pending':c.gallery)+'</small>'+desc+'</figcaption></figure>';
  }).join('\n');
  const countLabel=ex.slug==='eletem-kepe'?'15':'19';
  const intro=c.intro.map(p=>'<p>'+A(p)+'</p>').join('\n');
  const navLabels={hu:['Történet','Kiállítók','Művek','Stáb'],en:['Story','Artists','Works','Team'],de:['Geschichte','Kunstschaffende','Werke','Team']}[lang];
  const headLinks=[
    '<meta charset="utf-8">',
    '<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">',
    '<meta name="robots" content="noindex,nofollow,noimageindex">',
    '<meta name="vipach:stage" content="PREPUBLICATION-REVIEW-NOT-LICENSED">',
    '<meta name="theme-color" content="#f2f2ef">',
    '<title>'+A(title)+' | VIPACH Exhibition — staging preview</title>',
    '<meta name="description" content="'+A(c.eyebrow+' · '+c.date)+'">',
    '<link rel="stylesheet" href="/assets/styles.css">',
    '<link rel="stylesheet" href="/assets/2025-exhibitions.css">',
    hreflang
  ].join('\n');
  return '<!doctype html>\n<html lang="'+(lang==='de'?'de-AT':lang)+'">\n<head>\n'+headLinks+'\n</head>'
  +'<body class="ex25-body"><a class="skip-link" href="#content">'+(lang==='hu'?'Ugrás a tartalomra':lang==='de'?'Zum Inhalt springen':'Skip to content')+'</a>'
  +'<header class="site-header"><a class="brand" href="https://www.vipach.at/" aria-label="VIPACH"><span><strong>VIPACH</strong> / Exhibition</span></a>'
  +'<div class="header-tools"><nav class="lang-nav" aria-label="Language">'+languageNav+'</nav>'
  +'<button class="menu-toggle" type="button" aria-controls="site-menu" aria-expanded="false" aria-label="Menu"><span></span><span></span></button></div>'
  +'<nav id="site-menu" class="site-menu" aria-label="Exhibition navigation">'
  +['story','exhibitors','works','team'].map((id,i)=>'<a href="#'+id+'">'+A(navLabels[i])+'</a>').join('')
  +'</nav></header>'
  +'<main id="content" class="ex25-main">'
  +'<section class="ex25-hero" aria-labelledby="hero-title"><div class="ex25-hero-inner">'
  +badge('VIPACH · Vienna Photo Art & Creative Hub')
  +'<h1 id="hero-title">'+A(title)+'</h1><p class="ex25-lede">'+A(c.eyebrow)+'</p>'
  +'<div class="ex25-meta"><span>'+dateRange+'</span><span>CITYgalleryVIENNA · Wien</span><span>'+A(c.status)+'</span></div></div></section>'
  +'<div class="ex25-prepublication" role="note"><strong>REVIEW ONLY · NO PUBLICATION</strong><p>'+A(c.pending)+'</p></div>'
  +'<section class="section" id="story"><div class="section-inner editorial-grid">'
  +'<div class="reveal">'+badge('01 / '+c.eyebrow)+'<h2 class="display-2">'+A(titleText)+'</h2></div>'
  +'<div class="prose reveal">'+intro+'</div></div></section>'
  +'<section class="section ex25-artists-section" id="exhibitors"><div class="section-inner">'
  +badge('02 / '+countLabel+' '+c.artists.toLowerCase())+'<h2 class="display-2">'+A(c.artists)+'</h2>'
  +'<div class="ex25-artists-grid">'+artistPanels+'</div></div></section>'
  +'<section class="section dark ex25-works-section" id="works"><div class="section-inner">'
  +badge('03 / 20')+'<h2 class="display-2">'+A(c.works)+'</h2>'
  +'<p class="ex25-gallery-note">'+A(c.gallery)+'</p>'
  +'<div class="ex25-works-grid">'+works+'</div></div></section>'
  +'<section class="section" id="team"><div class="section-inner editorial-grid">'
  +'<div class="reveal">'+badge('04 / VIPACH')+'<h2 class="display-2">'+A(c.team)+'</h2></div>'
  +'<div class="prose reveal"><dl class="ex25-credits"><dt>'+A(c.when)+'</dt><dd>'+A(c.date)+'</dd>'
  +'<dt>'+A(c.venue)+'</dt><dd>CITYgalleryVIENNA by publicartists · Wien, 1. Bezirk</dd>'
  +'<dt>'+A(c.curator)+'</dt><dd>Balogh Dávid · művészettörténész és muzeológus</dd>'
  +'<dt>'+A(c.organizer)+'</dt><dd>Bánhalmi Norbert · Bécsi Magyar Iskola (BMI) Fotoklub</dd></dl>'
  +'<p>'+A(c.register)+'</p>'
  +'<p><a href="'+A(ex.sourceUrl)+'" rel="noopener noreferrer" target="_blank">'+A(c.source)+' ↗</a></p>'
  +'<p><a href="https://exhibition.vipach.at/'+(lang==='en'?'':lang+'/')+'">'+A(c.back)+' ↗</a></p>'
  +'</div></div></section>'
  +'<section class="section image-rights"><div class="section-inner"><h2>Copyright / image rights</h2><p>'+A(c.pending)+'</p>'
  +'<p>No verified licence is inferred from prior Wix display. Every image and portrait needs its own clearance before the production release.</p></div></section>'
  +'</main><footer class="site-footer"><div class="footer-inner"><div><div class="footer-brand">VIPACH</div>'
  +'<div class="eyebrow">Vienna Photo Art &amp; Creative Hub</div></div>'
  +'<div class="footer-meta">'+A(title)+' · 2025 · <a href="mailto:office@vipach.at">office@vipach.at</a>'
  +' · <a href="https://www.vipach.at/kapcsolat/impresszum">Impressum</a></div></div></footer>'
  +'<script src="/assets/site.js" defer></script></body></html>\n';
}
if(source.exhibitions.length!==2 || source.exhibitions.some(x=>!allowed.has(x.slug)||x.works.length!==20)) throw Error('source galleries not two x20');
if(source.readiness?.productionReleaseApproved!==false) throw Error('publication lock not engaged');
for(const ex of source.exhibitions){
  for(const lang of locales){
    const p=path.join(OUT,lang,ex.slug,'index.html');
    fs.mkdirSync(path.dirname(p),{recursive:true});
    fs.writeFileSync(p,render(ex,lang));
  }
}
for(const fn of ['styles.css','site.js','2025-exhibitions.css']){
 const src=path.join(ROOT,'assets',fn);
 fs.mkdirSync(path.join(OUT,'assets'),{recursive:true});
 fs.copyFileSync(src,path.join(OUT,'assets',fn));
}
const receipt={
 stage:'REVIEW-ONLY-NOT-PUBLISHED',sourceCommit:source.sourceCommit,wixCmsRecords:cmsSource.records.length,wixFullBiographies:cmsSource.records.filter(x=>x.biography).length,wixArtworkDescriptions:cmsSource.records.filter(x=>x.firstArtworkDescription).length,exhibitions:source.exhibitions.map(x=>({
 slug:x.slug,artists:x.artistProfiles.length,portraitReferences:x.artistProfiles.filter(a=>a.portraitSourceUrl).length,
 works:x.works.length,unresolvedCreators:x.unresolvedWorkCount
 })),languagePages:6,imageRightsVerified:0,productionReleaseApproved:false
};
fs.writeFileSync(path.join(OUT,'staging-receipt.json'),JSON.stringify(receipt,null,2)+'\n');
console.log(JSON.stringify(receipt,null,2));