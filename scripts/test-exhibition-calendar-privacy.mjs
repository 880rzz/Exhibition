import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const read = file => fs.readFileSync(file, 'utf8');
const client = read('assets/calendar.js');
const cfg = JSON.parse(read('data/staging/events-calendar.json'));

for (const lang of ['en', 'de', 'hu']) {
  const prefix = lang === 'en' ? '' : lang+'/';
  const page = read(prefix+'events/index.html');
  const policy = read(prefix+'privacy/index.html');
  assert.match(page, /data-calendar-toggle aria-expanded="false" aria-describedby="vip-calendar-disclosure" aria-controls="vip-calendar-panel" hidden/);
  assert.match(page, /<div id="vip-calendar-panel" hidden><\/div>/);
  assert.match(page, /class="vip-calendar-alternative" href="mailto:office@vipach.at"/);
  assert.ok(page.includes('href="/'+prefix+'privacy/#notice-calendar"'));
  assert.ok(page.includes(cfg.localized[lang].show) && page.includes(cfg.localized[lang].hide));
  assert.doesNotMatch(page, /<iframe\b|(?:href|src)="https?:\/\/[^"/\s]*(?:google|gstatic)[^"/\s]*\b|<link\b[^>]*rel="(?:preconnect|dns-prefetch|prefetch)"/i);
  const calendarNotice = policy.match(/<section aria-labelledby="notice-calendar">[\s\S]*?<\/section>/)?.[0];
  assert.ok(calendarNotice?.includes('href="/'+prefix+'events/"'));
  assert.ok(calendarNotice.includes('https://policies.google.com/privacy?hl='+lang));
  assert.ok(calendarNotice.includes('https://policies.google.com/technologies/cookies?hl='+lang));
  for (const slug of ['', 'spontan-2026/']) {
    const archive = read(prefix+slug+'index.html');
    assert.ok(archive.indexOf('id="spontan"') < archive.indexOf('id="exhibitors"'));
    assert.ok(archive.indexOf('id="exhibitors"') < archive.indexOf('id="community"'));
    assert.ok(archive.indexOf('id="exhibitors"') < archive.indexOf('id="learning"'));
  }
}

function simulate(vipCalendar) {
  const handlers = new Map();
  const frames = [];
  const control = {
    hidden: true,
    expanded: 'false',
    textContent: 'Allow',
    getAttribute(name) { return name === 'aria-controls' ? 'panel' : this.expanded; },
    setAttribute(name, value) { assert.equal(name, 'aria-expanded'); this.expanded = value; },
    addEventListener(name, action) { handlers.set(name, action); }
  };
  const panel = {
    children: [],
    hidden: true,
    replaceChildren(...children) { this.children = children; }
  };
  const window = {
    matchMedia: () => ({ matches: true }),
    addEventListener(event, action) { handlers.set(event, action); }
  };
  const document = {
    querySelector: () => ({dataset: {vipCalendar, show: 'Allow', hide: 'Turn off', title: 'Calendar'}, querySelector: () => control}),
    getElementById: () => panel,
    createElement(tag) {
      assert.equal(tag, 'iframe');
      const frame = {};
      frames.push(frame);
      return frame;
    }
  };
  vm.runInNewContext(client, {window, document, URL});
  return {handlers, frames, panel, control};
}

const {handlers, frames, panel, control} = simulate(cfg.url);
assert.equal(control.hidden, false);
assert.equal(frames.length, 0);
assert.equal(panel.hidden, true);
handlers.get('click')();
assert.equal(frames.length, 1);
assert.equal(panel.children.length, 1);
assert.equal(panel.hidden, false);
assert.equal(control.expanded, 'true');
assert.equal(control.textContent, 'Turn off');
assert.equal(new URL(frames[0].src).origin, 'https://calendar.google.com');
assert.equal(new URL(frames[0].src).searchParams.get('mode'), 'AGENDA');
assert.equal(frames[0].referrerPolicy, 'no-referrer');
handlers.get('click')();
assert.equal(panel.children.length, 0);
assert.equal(panel.hidden, true);
assert.equal(control.expanded, 'false');
assert.equal(control.textContent, 'Allow');
handlers.get('click')();
handlers.get('pagehide')();
assert.equal(panel.children.length, 0);
assert.equal(panel.hidden, true);
for (const unsafe of ['https://calendar.google.com:81/calendar/embed', 'https://calendar.google.com@vipach.at/calendar/embed', 'wrong']) {
  const denied = simulate(unsafe);
  denied.handlers.get('click')();
  assert.equal(denied.frames.length, 0, unsafe);
}
assert.doesNotMatch(client, /document\.cookie|localStorage|sessionStorage/);
console.log('PASS 3L calendar disclosure, inert default, explicit activation and one-click reset, fallback, and artwork-first order.');
