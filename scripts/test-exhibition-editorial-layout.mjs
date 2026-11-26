import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const read = name => fs.readFileSync(name, 'utf8');
const css = read('assets/styles.css');
assert.match(css, /--exhibition-media-radius:\s*5px/);
assert.match(css, /img, video\s*\{\s*border-radius: var\(--exhibition-media-radius\)/);
assert.match(css, /\.site-menu\s*\{\s*inset-block-start: var\(--exhibition-header-size\)/);
assert.match(css, /scroll-margin-top: calc\(var\(--exhibition-header-size\) \+ 14px\)/);
assert.match(css, /\.visit-line\s*\{\s*grid-template-columns: minmax\(0, 1fr\); gap: \.25rem/);

// The motion rules must never leave visible headings in their translated state.
const motion = css.slice(css.indexOf('/* Motion is optional.'), css.indexOf('.event-note{'));
assert.match(motion, /\.motion-target\{opacity:1;transform:none\}/);
assert.match(motion, /@media screen and \(prefers-reduced-motion:no-preference\)/);
assert.match(motion, /\.js \.motion-target:not\(\.motion-visible\)\{opacity:0;transform:translateY\(var\(--motion-enter-distance,14px\)\)\}/);
assert.equal(motion.match(/translateY\(/g)?.length,1);
assert.match(motion, /#exhibitors-title\.motion-target\{--motion-enter-distance:0px\}/);
const posterCss=read('assets/exhibition-harmonization.css');
assert.match(posterCss, /#exhibitors-title \+ \.ex25-translation-note \{ margin-block-start: 12px; \}/);

const writes = [];
let height = 124.2, resize;
const masthead = { getBoundingClientRect: () => ({height}) };
const root={classList:{add(){}},style:{setProperty:(...a)=>writes.push(a)}};
const doc={documentElement:root,querySelector:(s)=>s==='.site-header'?masthead:null};
const code=read('assets/site.js');
const prefix=code.slice(0, code.indexOf("const items=document.querySelectorAll('.reveal');"));
const ResizeObserver=class{constructor(cb){resize=cb}observe(target){assert.equal(target,masthead)}};
vm.runInNewContext(prefix,{document:doc,window:{ResizeObserver},ResizeObserver});
assert.deepEqual(writes,[['--exhibition-header-size','125px']]);
height=58;resize();
assert.deepEqual(writes.at(-1),['--exhibition-header-size','58px']);
console.log('Exhibition media radius, text wrapping, and sticky masthead spacing verified.');
