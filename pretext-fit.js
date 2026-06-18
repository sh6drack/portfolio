// Pretext-driven text fitting.
//
// Uses @chenglou/pretext (vendored in /vendor/pretext) to size display text to
// its container with no layout thrash: each string is measured once, off-DOM,
// via the canvas font engine, and the font-size that fills the column is then
// pure arithmetic. On resize we only re-read one container width and recompute —
// never an iterative shrink-and-remeasure loop.
//
// Targets any element carrying `data-fit`. Optional `data-fit-max` caps the
// size (px); the element shrinks below it only when the text would otherwise
// overflow its column. Degrades to canvas measureText, then to the CSS size,
// if pretext fails to load.

let measureWidthPerPx = null;

async function loadPretext() {
  try {
    const pt = await import('./vendor/pretext/layout.js');
    const prepare = pt.prepare;
    const walkLineRanges = pt.walkLineRanges;
    if (typeof prepare !== 'function' || typeof walkLineRanges !== 'function') {
      throw new Error('pretext: api mismatch');
    }
    // Natural single-line width of `text` at a 1px font, in that font.
    // walkLineRanges() is the non-materializing geometry pass: it yields line
    // widths without building line text, so plain prepare() (no segments) is
    // enough. At an unbounded max width the text stays on one line.
    measureWidthPerPx = function (text, font) {
      const prepared = prepare(text, font);
      let w = 0;
      walkLineRanges(prepared, 1e7, function (line) {
        if (line.width > w) w = line.width;
      });
      return w / BASELINE;
    };
  } catch (e) {
    measureWidthPerPx = canvasWidthPerPx;
  }
}

const BASELINE = 100; // measure at a large baseline for precision
let _ctx = null;
function canvasWidthPerPx(text, font) {
  if (!_ctx) _ctx = document.createElement('canvas').getContext('2d');
  _ctx.font = font;
  return _ctx.measureText(text).width / BASELINE;
}

// per-element cached natural width (independent of container size)
const cache = new WeakMap();

function naturalFor(el) {
  let entry = cache.get(el);
  const text = el.textContent.trim();
  if (entry && entry.text === text) return entry;

  const cs = getComputedStyle(el);
  const weight = cs.fontWeight || '400';
  const family = cs.fontFamily || 'sans-serif';
  const font = weight + ' ' + BASELINE + 'px ' + family;

  const perPx = (measureWidthPerPx || canvasWidthPerPx)(text, font);

  // letter-spacing is reported in px relative to the current font-size; recover
  // its em value so it scales with whatever size we choose.
  const curSize = parseFloat(cs.fontSize) || BASELINE;
  const lsPx = parseFloat(cs.letterSpacing); // NaN for 'normal'
  const lsPerEm = lsPx && curSize ? lsPx / curSize : 0;
  const glyphs = Array.from(text).length;

  entry = { text: text, perPx: perPx, lsPerEm: lsPerEm, glyphs: glyphs };
  cache.set(el, entry);
  return entry;
}

function availWidth(el) {
  // Measure against the padded content box of the element's block parent so
  // this works whether the target is a span, a flex item, or a block.
  const host = el.parentElement || el;
  const cs = getComputedStyle(host);
  const padL = parseFloat(cs.paddingLeft) || 0;
  const padR = parseFloat(cs.paddingRight) || 0;
  return host.clientWidth - padL - padR;
}

function fit(el) {
  const avail = availWidth(el);
  if (avail <= 0) return;
  const m = naturalFor(el);
  if (m.perPx <= 0) return;

  // width(size) = size * (perPx + glyphs * lsPerEm)
  const denom = m.perPx + m.glyphs * m.lsPerEm;
  const fitSize = (avail * 0.985) / denom;
  const max = parseFloat(el.getAttribute('data-fit-max')) || Infinity;
  const size = Math.min(max, fitSize);
  el.style.fontSize = size.toFixed(2) + 'px';
}

function fitAll() {
  document.querySelectorAll('[data-fit]').forEach(fit);
}

async function init() {
  await loadPretext();
  // Wait for the web font so canvas measurement matches the rendered glyphs.
  if (document.fonts && document.fonts.ready) {
    try { await document.fonts.ready; } catch (e) {}
  }
  fitAll();

  let raf = 0;
  const onResize = function () {
    if (raf) cancelAnimationFrame(raf);
    raf = requestAnimationFrame(fitAll);
  };
  window.addEventListener('resize', onResize);

  // The landing fork fades in via animation; refit once it has its real width.
  if (window.ResizeObserver) {
    const ro = new ResizeObserver(onResize);
    document.querySelectorAll('[data-fit]').forEach(function (el) {
      if (el.parentElement) ro.observe(el.parentElement);
    });
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
