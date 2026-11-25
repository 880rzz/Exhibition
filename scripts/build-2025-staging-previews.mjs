#!/usr/bin/env node
/**
 * Életem képe & As I Like It Austria — exact SPONTÁN visual component structure.
 * SOURCE-ONLY: writes review HTML to staging-preview/; production builder untouched.
 * Images are original Wix media references, mirrored privately under VIPACH.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { venueEvidenceMarkup, venueSources } from './exhibition-venue-evidence.mjs';
import { newestFeatured, menuExhibitions, exhibitionDate } from './exhibition-chronology.mjs';
import { renderExhibitionNavigation } from './exhibition-navigation.mjs';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
import { archive2025Release } from './exhibition-2025-release-scope.mjs';
import { exhibitionMeta, archiveGraph } from './exhibition-seo.mjs';
const release=process.argv.includes('--render-reviewed-archive');
const candidate = release||process.argv.includes('--archive-candidate');
const archiveScope=candidate?archive2025Release():null;
if(candidate&&!archiveScope)throw Error('No scope-bound organizer archive approval');
// This path is ignored by git and explicitly excluded by Pages/Jekyll.
const OUT=release?ROOT:path.join(ROOT,candidate?'private-review/exhibition-candidate':'staging-preview');
const SITE='https://exhibition.vipach.at';
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
const locales=['en','de','hu'];
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
 if(candidate)return route(exhibition.slug,lang);
 if(previewSlugs.has(exhibition.slug))return '../../'+lang+'/'+exhibition.slug+'/index.html';
 return 'https://exhibition.vipach.at/'+(lang==='en'?'':lang+'/')+
   (exhibition.slug===currentlyFeatured.slug?'':exhibition.slug+'/');
}
function exhibitionName(exhibition,lang){
 return exhibition.titles?.[lang]||showName(exhibition.slug,lang);
}
function menuHtml(lang,slug){
 return renderExhibitionNavigation(navigationExhibitions,lang,slug,ex=>exhibitionHref(ex,lang),
   {historicalSections:true,preview:!candidate});
}

const releaseRights={
 en:'The rights holders gave the organiser permission to exhibit their works. This does not grant visitors permission to republish or otherwise reuse the works. The images are shown here in the VIPACH exhibition archive with permission. This does not give visitors permission to download, republish or otherwise reuse them. Contact the rights holder for separate permission.',
 hu:'A jogtulajdonosok engedélyt adtak a szervezőnek a művek kiállítási bemutatására. Ez nem ad a látogatóknak újraközlési vagy más újrafelhasználási engedélyt. A képek engedéllyel szerepelnek a VIPACH kiállítási archívumában. Ez nem jogosítja fel a látogatót a letöltésre, újraközlésre vagy más felhasználásra. Ehhez a jogtulajdonos külön engedélye szükséges.',
 de:'Die Rechteinhaber haben dem Veranstalter erlaubt, ihre Werke auszustellen. Daraus ergibt sich für Besucherinnen und Besucher keine Erlaubnis zur Weiterveröffentlichung oder anderen Nutzung. Die Bilder werden hier mit Erlaubnis im VIPACH-Ausstellungsarchiv gezeigt. Daraus ergibt sich keine Erlaubnis zum Herunterladen, zur Weiterveröffentlichung oder zu einer anderweitigen Nutzung. Dafür ist eine separate Zustimmung der Rechteinhaber erforderlich.'
};
const posterAlt={
 en:'Original VIPACH exhibition cover: ',hu:'Eredeti VIPACH kiállítási borító: ',de:'Originales VIPACH-Ausstellungsmotiv: '
};
const exhibitionSummary={
 'eletem-kepe':{
 en:'Fifteen photographers, twenty works. The exhibition was held at CITYgalleryVIENNA, Mahlerstraße 11, 1010 Vienna, from 7 to 13 December 2025.',
 hu:'Tizenöt alkotó, húsz mű. A kiállítás 2025. december 7–13. között volt látható a CITYgalleryVIENNA galériában (Mahlerstraße 11, 1010 Bécs).',
 de:'Fünfzehn Kunstschaffende, zwanzig Werke. Die Ausstellung war vom 7. bis 13. Dezember 2025 in der CITYgalleryVIENNA, Mahlerstraße 11, 1010 Wien, zu sehen.'
 },
 'as-i-like-it-austria':{
 en:'Twenty photographs were shown from 30 November to 6 December 2025 at CITYgalleryVIENNA, Mahlerstraße 11, 1010 Vienna. The original VIPACH gallery credits 19 photographers; contemporary coverage reported 18.',
 hu:'Húsz fénykép szerepelt a kiállításon 2025. november 30. és december 6. között a CITYgalleryVIENNA galériában (Mahlerstraße 11, 1010 Bécs). A VIPACH eredeti galériája 19 alkotót tüntet fel, egy korabeli beszámoló 18-at.',
 de:'Zwanzig Fotografien waren vom 30. November bis 6. Dezember 2025 in der CITYgalleryVIENNA, Mahlerstraße 11, 1010 Wien, zu sehen. Die ursprüngliche VIPACH-Galerie nennt 19 Kunstschaffende; die zeitgenössische Berichterstattung nannte 18.'
 }
};
const pressTitle={en:'Press coverage',hu:'Sajtómegjelenések',de:'Presseberichte'};
const predecessorCopy={
 en:{heading:'Previous exhibition',source:'Original VIPACH exhibition page',official:'Historical exhibition',imageFrom:'Photography by',open:'Explore the exhibition',historical:'This 2025 exhibition has ended.',number:'Exhibited photograph',review:'Prepublication review only. This archive has not been released.'},
 hu:{heading:'Előző kiállítás',source:'A VIPACH eredeti kiállítási oldala',official:'Történeti kiállítás',imageFrom:'Fotó',open:'A kiállítás megtekintése',historical:'A 2025-ös kiállítás bezárt.',number:'Kiállított fotó',review:'Megjelenés előtti ellenőrzés. Ez az archívum még nem jelent meg.'},
 de:{heading:'Vorherige Ausstellung',source:'Ursprüngliche VIPACH-Ausstellungsseite',official:'Historische Ausstellung',imageFrom:'Fotografie von',open:'Ausstellung ansehen',historical:'Diese Ausstellung von 2025 ist beendet.',number:'Ausgestellte Fotografie',review:'Interne Prüfung vor Veröffentlichung. Dieses Archiv wurde noch nicht veröffentlicht.'}
};
const missingDescription={en:'No description was available in the original source.',hu:'Az eredeti forrásban nem található műleírás.',de:'Die Originalquelle enthält keine Werkbeschreibung.'};
function pressMarkup(ex,lang){
 const items=publishedExhibitions.find(x=>x.slug===ex.slug)?.pressCoverage?.items||[];
 if(!items.length)return '';
 return '<section class="ex-press-section" id="press" aria-labelledby="ex-press-title"><div class="ex-press-inner"><h2 class="display-2" id="ex-press-title">'+esc(pressTitle[lang])+'</h2><div class="ex-press-list">'+
   items.map(item=>'<article class="ex-press-item"><div class="ex-press-meta">'+esc(item.publication)+' '+(item.date?'<time datetime="'+esc(item.date)+'">'+esc(item.date)+'</time>':'<span>'+esc(item.issue)+'</span>')+'</div><h3><a href="'+esc(item.url)+'" lang="'+esc(item.language)+'" rel="noopener noreferrer">'+esc(item.title)+'</a></h3><p>'+esc(item.description[lang])+'</p></article>').join('')+
   '</div></div></section>';
}

function sourceWork(w) {
 const derivative=editorial.workDescriptionCrosswalk?.[w.id];
 if(derivative){
   if(w.galleryEvidence.imageFileId!==derivative.galleryImageFileId||w.galleryEvidence.artistProfileId!==derivative.artistProfileId)throw Error('Description crosswalk does not match gallery: '+w.id);
   const source=CMS.get(derivative.sourceRecordId);
   if(!source?.secondArtworkMedia?.includes('/'+derivative.sourceImageFileId+'/')||norm(source.artistName)!==norm(w.creator)||!source[derivative.field])throw Error('Description crosswalk does not match Wix CMS: '+w.id);
   // This is editorial attribution, not an image or rights transfer between shows.
   return source[derivative.field].replace(/^A kép ára:[^\n]*(?:\n+|$)/u,'');
 }
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
const translationFile=path.join(ROOT,'data/staging/2025-archive-translations.json');
const translationData=fs.existsSync(translationFile)?JSON.parse(fs.readFileSync(translationFile,'utf8')):null;
if(translationData&&translationData.publicationStatus!=='editorially-approved')throw Error('Archive translations require editorial approval');
const translations=translationData?.exhibitions||{};
const editorialLabels={
 en:{original:'Original Hungarian text',missing:'Available in the original Hungarian. A reviewed translation is not yet published.',translated:'Editorial translation from Hungarian.',past:'Any amount in the original below is an archival 2025 price, not a current offer.',limited:'The historical text has been edited here to omit third-party personal data.',claims:'The source is the artist’s own account; personal or promotional claims are not independently verified.'},
 hu:{original:'Eredeti magyar szöveg',missing:'Az eredeti magyar szöveg olvasható.',translated:'Szerkesztői fordítás magyarból.',past:'Az eredeti szövegben megadott összeg 2025-ös archív ár, nem aktuális ajánlat.',limited:'A történeti szöveg itt harmadik személy személyes adatai nélkül olvasható.',claims:'Az alkotó saját bemutatkozása; személyes vagy promóciós állításait az archívum nem igazolja függetlenül.'},
 de:{original:'Ungarischer Originaltext',missing:'Der ungarische Originaltext ist verfügbar. Eine geprüfte Übersetzung ist noch nicht veröffentlicht.',translated:'Redaktionelle Übersetzung aus dem Ungarischen.',past:'Beträge im Original sind historische Preisangaben von 2025, kein aktuelles Angebot.',limited:'Der historische Text wird hier ohne personenbezogene Angaben Dritter gezeigt.',claims:'Der Text ist die Selbstdarstellung der Künstlerin bzw. des Künstlers; persönliche oder werbliche Aussagen wurden nicht unabhängig bestätigt.'}
};
function sourceMarkup(raw,locale,show,kind,id){
 if(!raw)return '';
 const original=t=>'<div class="prose ex25-source-text" lang="hu">'+htmlText(t)+'</div>';
 if(!release)return original(raw);
 const l=editorialLabels[locale];
 const lang=locale==='de'?'de-AT':locale;
 const sensitive=id==='eletemkepe-c90ec4d760c2';
 const displayRaw=sensitive?raw.replace(/^A kép ára:[^\n]*(?:\n+|$)/u,'A kép 2025-ös ára: 400 €. A bevétel jótékony célra szolgált.\n\n'):raw;
 const price=kind==='works'&&/(?:kép ára|ár\s*:|\d\s*(?:€|euró|eur\b))/iu.test(raw);
 const note=(t)=>'<p class="ex25-translation-note">'+esc(t)+'</p>';
 const notices=(price?note(l.past):'')+(sensitive?note(l.limited):'')+(kind==='artists'&&/Google|#1/u.test(raw)?note(l.claims):'');
 if(locale==='hu')return notices+original(displayRaw);
 const translation=translations?.[show]?.[kind]?.[id]?.[locale];
 const toggle='<details class="ex25-original-text"><summary>'+esc(l.original)+'</summary>'+original(displayRaw)+'</details>';
 return notices+(translation?note(l.translated)+'<div class="prose ex25-translated-text" lang="'+lang+'">'+htmlText(translation)+'</div>':note(l.missing))+toggle;
}
function workName(w,lang){
 const local=predecessorCopy[lang],c=copy[lang],note=editorial.workDescriptionCrosswalk?.[w.id];
 return w.title?.[lang]||w.title?.hu||note?.verifiedSourceTitle||(candidate?local.number+' '+String(w.galleryEvidence.galleryPosition).padStart(2,'0'):c.untitled);
}
function workMarkup(w,lang,extra,show){
 const c=copy[lang], local=predecessorCopy[lang];
 const noted=editorial.workDescriptionCrosswalk?.[w.id];
 const attribution={
  'same-underlying-exposure-cross-exhibition-alternate-treatment':{en:'The artist’s note from As I Like It Austria describes the same exposure. This exhibition presented a different crop or edit.',hu:'Az alkotó As I Like It Austria-kiállításhoz írt szövege ugyanarról a felvételről szól. Itt eltérő kivágású vagy kidolgozású változat szerepelt.',de:'Der Text der Künstlerin für As I Like It Austria beschreibt dieselbe Aufnahme. Hier war ein anders beschnittenes oder bearbeitetes Bild zu sehen.'},
  'same-show-visually-verified-derivative':{en:'The artist’s original note is from this exhibition’s Wix profile; the gallery shows a derivative of the same image.',hu:'Az alkotó eredeti szövege e kiállítás Wix-profiljából származik. A galériában ugyanennek a képnek egy másik változata szerepel.',de:'Der Originaltext stammt aus dem Wix-Profil der Künstlerin zu dieser Ausstellung. Die Galerie zeigt eine Variante desselben Bildes.'}
 };
 const title=workName(w,lang);
 const source=sourceWork(w);
 const creator=w.creatorStatus==='identified'?w.creator:c.unknown;
 const src=img(w.imageSourceUrl);
 const cap=esc(creator)+' · '+esc(title);
 return (extra?'<section class="exhibitor-additional-work" id="'+esc(w.id)+'">':'<div class="ex25-primary-work" id="'+esc(w.id)+'">')
   +'<p class="kicker">'+esc(extra?c.works:c.artworks)+'</p>'
   +'<h4 class="exhibitor-extra-title">'+esc(title)+'</h4>'
   +(noted?'<p class="ex25-description-provenance" data-description-basis="'+esc(noted.basis)+'">'+esc(attribution[noted.basis][lang])+'</p>':'')
   +(source?sourceMarkup(source,lang,show,'works',w.id):'<p class="ex25-unverified">'+esc(missingDescription[lang])+'</p>')
   +'<figure class="exhibitor-work-image"><img src="'+esc(src)+'" alt="'+cap+'" width="'+(w.sourceWidth||1600)+'" height="'+(w.sourceHeight||1600)+'" referrerpolicy="no-referrer" loading="lazy" decoding="async">'
   +'<figcaption class="artwork-copyright">'+(candidate?esc(local.imageFrom+': '+creator):'© '+esc(creator)+'. '+esc(c.review)+'.')+'</figcaption></figure>'
   +(extra?'</section>':'</div>');
}
function artistCard(p,works,i,lang,show){
 const c=copy[lang],bio=artistBiography(p.name,show);
 const images=works.map((w,n)=>workMarkup(w,lang,n>0,show)).join('');
 return '<article class="exhibitor-card" id="artist-'+esc(p.id)+'">'
   +'<figure class="exhibitor-portrait"><img src="'+esc(img(p.portraitSourceUrl))+'" alt="'+esc(p.name)+'" width="'+esc(p.portraitWidth||700)+'" height="'+esc(p.portraitHeight||900)+'" referrerpolicy="no-referrer" loading="lazy" decoding="async"></figure>'
   +'<div class="exhibitor-content"><p class="kicker">'+esc(c.artists)+' · '+String(i+1).padStart(2,'0')+'</p>'
   +'<h3>'+esc(p.name)+'</h3>'+images
   +(bio?'<h4>'+esc(c.artist)+'</h4>'+sourceMarkup(bio,lang,show,'artists',p.id):'')
   +'<p class="artist-contact"><span>'+esc(c.source)+'</span><a href="'+esc(p.legacyProfileUrl==='https://www.norbertbanhalmi.com/mybest'?({en:'https://www.banhalmi.art/#about',hu:'https://www.banhalmi.art/hu/#about',de:'https://www.banhalmi.art/de-at/#about'}[lang]):p.legacyProfileUrl)+'" target="_blank" rel="noopener noreferrer">'+esc(p.name)+'</a></p>'
   +'</div></article>';
}
function page(ex,lang){
 const c=copy[lang],t=editorial.exhibitions[ex.slug][lang],local=predecessorCopy[lang];
 const current=publishedExhibitions.find(x=>x.slug===ex.slug);
 const locale=l=>l==='de'?'de-AT':l;
 const sourcePage=current.external?.vipachPage?.[lang]||ex.sourceUrl;
 const theme=t.intro[t.intro.length-1];
 const first=ex.works[0],hero=img(first.imageSourceUrl);
 const cover=archiveScope?.heroDisplay?.images?.[ex.slug];
 const pageTitle=showName(ex.slug,lang);
 const dateText=ex.slug==='eletem-kepe'?'07—13.12.2025':'30.11—06.12.2025';
 const openSource=current.dates.opening;
 const openDay=openSource.listedStart?.slice(0,10)||current.dates.publicVisit.start;
 const opening=new Intl.DateTimeFormat(lang==='en'?'en-GB':locale(lang),{dateStyle:'long',timeZone:'Europe/Vienna'}).format(new Date(openDay+'T12:00:00Z'))
   +(openSource.listedStart?' · '+openSource.listedStart.slice(11,16)+(openSource.listedEnd?'–'+openSource.listedEnd.slice(11,16):''):'');
 const venue=current.venue.name+(current.venue.addressSource?' · '+current.venue.streetAddress+', '+current.venue.postalCode+' Wien':'');
 const languageLinks=locales.map(l=>'<a lang="'+(l==='de'?'de-AT':l)+'" href="'+(candidate?route(ex.slug,l):'../../'+l+'/'+ex.slug+'/index.html')+'"'+(l===lang?' aria-current="page"':'')+'>'+l.toUpperCase()+'</a>').join('');
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
 const historyItems=candidate
   ? navigationExhibitions.filter(x=>ex.slug==='eletem-kepe' && x.slug==='as-i-like-it-austria')
   : navigationExhibitions.filter(x=>x.slug!==ex.slug);
 const twoShows=historyItems.map((item,i)=>{
   const year=exhibitionDate(item)?.slice(0,4)||String(item.year||'');
   const link=exhibitionHref(item,lang);
   return '<article class="history-item"><div class="history-no">'+String(i+1).padStart(2,'0')+' / '+year+'</div>'
     +'<div><h3>'+esc(exhibitionName(item,lang))+'</h3></div><div class="history-copy"><a href="'+esc(link)+'"'+(candidate?' rel="prev"':'')+'>'+
       esc(exhibitionName(item,lang))+' →</a></div></article>';
 }).join('');
 const canonical=SITE+route(ex.slug,lang);
 const alternate=locales.map(l=>'<link rel="alternate" hreflang="'+locale(l)+'" href="'+SITE+route(ex.slug,l)+'">').concat(['<link rel="alternate" hreflang="x-default" href="'+SITE+route(ex.slug,'en')+'">']).join('');
 const metadata=exhibitionMeta(ex.slug,lang,canonical);
 const schema=candidate?archiveGraph({ex,current,lang,name:pageTitle,description:metadata.description,sourcePage,
   workName:w=>workName(w,lang),canonical}):null;
 const asset=candidate?'/assets/':'../../assets/';
 const history=twoShows?'<section class="history" id="history" aria-labelledby="history-title"><div class="history-inner"><div class="history-head reveal"><div><p class="kicker">VIPACH Exhibition</p>'
 +'<h2 id="history-title" class="display-2">'+esc(candidate?local.heading:c.past)+'</h2></div><div class="prose"><p class="lead">'+esc(c.statement)+'</p></div></div>'
 +'<div class="history-list reveal">'+twoShows+'</div></div></section>':'';
 const heroVisual=candidate
   ? '<div class="hero-visual ex25-archive-cover"><img src="'+esc(cover.url)+'" width="'+cover.width+'" height="'+cover.height+'" alt="'+esc(posterAlt[lang]+pageTitle)+'" referrerpolicy="no-referrer" fetchpriority="high" decoding="async"></div>'
   : '<div class="hero-visual"><img src="'+esc(hero)+'" width="1920" height="1920" alt="'+esc(c.works)+' — '+esc(c.review)+'" fetchpriority="high"></div>';
 return '<!doctype html><html lang="'+(lang==='de'?'de-AT':lang)+'"><head>'
 +'<meta charset="utf-8"><meta name="referrer" content="no-referrer"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">'
 +(release?'<meta name="robots" content="index,follow">':'<meta name="robots" content="noindex,nofollow,noimageindex"><meta name="vipach:stage" content="PREPUBLICATION-REVIEW-NOT-LICENSED">')
 +'<meta name="description" content="'+esc(metadata.description)+'"><meta name="theme-color" content="#f2f2ef">'
 +'<title>'+esc(metadata.title)+(candidate?'':' — preview')+'</title>'
 +(candidate?'<link rel="canonical" href="'+canonical+'">'+alternate+'<script type="application/ld+json">'+JSON.stringify(schema).replace(/</g,'\\u003c')+'</script>':'')
 +(release?metadata.meta:'')
 +'<link rel="stylesheet" href="'+asset+'styles.css"><link rel="stylesheet" href="'+asset+'2025-exhibitions.css"><link rel="stylesheet" href="'+asset+'exhibition-harmonization.css">'
 +'</head><body class="ex25-body"'+(candidate?' data-exhibition-slug="'+ex.slug+'" data-route-mode="slug"':'')+'><a class="skip-link" href="#content">'+esc(c.skip)+'</a>'
 +'<header class="site-header"><a class="brand" href="'+(candidate?(lang==='en'?'/?lang=en':'/'+lang+'/'):'https://www.vipach.at/')+'" aria-label="VIPACH Exhibition"><img class="brand-logo" src="https://static.wixstatic.com/media/b0aee1_3ddaf3156e154fc0bda2ffe5cb999a5c~mv2.png" width="30" height="30" alt="" referrerpolicy="no-referrer"><span><strong>VIPACH</strong> / '+esc({en:'Exhibition',hu:'Kiállítás',de:'Ausstellung'}[lang])+'</span></a>'
 +'<div class="header-tools"><nav class="lang-nav" aria-label="Language">'+languageLinks+'</nav>'
 +'<button class="menu-toggle" type="button" aria-expanded="false" aria-controls="site-menu" aria-label="'+esc(c.archive)+'"><span></span><span></span></button></div>'
 +'<nav id="site-menu" class="site-menu" aria-label="'+esc(c.archive)+'">'
 +menuHtml(lang,ex.slug)+'</nav></header>'
 +'<main id="content">'
 +'<section class="hero ex25-exhibition-hero" aria-labelledby="hero-title">'
 +heroVisual
 +'<div class="hero-copy"><p class="eyebrow hero-eyebrow">VIPACH · Vienna Photo Art & Creative Hub</p>'
 +'<h1 id="hero-title">'+esc(pageTitle)+'<span>'+esc(t.eyebrow)+'</span></h1>'
 +'<div class="hero-meta"><div class="hero-date">'+dateText+'</div><div class="hero-details">'
 +'<div><strong>'+esc(c.dates)+'</strong><span>'+esc(t.date)+'</span></div>'
 +'<div><strong>'+esc(c.venue)+'</strong><span>'+esc(venue)+'</span></div>'
 +'<div><strong>'+esc(c.works)+'</strong><span>'+esc(candidate?local.official:c.review)+'</span></div>'
 +'</div></div></div></section>'
  +(release?'<section class="section ex25-context" aria-labelledby="ex25-context-title"><div class="section-inner editorial-grid"><div><p class="kicker">VIPACH · 2025</p><h2 class="display-2" id="ex25-context-title">'+esc({en:'At a glance',hu:'A kiállítás röviden',de:'Die Ausstellung auf einen Blick'}[lang])+'</h2></div><div class="prose"><p>'+esc(exhibitionSummary[ex.slug][lang])+'</p><p><a href="'+esc(venueSources[ex.slug].url)+'" rel="noreferrer">'+esc({en:'Original event listing',hu:'Eredeti eseményadatok',de:'Ursprünglicher Veranstaltungseintrag'}[lang])+'</a></p></div></div></section>':'')
 +(release?'':'<div class="ex25-prepublication" role="note"><strong>'+esc(candidate?local.review:c.review)+'</strong><p>'+esc(t.pending)+'</p></div>')
 +'<section class="section"><div class="section-inner section-index reveal"><div class="section-no">01 / '+esc(c.story)+'</div><p class="statement">'+esc(c.statement)+'</p></div></section>'
 +'<section class="section" id="story"><div class="section-inner editorial-grid"><div class="reveal"><p class="kicker">'+esc(t.eyebrow)+'</p>'
 +'<h2 class="display-2">'+esc(pageTitle)+'</h2></div><div class="prose reveal">'+introduction+'</div></div></section>'
 +'<section class="section dark ex25-theme"><div class="section-inner editorial-grid"><div class="reveal"><p class="kicker">VIPACH · 2025</p><h2 class="display-2">'+esc(c.statement)+'</h2></div>'
 +'<div class="prose reveal"><p>'+esc(theme)+'</p></div></div></section>'
 +'<section class="section exhibitor-section" id="exhibitors" aria-labelledby="exhibitors-title"><div class="section-inner">'
 +'<p class="kicker">'+esc(c.artists)+' · '+ex.artistProfiles.length+' / '+ex.artistProfiles.length+'</p>'
 +'<h2 class="display-2" id="exhibitors-title">'+esc(c.artists)+'</h2>'
 +'<nav class="exhibitor-jump" aria-label="'+esc(c.exhibitorJump)+'"><details class="exhibitor-jump-details"><summary>'+esc(c.exhibitorJump)+' <span aria-hidden="true">⌄</span></summary><ul>'+artistList+'</ul></details></nav>'
 +roster+'</div></section>'
 +'<section class="credits" id="team"><div class="credits-inner"><div class="credits-head reveal"><div><p class="kicker">'+esc(c.team)+'</p><h2 class="display-2">'+esc(c.team)+'</h2></div>'
 +'<div class="prose"><p class="lead">'+esc(t.intro[0])+'</p></div></div>'
 +'<div class="credit-list reveal"><div class="credit-row"><div class="credit-role">'+esc(c.credit)+'</div><div class="credit-name">Balogh Dávid</div><div class="credit-title">'+esc(lang==='de'?'Kunsthistoriker und Museologe':lang==='hu'?'művészettörténész és muzeológus':'Art historian and museologist')+'</div></div>'
 +'<div class="credit-row"><div class="credit-role">'+esc(c.org)+'</div><div class="credit-name">Bánhalmi Norbert</div><div class="credit-title">BMI Fotoklub Wien</div></div>'
 +'<div class="credit-row"><div class="credit-role">'+esc(t.printPartnerLabel)+'</div><div class="credit-name">'+esc(t.printPartner)+'</div>'+(release?'':'<div class="credit-title">'+esc(t.partnerRightsNote)+'</div>')+'</div>'
 +'<div class="credit-row"><div class="credit-role">'+esc(t.professionalPartnerLabel)+'</div><div class="credit-name">'+esc(t.professionalPartner)+'</div>'+(release?'':'<div class="credit-title">'+esc(t.partnerRightsNote)+'</div>')+'</div></div></div></section>'
 +history
 +'<section class="final-statement reveal"><p>'+esc(c.statement)+'</p></section>'
 +'<section class="visit" id="visit"><div class="visit-grid"><div class="reveal"><p class="kicker">'+esc(c.visit)+'</p><h2>'+esc(c.visit)+'</h2>'
 +'<p class="event-note">'+esc(candidate?local.historical:t.register)+'</p></div><div class="reveal"><dl class="visit-card">'
 +'<div class="visit-line"><dt>'+esc(c.dates)+'</dt><dd>'+esc(t.date)+'</dd></div>'
 +'<div class="visit-line"><dt>'+esc(c.venue)+'</dt><dd>'+esc(venue)+'</dd></div>'
 +'<div class="visit-line"><dt>'+esc(c.opening)+'</dt><dd><a href="'+esc(openSource.source)+'" rel="noopener noreferrer">'+esc(opening)+'</a></dd></div>'
 +'</dl><div class="actions"><a class="button primary" href="'+esc(candidate?sourcePage:ex.sourceUrl)+'" rel="noopener noreferrer" target="_blank">'+esc(candidate?local.source:c.source)+'</a>'
 +'<a class="button" href="mailto:office@vipach.at">office@vipach.at</a></div></div></div></section>'
 +'<section class="section image-rights" id="image-rights" aria-labelledby="image-rights-title"><div class="section-inner">'
 +'<h2 id="image-rights-title">'+esc(c.rights)+'</h2>'+(release?'<p>'+esc(releaseRights[lang])+'</p>':'<p>'+esc(t.pending)+'</p><p>'+esc(c.review)+'</p>')+'</div></section>'
 +(release?venueEvidenceMarkup(ex.slug,lang):'')
 +pressMarkup(ex,lang)
 +'</main><footer class="site-footer"><div class="footer-inner"><div><div class="footer-brand">VIPACH</div><div class="eyebrow">Vienna Photo Art &amp; Creative Hub</div></div>'
 +'<div class="footer-meta">'+esc(pageTitle)+' · 2025 · <a href="mailto:office@vipach.at">office@vipach.at</a> · '
 +'<a href="'+(lang==='en'?'/privacy/':'/'+lang+'/privacy/')+'">'+esc({en:'Legal notice and privacy',hu:'Impresszum és adatvédelem',de:'Impressum und Datenschutz'}[lang])+'</a></div></div></footer>'
 +'<script src="'+asset+'site.js" defer></script></body></html>\n';
}
if(inventory.exhibitions.length!==2 || inventory.exhibitions.some(x=>x.works.length!==20))throw Error('Expected exactly two x20 shows');
if(inventory.readiness.productionReleaseApproved!==false)throw Error('Publishing lock not engaged');
for(const ex of inventory.exhibitions)for(const lang of locales){
 const target=path.join(OUT,candidate&&lang==='en'?'':lang,ex.slug,'index.html');
 fs.mkdirSync(path.dirname(target),{recursive:true});
 fs.writeFileSync(target,page(ex,lang));
}
if(!release){fs.mkdirSync(path.join(OUT,'assets'),{recursive:true});
for(const asset of ['styles.css','site.js','2025-exhibitions.css','exhibition-harmonization.css'])fs.copyFileSync(path.join(ROOT,'assets',asset),path.join(OUT,'assets',asset));}
if(candidate){
 if(!release){
 // Clone only already-public SPONTÁN routes and dependencies, nothing private.
 fs.cpSync(path.join(ROOT,'gallery'),path.join(OUT,'gallery'),{recursive:true});
 for(const asset of ['om-system-supporter.svg']){
   fs.copyFileSync(path.join(ROOT,'assets',asset),path.join(OUT,'assets',asset));
 }
 }
 for(const lang of locales){
   const prefix=lang==='en'?'':lang;
   for(const suffix of ['','spontan-2026']){
     const rel=path.join(prefix,suffix,'index.html');
     let html=fs.readFileSync(path.join(ROOT,rel),'utf8');
     const re=/<section\b[^>]*\bid="history"[\s\S]*?<\/section>/;
     if(!re.test(html))throw Error('SPONTAN history section absent: '+rel);
     html=html.replace(re,section=>{
       for(const [wixSlug,target] of [['eletemkepe','eletem-kepe'],['asilikeit','as-i-like-it-austria']]){
         const escapedWix=new RegExp('href="https://www\\.vipach\\.at/'+wixSlug+'(?:\\?[^"]*)?"','g');
         const direct='href="'+route(target,lang)+'"';
         const matches=(section.match(escapedWix)||[]).length+(section.split(direct).length-1);
         if(matches!==1)throw Error('Expected exactly one archive history link: '+rel+'/'+wixSlug);
         section=section.replace(escapedWix,direct+(target==='eletem-kepe'?' rel="prev"':''));
         if(target==='eletem-kepe'&&!section.includes(direct+' rel="prev"'))section=section.replace(direct,direct+' rel="prev"');
       }
       return section;
     });
     html=html.replace(/(<a class="brand" href=")https:\/\/www\.vipach\.at\//, (_m,open)=>open+(lang==='en'?'/?lang=en':'/'+lang+'/'));
     // Any accidentally provided URL still tells robots not to index this review.
     if(!release){
     html=html.replace(/<meta\s+name="robots"[^>]*>/i,'<meta name="robots" content="noindex,nofollow,noimageindex">');
     if(!/noindex,nofollow,noimageindex/.test(html))html=html.replace('</head>','<meta name="robots" content="noindex,nofollow,noimageindex"></head>');
     }
     fs.mkdirSync(path.dirname(path.join(OUT,rel)),{recursive:true});
     fs.writeFileSync(path.join(OUT,rel),html);
   }
 }
 if(!release)fs.writeFileSync(path.join(OUT,'robots.txt'),'User-agent: *\nDisallow: /\n');
}
const artifact={state:candidate?'PERMANENT-ROUTE-CANDIDATE-NOT-PUBLISHED':'REVIEW-ONLY-NOT-PUBLISHED',designContract:'shared SPONTAN markup classes / assets/styles.css',sourceCommit:inventory.sourceCommit,exhibitions:inventory.exhibitions.map(x=>({slug:x.slug,artists:x.artistProfiles.length,works:x.works.length,portraits:x.artistProfiles.filter(a=>!!a.portraitSourceUrl).length,unidentified:x.unresolvedWorkCount})),wixCmsRecords:wix.records.length,wixFullBiographies:wix.records.filter(x=>x.biography).length,wixArtworkDescriptions:wix.records.filter(x=>x.firstArtworkDescription).length,languagePages:6,imageRightsVerified:0,productionReleaseApproved:false};
if(!release)fs.writeFileSync(path.join(OUT,'staging-receipt.json'),JSON.stringify(artifact,null,2)+'\n');
console.log(release?'Rendered six approved archive HTML pages and updated six SPONTÁN history links.':JSON.stringify(artifact,null,2));