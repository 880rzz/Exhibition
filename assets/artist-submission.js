(function(){
  const buttons=[...document.querySelectorAll('[data-intake-lang]')];
  const copies=[...document.querySelectorAll('[data-copy]')];
  const allowed=['en','de','hu'];
  const saved=sessionStorage.getItem('vipach-intake-language');
  const browser=((navigator.languages&&navigator.languages[0])||navigator.language||'en').slice(0,2).toLowerCase();
  const initial=allowed.includes(saved)?saved:(allowed.includes(browser)?browser:'en');
  const setLang=(lang)=>{
    if(!allowed.includes(lang)) lang='en';
    document.documentElement.lang=lang==='de'?'de-AT':lang;
    copies.forEach(el=>{el.hidden=el.dataset.copy!==lang;});
    buttons.forEach(btn=>btn.setAttribute('aria-pressed',String(btn.dataset.intakeLang===lang)));
    sessionStorage.setItem('vipach-intake-language',lang);
  };
  buttons.forEach(btn=>btn.addEventListener('click',()=>setLang(btn.dataset.intakeLang)));
  setLang(initial);
})();