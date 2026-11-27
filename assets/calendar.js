(() => {
  const shell = document.querySelector('[data-vip-calendar]');
  const toggle = shell?.querySelector('button[data-calendar-toggle]');
  if (!toggle) return;
  const panel = document.getElementById(toggle.getAttribute('aria-controls'));
  if (!panel) return;

  function turnOff() {
    panel.replaceChildren();
    panel.hidden = true;
    toggle.setAttribute('aria-expanded', 'false');
    toggle.textContent = shell.dataset.show;
  }

  toggle.hidden = false;
  toggle.addEventListener('click', () => {
    if (toggle.getAttribute('aria-expanded') === 'true') {
      turnOff();
      return;
    }

    let url;
    try { url = new URL(shell.dataset.vipCalendar); } catch { return; }
    if (url.origin !== 'https://calendar.google.com' || url.pathname !== '/calendar/embed' || url.username || url.password) return;
    if (window.matchMedia('(max-width: 620px)').matches) url.searchParams.set('mode', 'AGENDA');

    const frame = document.createElement('iframe');
    frame.className = 'vip-calendar-frame';
    frame.title = shell.dataset.title;
    frame.referrerPolicy = 'no-referrer';
    frame.src = url.href;
    panel.replaceChildren(frame);
    panel.hidden = false;
    toggle.setAttribute('aria-expanded', 'true');
    toggle.textContent = shell.dataset.hide;
  });

  // Also reset on history navigation so the back/forward cache restores an inert page.
  window.addEventListener('pagehide', turnOff);
})();
