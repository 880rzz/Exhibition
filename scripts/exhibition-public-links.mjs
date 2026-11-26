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
const linkStyles='/assets/public-links.css?v=20261126-audit';
const waIcon='<svg viewBox="0 0 24 24" width="25" height="25" aria-hidden="true" focusable="false"><path fill="currentColor" d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.149-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.009-.371-.011-.57-.011-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.214 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.693.626.712.226 1.36.194 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347M12.05 21.785h-.004a9.87 9.87 0 0 1-5.031-1.377l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.513-5.267c.003-5.45 4.438-9.885 9.891-9.885a9.82 9.82 0 0 1 6.992 2.9 9.83 9.83 0 0 1 2.893 6.998c-.003 5.45-4.438 9.885-9.889 9.885m8.413-18.297A11.82 11.82 0 0 0 12.05 0C5.495 0 .16 5.334.157 11.89c0 2.096.547 4.142 1.588 5.946L.057 24l6.305-1.654a11.9 11.9 0 0 0 5.684 1.447h.005c6.554 0 11.89-5.334 11.893-11.89a11.82 11.82 0 0 0-3.481-8.415Z"></path></svg>';
function decorate(s,locale,text){
 if(!s.includes('href="'+linkStyles+'"')){
  s=s.replace(/<link rel="stylesheet" href="\/assets\/public-links\.css(?:\?[^"]*)?">/g,'');
  s=s.replace('</head>','<link rel="stylesheet" href="'+linkStyles+'"></head>');
 }
 s=s.replace(/(<a\b[^>]*?\bhref=["'](https?:\/\/[^"']+)["'][^>]*>)([\s\S]*?)<\/a>/gi,(raw,tag,url,body)=>isOwn(url)?raw:tag+body.replace(/<span\b[^>]*>\s*↗\s*<\/span>|\s*↗/g,'')+'</a>');
 s=s.replace(/<a class="vipach-wa"[^>]*>[\s\S]*?<\/a>/g,'');
 s=s.replace('</body>','<a class="vipach-wa" href="https://wa.me/4367761655592" rel="noopener noreferrer" aria-label="'+esc(text)+'">'+waIcon+'</a></body>');
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
