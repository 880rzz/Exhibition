document.documentElement.classList.add('js');
const items=document.querySelectorAll('.reveal');
if('IntersectionObserver' in window&&!window.matchMedia('(prefers-reduced-motion: reduce)').matches){
 const observer=new IntersectionObserver((entries)=>{entries.forEach((entry)=>{if(entry.isIntersecting){entry.target.classList.add('is-visible');observer.unobserve(entry.target);}});},{threshold:.12,rootMargin:'0px 0px -6% 0px'});
 items.forEach((item)=>observer.observe(item));
}else{items.forEach((item)=>item.classList.add('is-visible'));}
const menuToggle=document.querySelector('.menu-toggle');
const siteMenu=document.querySelector('.site-menu');
if(menuToggle&&siteMenu){
 const closeMenu=()=>{menuToggle.setAttribute('aria-expanded','false');siteMenu.classList.remove('is-open');document.body.classList.remove('menu-open');};
 menuToggle.addEventListener('click',()=>{const open=menuToggle.getAttribute('aria-expanded')==='true';menuToggle.setAttribute('aria-expanded',String(!open));siteMenu.classList.toggle('is-open',!open);document.body.classList.toggle('menu-open',!open);});
 siteMenu.querySelectorAll('a').forEach((link)=>link.addEventListener('click',closeMenu));
 document.addEventListener('keydown',(event)=>{if(event.key==='Escape')closeMenu();});
}


/* EVENT-MOTION-CONTACT-MAP-V1 */
const motionNodes=[...document.querySelectorAll('h1,h2,.statement,.prose .lead,.hero-details,.history-copy,.event-note')];
motionNodes.forEach((node)=>{
  if(node.classList.contains('motion-target')) return;
  node.classList.add('motion-target');
  node.dataset.motion=/^H[12]$/.test(node.tagName)?'heading':'description';
});
if(!window.matchMedia('(prefers-reduced-motion: reduce)').matches&&'IntersectionObserver' in window){
  const motionObserver=new IntersectionObserver((entries)=>{
    entries.forEach((entry)=>{
      if(entry.isIntersecting){
        entry.target.classList.add('motion-visible');
        motionObserver.unobserve(entry.target);
      }
    });
  },{threshold:.12,rootMargin:'0px 0px -4% 0px'});
  motionNodes.forEach((node)=>motionObserver.observe(node));
}else{
  motionNodes.forEach((node)=>node.classList.add('motion-visible'));
}

const mapButton=document.querySelector('[data-map-load]');
if(mapButton){
  mapButton.addEventListener('click',()=>{
    const frame=document.querySelector('.map-frame');
    if(!frame||frame.querySelector('iframe')) return;
    const iframe=document.createElement('iframe');
    iframe.src=mapButton.dataset.mapSrc;
    iframe.loading='lazy';
    iframe.referrerPolicy='no-referrer-when-downgrade';
    iframe.title=mapButton.dataset.mapTitle||'Google Maps';
    iframe.allowFullscreen=true;
    frame.replaceChildren(iframe);
  });
}

(function(){
  if(document.querySelector('.vipach-contact-dock')) return;
  const lang=(document.documentElement.lang||'en').toLowerCase();
  const locale=lang.startsWith('hu')?'hu':lang.startsWith('de')?'de':'en';
  const copy={
    hu:{contact:'Kapcsolat',close:'Kapcsolati panel bezárása',email:'E-mail',whatsapp:'WhatsApp',map:'Helyszín',mapHint:'Google Térkép',wa:'Kedves VIPACH, a SPONTÁN kiállítással kapcsolatban keresem Önöket.'},
    en:{contact:'Contact',close:'Close contact panel',email:'Email',whatsapp:'WhatsApp',map:'Venue',mapHint:'Google Maps',wa:'Hello VIPACH, I am contacting you regarding the SPONTANEOUS exhibition.'},
    de:{contact:'Kontakt',close:'Kontaktfenster schließen',email:'E-Mail',whatsapp:'WhatsApp',map:'Ort',mapHint:'Google Maps',wa:'Hallo VIPACH, ich kontaktiere Sie wegen der Ausstellung SPONTAN.'}
  }[locale];
  const dock=document.createElement('div');
  dock.className='vipach-contact-dock';
  dock.innerHTML='<div class="vipach-contact-panel" id="vipach-contact-panel" hidden role="dialog" aria-modal="false" aria-labelledby="vipach-contact-title">'+
    '<div class="vipach-contact-head"><strong id="vipach-contact-title">'+copy.contact+'</strong><button class="vipach-contact-close" type="button" aria-label="'+copy.close+'">×</button></div>'+
    '<div class="vipach-contact-list">'+
      '<a class="vipach-contact-action" href="mailto:office@vipach.at"><strong>'+copy.email+'</strong><span>office@vipach.at</span></a>'+
      '<a class="vipach-contact-action" href="https://wa.me/4367761655592?text='+encodeURIComponent(copy.wa)+'" target="_blank" rel="noopener noreferrer"><strong>'+copy.whatsapp+'</strong><span>+43 677 616 55592</span></a>'+
      '<a class="vipach-contact-action" href="https://www.google.com/maps/search/?api=1&query=Mahlerstra%C3%9Fe%2011%2C%201010%20Wien" target="_blank" rel="noopener noreferrer"><strong>'+copy.map+'</strong><span>'+copy.mapHint+'</span></a>'+
    '</div></div><button class="vipach-contact-trigger" type="button" aria-expanded="false" aria-controls="vipach-contact-panel">'+copy.contact+'</button>';
  document.body.appendChild(dock);
  const panel=dock.querySelector('.vipach-contact-panel');
  const trigger=dock.querySelector('.vipach-contact-trigger');
  const close=dock.querySelector('.vipach-contact-close');
  const setOpen=(open)=>{panel.hidden=!open;trigger.setAttribute('aria-expanded',String(open));if(open)close.focus({preventScroll:true});};
  trigger.addEventListener('click',()=>setOpen(panel.hidden));
  close.addEventListener('click',()=>setOpen(false));
  document.addEventListener('keydown',(event)=>{if(event.key==='Escape'&&!panel.hidden)setOpen(false);});
  document.addEventListener('click',(event)=>{if(!panel.hidden&&!dock.contains(event.target))setOpen(false);});
})();
