import fs from 'node:fs';
import path from 'node:path';
const c={
 en:['Message Norbert on WhatsApp','Back to the exhibitions'],
 de:['Norbert per WhatsApp schreiben','Zurück zu den Ausstellungen'],
 hu:['Írj Norbertnek WhatsAppon','Vissza a kiállításokhoz']
};
const isOwn=u=>/^https?:\/\/exhibition\.vipach\.at(?:[/?#]|$)/i.test(u);
const esc=x=>String(x).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const prefix=l=>l==='en'?'':'/'+l;
const lang=l=>l==='de'?'de-AT':l;
const route=l=>prefix(l)+'/events/';
const home=l=>prefix(l)+'/'+(l==='en'?'?lang=en':'');
function decorate(s,locale,text){
 if(!s.includes('href="/assets/public-links.css"'))s=s.replace('</head>','<link rel="stylesheet" href="/assets/public-links.css"></head>');
 s=s.replace(/(<a\b[^>]*?\bhref=["'](https?:\/\/[^"']+)["'][^>]*>)([\s\S]*?)<\/a>/gi,(raw,tag,url,body)=>isOwn(url)?raw:tag+body.replace(/<span\b[^>]*>\s*↗\s*<\/span>|\s*↗/g,'')+'</a>');
 if(!s.includes('class="vipach-wa"'))s=s.replace('</body>','<a class="vipach-wa" href="https://wa.me/4367761655592" rel="noopener noreferrer" aria-label="'+esc(text)+': +43 677 616 55592"><span>'+esc(text)+'</span><strong dir="ltr">+43 677 616 55592</strong></a></body>');
 return s;
}
function calendarPage(config,l){
 const t=config.localized[l],url=config.url+'&hl='+l,base='https://exhibition.vipach.at',canon=base+route(l),title=t.title+' | VIPACH';
 const alts=['en','de','hu'].map(k=>'<link rel="alternate" hreflang="'+lang(k)+'" href="'+base+route(k)+'">').join('')+'<link rel="alternate" hreflang="x-default" href="'+base+route('en')+'">';
 const nav=['en','de','hu'].map(k=>'<a href="'+route(k)+'" hreflang="'+lang(k)+'" lang="'+lang(k)+'"'+(k===l?' aria-current="page"':'')+'>'+k.toUpperCase()+'</a>').join(' · ');
 return '<!doctype html><html lang="'+lang(l)+'"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>'+esc(title)+'</title><meta name="description" content="'+esc(t.lead)+'"><link rel="canonical" href="'+canon+'">'+alts+'<link rel="stylesheet" href="/assets/styles.css"><script defer src="/assets/calendar.js"></script></head><body class="calendar-page"><main class="calendar-wrap"><header><p>VIPACH</p><nav aria-label="'+({en:'Language',de:'Sprache',hu:'Nyelv'}[l])+'">'+nav+'</nav><h1>'+esc(t.title)+'</h1><p>'+esc(t.lead)+'</p></header><section class="vip-calendar-shell" data-vip-calendar="'+esc(url)+'" data-title="'+esc(t.frame)+'" data-show="'+esc(t.show)+'" data-hide="'+esc(t.hide)+'"><p>'+esc(t.privacy)+'</p><button type="button" data-calendar-toggle aria-expanded="false" aria-controls="vip-calendar-panel" hidden>'+esc(t.show)+'</button> <a href="'+esc(url)+'" rel="noopener noreferrer">'+esc(t.open)+'</a><div id="vip-calendar-panel"></div><p>'+esc(t.note)+'</p><p><a href="mailto:'+esc(config.email)+'">'+esc(t.email)+'</a></p></section><footer class="site-footer"><a href="'+home(l)+'">'+esc(c[l][1])+'</a></footer></main></body></html>\n';
}
export function updateExhibitionPublicLinks(root,exhibitions){
 const config=JSON.parse(fs.readFileSync(path.join(root,'data/staging/events-calendar.json'),'utf8'));
 for(const l of ['en','de','hu']){
  const folder=path.join(root,prefix(l)),t=config.localized[l];
  const files=['index.html','privacy/index.html',...exhibitions.map(x=>x.slug+'/index.html')];
  for(const f of files){
   const p=path.join(folder,f);
   let s=fs.readFileSync(p,'utf8');
   if(f!=='privacy/index.html'&&!s.includes('class="calendar-menu-link"')){
    s=s.replace(/(<nav\b[^>]*\bid="site-menu"[^>]*>)([\s\S]*?)(<\/nav>)/i,(_m,a,b,z)=>a+b+'<a class="calendar-menu-link" href="'+route(l)+'">'+esc(t.nav)+'</a>'+z);
   }
   const output=decorate(s,l,c[l][0]);if(output!==s||output!==fs.readFileSync(p,'utf8'))fs.writeFileSync(p,output);
  }
  const out=path.join(folder,'events','index.html');fs.mkdirSync(path.dirname(out),{recursive:true});fs.writeFileSync(out,decorate(calendarPage(config,l),l,c[l][0]));
 }
}
