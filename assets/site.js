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
