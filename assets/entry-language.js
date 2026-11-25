/* Language selection is local and stateless. Only the neutral homepage may redirect. */
(() => {
  if (location.pathname !== '/' || location.hash) return;
  if (new URLSearchParams(location.search).has('lang')) return;
  const supported = new Set(['en', 'de', 'hu']);
  const preferences = navigator.languages?.length ? navigator.languages : [navigator.language];
  const preferred = Array.from(preferences, tag => String(tag || '').toLowerCase().split(/[-_]/, 1)[0])
    .find(tag => supported.has(tag));
  if (preferred === 'de' || preferred === 'hu') location.replace('/' + preferred + '/' + location.search);
})();
