(() => {
  const shell = document.querySelector('[data-vip-calendar]');
  if (!shell) return;
  const toggle = shell.querySelector('button[data-calendar-toggle]');
  const panel = document.getElementById(toggle.getAttribute('aria-controls'));
  if (!panel) return;
  toggle.hidden = false;
  toggle.addEventListener('click', () => {
    if (toggle.getAttribute('aria-expanded') === 'true') {
      panel.replaceChildren();
      toggle.setAttribute('aria-expanded', 'false');
      toggle.textContent = shell.dataset.show;
      return;
    }
    const url = new URL(shell.dataset.vipCalendar);
    if (url.protocol !== 'https:' || url.hostname !== 'calendar.google.com' || url.pathname !== '/calendar/embed') return;
    if (window.matchMedia('(max-width: 620px)').matches) url.searchParams.set('mode', 'AGENDA');
    const frame = document.createElement('iframe');
    frame.className = 'vip-calendar-frame';
    frame.title = shell.dataset.title;
    frame.referrerPolicy = 'no-referrer';
    frame.src = url.href;
    panel.replaceChildren(frame);
    toggle.setAttribute('aria-expanded', 'true');
    toggle.textContent = shell.dataset.hide;
  });
})();
