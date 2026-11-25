#!/usr/bin/env node
/**
 * Életem képe & As I Like It Austria — exact SPONTÁN visual component structure.
 * SOURCE-ONLY: writes review HTML to staging-preview/; production builder untouched.
 * Images are original Wix media references, mirrored privately under VIPACH.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { newestFeatured, menuExhibitions, exhibitionDate } from './exhibition-chronology.mjs';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const OUT=path.join(ROOT,'staging-preview');
const inventory=JSON.parse(fs.readFileSync(path.join(ROOT,'data/staging/2025-two-exhibitions.json'),'utf8'));
const editorial=JSON.parse(fs.readFileSync(path.join(ROOT,'data/staging/2025-editorial-copy.json'),'utf8'));
const wix=JSON.parse(fs.readFileSync(path.join(ROOT,'data/staging/2025-cms-editorial-source.json'),'utf8'));
const CMS=new Map(wix.records.map(r=>[r.id,r]));
const publishedExhibitions=fs.readdirSync(path.join(ROOT,'data/exhibitions'))
  .filter(f=>f.endsWith('.json'))
  .map(f=>JSON.parse(fs.readFileSync(path.join(ROOT,'data/exhibitions',f),'utf8')));
const currentlyFeatured=newestFeatured(publishedExhibitions);
const navigationExhibitions=menuExhibitions(publishedExhibitions,currentlyFeatured);
const previewSlugs=new Set(inventory.exhibitions.map(e=>e.slug));
const locales=['en','hu','de'];
const esc=x=>String(x??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
const norm=x=>String(x||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'');
const img=u=>/^https:\/\/static\.wixstatic\.com\/media\/[^\s"'<>]+$/.test(u||'')?u:'';
const htmlText=t=>String(t||'').split(/\n\s*\n/).map(x=>x.trim()).filter(Boolean).map(p=>'<p>'+esc(p).replace(/\n/g,'<br>')+'</p>').join('');
const copy={
 en:{story:'Exhibition story',artists:'Meet the artists',artworks:'Artwork',artist:'About the artist',team:'Behind the exhibition',past:'Previous exhibitions',archive:'Exhibitions',latest:'Latest exhibition',visit:'Exhibition details',rights:'Image rights and copyright',opening:'Opening',dates:'Exhibition',venue:'Venue',credit:'Curator',org:'Organisation',works:'20 works',exhibitorJump:'Jump to an artist',source:'Source: original Hungarian Wix text',original:'Original Hungarian wording',unknown:'Creator pending attribution',untitled:'Title pending verification',statement:'Twenty photographs. Personal perspectives. One shared encounter.',review:'REVIEW ONLY — no publication authorisation',skip:'Skip to content'},
 hu:{story:'A kiállítás története',artists:'Ismerd meg az alkotókat',artworks:'A műről',artist:'Az alkotóról',team:'A kiállítás mögött',past:'Korábbi kiállítások',archive:'Kiállítások',latest:'Legújabb kiállítás',visit:'Látogatási információk',rights:'Képfelhasználási és szerzői jogi feltételek',opening:'Megnyitó',dates:'A kiállítás időpontja',venue:'Helyszín',credit:'Kurátor',org:'Szervezés',works:'20 kiállított mű',exhibitorJump:'Ugrás egy kiállítóhoz',source:'Forrás: eredeti magyar Wix-szöveg',original:'Eredeti magyar szöveg',unknown:'Az alkotó azonosítása folyamatban',untitled:'A mű címe ellenőrzés alatt',statement:'Húsz fénykép. Személyes nézőpontok. Egy közös találkozás.',review:'ELŐNÉZET — PUBLIKÁCIÓRA NEM ENGEDÉLYEZETT',skip:'Ugrás a tartalomra'},
 de:{story:'Die Geschichte der Ausstellung',artists:'Die Kunstschaffenden',artworks:'Über das Werk',artist:'Über die Künstlerin / den Künstler',team:'Hinter der Ausstellung',past:'Frühere Ausstellungen',archive:'Ausstellungen',latest:'Neueste Ausstellung',visit:'Besuchsinformationen',rights:'Bildrechte und Urheberrecht',opening:'Eröffnung',dates:'Ausstellungszeitraum',venue:'Ort',credit:'Kurator',org:'Organisation',works:'20 ausgestellte Werke',exhibitorJump:'Zu den Kunstschaffenden',source:'Quelle: ungarischer Wix-Originaltext',original:'Originaltext auf Ungarisch',unknown:'Urheberschaft wird geprüft',untitled:'Werktitel noch unbestätigt',statement:'Zwanzig Fotografien. Persönliche Perspektiven. Eine gemeinsame Begegnung.',review:'ENTWURF — KEINE FREIGABE ZUR VERÖFFENTLICHUNG',skip:'Zum Inhalt springen'}
};
const showName=(slug,lang)=>{
 if(slug==='spontan-2026')return {en:'SPONTANEOUS',hu:'SPONTÁN',de:'SPONTAN'}[lang];
 if(slug==='eletem-kepe')return {en:'The Image of My Life',hu:'Életem képe',de:'Das Bild meines Lebens'}[lang];
 return 'As I Like It Austria';
};
const route=(slug,lang)=> (lang==='en'?'':'/'+lang)+'/'+slug+'/';
function exhibitionHref(exhibition,lang){
 if(previewSlugs.has(exhibition.slug))return '../../'+lang+'/'+exhibition.slug+'/index.html';
 return 'https://exhibition.vipach.at/'+(lang==='en'?'':lang+'/')+
   (exhibition.slug===currentlyFeatured.slug?'':exhibition.slug+'/');
}
function exhibitionName(exhibition,lang){
 return exhibition.titles?.[lang]||showName(exhibition.slug,lang);
}
function menuHtml(lang,slug){
 const c=copy[lang];
 const items=navigationExhibitions.map((ex,i)=>{
   const year=exhibitionDate(ex)?.slice(0,4)||String(ex.year||'');
   const href=exhibitionHref(ex,lang);
   return '<a class="exhibition-menu-entry'+(i===0?' exhibition-menu-current':'')+
     '" href="'+esc(href)+'"'+(ex.slug===slug?' aria-current="page"':'')+'><span>'+
     esc(exhibitionName(ex,lang))+'</span><small>'+year+'</small></a>';
 });
 return '<div class="exhibition-nav-group" aria-label="'+esc(c.archive)+'">'
   +'<p class="exhibition-nav-heading">'+esc(c.archive)+'</p>'
   +'<div class="exhibition-nav-primary"><span class="exhibition-nav-kicker">'+esc(c.latest)+'</span>'+(items[0]||'')+'</div>'
   +'<div class="exhibition-nav-history"><span class="exhibition-nav-kicker">'+esc(c.past)+'</span>'+items.slice(1).join('')+'</div></div>';
}

const pressTitle={en:'Press coverage',hu:'Sajtómegjelenések',de:'Presseberichte'};
const missingDescription={en:'No description was available in the original source.',hu:'Az eredeti forrásban nem található műleírás.',de:'Die Originalquelle enthält keine Werkbeschreibung.'};
function pressMarkup(ex,lang){
 const items=publishedExhibitions.find(x=>x.slug===ex.slug)?.pressCoverage?.items||[];
 if(!items.length)return '';
 return '<section class="ex-press-section" id="press" aria-labelledby="press-title"><div class="ex-press-inner"><h2 class="display-2" id="press-title">'+esc(pressTitle[lang])+'</h2><div class="ex-press-list">'+
   items.map(item=>'<article class="ex-press-item" data-coverage-type="'+esc(item.type)+'"><div class="ex-press-meta">'+esc(item.publication)+' <time datetime="'+esc(item.date)+'">'+esc(item.date)+'</time></div><h3><a href="'+esc(item.url)+'" lang="'+esc(item.language)+'" rel="noopener noreferrer">'+esc(item.title)+'</a></h3><p>'+esc(item.description[lang])+'</p></article>').join('')+
   '</div></div></section>';
}

function sourceWork(w) {
 const item=CMS.get(w.wixRecordId);
 if(!item) return '';
 if(w.sourceImageSlot==='artwork-1')return item.firstArtworkDescription||'';
 if(w.sourceImageSlot==='artwork-2')return item.secondArtworkDescription||'';
 return '';
}
function artistBiography(name,show){
 const person=wix.records.find(r=>r.exhibitionId===show && norm(r.artistName)===norm(name))
   ||wix.records.find(r=>norm(r.artistName)===norm(name));
 return person?.biography||'';
}
function workMarkup(w,lang,extra){
 const c=copy[lang],title=w.title?.[lang]||w.title?.hu||c.untitled;
 const source=sourceWork(w);
 const creator=w.creatorStatus==='identified'?w.creator:c.unknown;
 const src=img(w.imageSourceUrl);
 const cap=esc(creator)+' · '+esc(title);
 return (extra?'<section class="exhibitor-additional-work" id="'+esc(w.id)+'">':'<div class="ex25-primary-work" id="'+esc(w.id)+'">')
   +'<p class="kicker">'+esc(extra?c.works:c.artworks)+'</p>'
   +'<h4 class="exhibitor-extra-title">'+esc(title)+'</h4>'
   +(source?'<div class="prose ex25-source-text" lang="hu">'+htmlText(source)+'</div>':'<p class="ex25-unverified">'+esc(missingDescription[lang])+'</p>')
   +'<figure class="exhibitor-work-image"><img src="'+esc(src)+'" alt="'+cap+'" width="'+(w.sourceWidth||1600)+'" height="'+(w.sourceHeight||1600)+'" loading="lazy" decoding="async">'
   +'<figcaption class="artwork-copyright">© '+esc(creator)+'. '+esc(c.review)+'.</figcaption></figure>'
   +(extra?'</section>':'</div>');
}
function artistCard(p,works,i,lang,show){
 const c=copy[lang],bio=artistBiography(p.name,show);
 const images=works.map((w,n)=>workMarkup(w,lang,n>0)).join('');
 return '<article class="exhibitor-card" id="artist-'+esc(p.id)+'">'
   +'<figure class="exhibitor-portrait"><img src="'+esc(img(p.portraitSourceUrl))+'" alt="'+esc(p.name)+'" width="700" height="900" loading="lazy" decoding="async"></figure>'
   +'<div class="exhibitor-content"><p class="kicker">'+esc(c.artists)+' · '+String(i+1).padStart(2,'0')+'</p>'
   +'<h3>'+esc(p.name)+'</h3>'+images
   +(bio?'<h4>'+esc(c.artist)+'</h4><div class="prose ex25-source-text" lang="hu">'+htmlText(bio)+'</div>':'')
   +'<p class="artist-contact"><span>'+esc(c.source)+'</span><a href="'+esc(p.legacyProfileUrl)+'" target="_blank" rel="noopener noreferrer">'+esc(p.name)+'</a></p>'
   +'</div></article>';
}
function page(ex,lang){
 const c=copy[lang],t=editorial.exhibitions[ex.slug][lang];
 const first=ex.works[0],hero=img(first.imageSourceUrl);
 const pageTitle=showName(ex.slug,lang);
 const description=t.intro.join(' ').slice(0,180);
 const dateText=ex.slug==='eletem-kepe'?'07—13.12.2025':'30.11—06.12.2025';
 const opening=ex.slug==='eletem-kepe'?'2025-12-07':'2025-11-30';
 const languageLinks=locales.map(l=>'<a lang="'+(l==='de'?'de-AT':l)+'" href="../../'+l+'/'+ex.slug+'/index.html"'+(l===lang?' aria-current="page"':'')+'>'+l.toUpperCase()+'</a>').join('');
 const artistList=ex.artistProfiles.map(p=>'<li><a href="#artist-'+esc(p.id)+'">'+esc(p.name)+'</a></li>').join('');
 const artistIds=new Set(ex.artistProfiles.map(p=>p.id));
 if(ex.works.some(w=>!artistIds.has(w.galleryEvidence?.artistProfileId)))throw Error('Missing verified artist profile: '+ex.slug);
 const roster=ex.artistProfiles.map((p,i)=>{
   const matches=ex.works.filter(w=>w.galleryEvidence.artistProfileId===p.id)
     .sort((a,b)=>a.galleryEvidence.galleryPosition-b.galleryEvidence.galleryPosition);
   return artistCard(p,matches,i,lang,ex.wixExhibitionId);
 }).join('');
 const introBlocks=lang==='hu'?t.sourceOriginalIntro:t.intro;
 const introduction=introBlocks.map(p=>'<p>'+esc(p)+'</p>').join('');
 const twoShows=navigationExhibitions.filter(x=>x.slug!==ex.slug).map((item,i)=>{
   const year=exhibitionDate(item)?.slice(0,4)||String(item.year||'');
   const link=exhibitionHref(item,lang);
   return '<article class="history-item"><div class="history-no">'+String(i+1).padStart(2,'0')+' / '+year+'</div>'
     +'<div><h3>'+esc(exhibitionName(item,lang))+'</h3></div><div class="history-copy"><a href="'+esc(link)+'">'+
       esc(exhibitionName(item,lang))+' →</a></div></article>';
 }).join('');
 const sectionNav=[['story',c.story],['exhibitors',c.artists],['team',c.team],['press',pressTitle[lang]],['history',c.past],['visit',c.visit]];
 return '<!doctype html><html lang="'+(lang==='de'?'de-AT':lang)+'"><head>'
 +'<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">'
 +'<meta name="robots" content="noindex,nofollow,noimageindex"><meta name="vipach:stage" content="PREPUBLICATION-REVIEW-NOT-LICENSED">'
 +'<meta name="description" content="'+esc(description)+'"><meta name="theme-color" content="#f2f2ef">'
 +'<title>'+esc(pageTitle)+' — VIPACH Exhibition preview</title>'
 +'<link rel="stylesheet" href="../../assets/styles.css"><link rel="stylesheet" href="../../assets/2025-exhibitions.css">'
 +'</head><body class="ex25-body"><a class="skip-link" href="#content">'+esc(c.skip)+'</a>'
 +'<header class="site-header"><a class="brand" href="https://www.vipach.at/" aria-label="VIPACH"><span><strong>VIPACH</strong> / Exhibition</span></a>'
 +'<div class="header-tools"><nav class="lang-nav" aria-label="Language">'+languageLinks+'</nav>'
 +'<button class="menu-toggle" type="button" aria-expanded="false" aria-controls="site-menu" aria-label="'+esc(c.archive)+'"><span></span><span></span></button></div>'
 +'<nav id="site-menu" class="site-menu" aria-label="'+esc(c.archive)+'">'
 +sectionNav.map(([id,label])=>'<a href="#'+id+'">'+esc(label)+'</a>').join('')
 +menuHtml(lang,ex.slug)+'</nav></header>'
 +'<main id="content">'
 +'<section class="hero ex25-exhibition-hero" aria-labelledby="hero-title">'
 +'<div class="hero-visual"><img src="'+esc(hero)+'" width="1920" height="1920" alt="'+esc(c.works)+' — '+esc(c.review)+'" fetchpriority="high"></div>'
 +'<div class="hero-copy"><p class="eyebrow hero-eyebrow">VIPACH · Vienna Photo Art & Creative Hub</p>'
 +'<h1 id="hero-title">'+esc(pageTitle)+'<span>'+esc(t.eyebrow)+'</span></h1>'
 +'<div class="hero-meta"><div class="hero-date">'+dateText+'</div><div class="hero-details">'
 +'<div><strong>'+esc(c.dates)+'</strong><span>'+esc(t.date)+'</span></div>'
 +'<div><strong>'+esc(c.venue)+'</strong><span>CITYgalleryVIENNA by publicartists</span></div>'
 +'<div><strong>'+esc(c.works)+'</strong><span>'+esc(c.review)+'</span></div>'
 +'</div></div></div></section>'
 +'<div class="ex25-prepublication" role="note"><strong>'+esc(c.review)+'</strong><p>'+esc(t.pending)+'</p></div>'
 +'<section class="section"><div class="section-inner section-index reveal"><div class="section-no">01 / '+esc(c.story)+'</div><p class="statement">'+esc(c.statement)+'</p></div></section>'
 +'<section class="section" id="story"><div class="section-inner editorial-grid"><div class="reveal"><p class="kicker">'+esc(t.eyebrow)+'</p>'
 +'<h2 class="display-2">'+esc(pageTitle)+'</h2></div><div class="prose reveal">'+introduction+'</div></div></section>'
 +'<section class="section dark ex25-theme"><div class="section-inner editorial-grid"><div class="reveal"><p class="kicker">VIPACH · 2025</p><h2 class="display-2">'+esc(c.statement)+'</h2></div>'
 +'<div class="prose reveal"><p>'+esc(t.intro[t.intro.length-1])+'</p></div></div></section>'
 +'<section class="section exhibitor-section" id="exhibitors" aria-labelledby="exhibitors-title"><div class="section-inner">'
 +'<p class="kicker">'+esc(c.artists)+' · '+ex.artistProfiles.length+' / '+ex.artistProfiles.length+'</p>'
 +'<h2 class="display-2" id="exhibitors-title">'+esc(c.artists)+'</h2>'
 +'<nav class="exhibitor-jump" aria-label="'+esc(c.exhibitorJump)+'"><details class="exhibitor-jump-details"><summary>'+esc(c.exhibitorJump)+' <span aria-hidden="true">⌄</span></summary><ul>'+artistList+'</ul></details></nav>'
 +roster+'</div></section>'
 +'<section class="credits" id="team"><div class="credits-inner"><div class="credits-head reveal"><div><p class="kicker">'+esc(c.team)+'</p><h2 class="display-2">'+esc(c.team)+'</h2></div>'
 +'<div class="prose"><p class="lead">'+esc(t.intro[0])+'</p></div></div>'
 +'<div class="credit-list reveal"><div class="credit-row"><div class="credit-role">'+esc(c.credit)+'</div><div class="credit-name">Balogh Dávid</div><div class="credit-title">'+esc(lang==='de'?'Kunsthistoriker und Museologe':lang==='hu'?'művészettörténész és muzeológus':'Art historian and museologist')+'</div></div>'
 +'<div class="credit-row"><div class="credit-role">'+esc(c.org)+'</div><div class="credit-name">Bánhalmi Norbert</div><div class="credit-title">BMI Fotoklub Wien</div></div>'
 +'<div class="credit-row"><div class="credit-role">'+esc(t.printPartnerLabel)+'</div><div class="credit-name">'+esc(t.printPartner)+'</div><div class="credit-title">'+esc(t.partnerRightsNote)+'</div></div>'
 +'<div class="credit-row"><div class="credit-role">'+esc(t.professionalPartnerLabel)+'</div><div class="credit-name">'+esc(t.professionalPartner)+'</div><div class="credit-title">'+esc(t.partnerRightsNote)+'</div></div></div></div></section>'
 +pressMarkup(ex,lang)
 +'<section class="history" id="history" aria-labelledby="history-title"><div class="history-inner"><div class="history-head reveal"><div><p class="kicker">VIPACH Exhibition</p>'
 +'<h2 id="history-title" class="display-2">'+esc(c.past)+'</h2></div><div class="prose"><p class="lead">'+esc(c.statement)+'</p></div></div>'
 +'<div class="history-list reveal">'+twoShows+'</div></div></section>'
 +'<section class="final-statement reveal"><p>'+esc(c.statement)+'</p></section>'
 +'<section class="visit" id="visit"><div class="visit-grid"><div class="reveal"><p class="kicker">'+esc(c.visit)+'</p><h2>'+esc(c.visit)+'</h2>'
 +'<p class="event-note">'+esc(t.register)+'</p></div><div class="reveal"><dl class="visit-card">'
 +'<div class="visit-line"><dt>'+esc(c.dates)+'</dt><dd>'+esc(t.date)+'</dd></div>'
 +'<div class="visit-line"><dt>'+esc(c.venue)+'</dt><dd>CITYgalleryVIENNA by publicartists</dd></div>'
 +'<div class="visit-line"><dt>'+esc(c.opening)+'</dt><dd>'+opening+'</dd></div>'
 +'</dl><div class="actions"><a class="button primary" href="'+esc(ex.sourceUrl)+'" rel="noopener noreferrer" target="_blank">'+esc(c.source)+'</a>'
 +'<a class="button" href="mailto:office@vipach.at">office@vipach.at</a></div></div></div></section>'
 +'<section class="section image-rights" id="image-rights" aria-labelledby="image-rights-title"><div class="section-inner">'
 +'<h2 id="image-rights-title">'+esc(c.rights)+'</h2><p>'+esc(t.pending)+'</p><p>'+esc(c.review)+'</p></div></section>'
 +'</main><footer class="site-footer"><div class="footer-inner"><div><div class="footer-brand">VIPACH</div><div class="eyebrow">Vienna Photo Art &amp; Creative Hub</div></div>'
 +'<div class="footer-meta">'+esc(pageTitle)+' · 2025 · <a href="mailto:office@vipach.at">office@vipach.at</a> · '
 +'<a href="https://www.vipach.at/kapcsolat/impresszum" rel="noopener noreferrer">Impressum</a></div></div></footer>'
 +'<script src="../../assets/site.js" defer></script></body></html>\n';
}
if(inventory.exhibitions.length!==2 || inventory.exhibitions.some(x=>x.works.length!==20))throw Error('Expected exactly two x20 shows');
if(inventory.readiness.productionReleaseApproved!==false)throw Error('Publishing lock not engaged');
for(const ex of inventory.exhibitions)for(const lang of locales){
 const target=path.join(OUT,lang,ex.slug,'index.html');
 fs.mkdirSync(path.dirname(target),{recursive:true});
 fs.writeFileSync(target,page(ex,lang));
}
fs.mkdirSync(path.join(OUT,'assets'),{recursive:true});
for(const asset of ['styles.css','site.js','2025-exhibitions.css'])fs.copyFileSync(path.join(ROOT,'assets',asset),path.join(OUT,'assets',asset));
const artifact={state:'REVIEW-ONLY-NOT-PUBLISHED',designContract:'shared SPONTAN markup classes / assets/styles.css',sourceCommit:inventory.sourceCommit,exhibitions:inventory.exhibitions.map(x=>({slug:x.slug,artists:x.artistProfiles.length,works:x.works.length,portraits:x.artistProfiles.filter(a=>!!a.portraitSourceUrl).length,unidentified:x.unresolvedWorkCount})),wixCmsRecords:wix.records.length,wixFullBiographies:wix.records.filter(x=>x.biography).length,wixArtworkDescriptions:wix.records.filter(x=>x.firstArtworkDescription).length,languagePages:6,imageRightsVerified:0,productionReleaseApproved:false};
fs.writeFileSync(path.join(OUT,'staging-receipt.json'),JSON.stringify(artifact,null,2)+'\n');
console.log(JSON.stringify(artifact,null,2));