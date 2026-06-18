// Shared theme toggle. Reads/writes localStorage 'theme' so the choice
// persists across pages after the one-time light-default migration.
(function () {
  var SVG_NS = 'http://www.w3.org/2000/svg';
  var DEFAULT_THEME_VERSION = 'dark-default-2026-06-17';

  function readTheme() {
    try {
      if (localStorage.getItem('theme-default-version') !== DEFAULT_THEME_VERSION) {
        localStorage.setItem('theme-default-version', DEFAULT_THEME_VERSION);
        localStorage.removeItem('theme');
        return 'dark';
      }
      var v = localStorage.getItem('theme');
      return v === 'light' ? 'light' : 'dark';
    } catch (e) {
      return 'dark';
    }
  }

  function applyTheme(theme) {
    var isLight = theme === 'light';
    document.documentElement.classList.toggle('light', isLight);
    if (document.body) document.body.classList.toggle('light', isLight);
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', isLight ? '#f5f5f5' : '#050505');
  }

  applyTheme(readTheme());

  function makeSvg(className, paths) {
    var svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('class', className);
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', 'currentColor');
    svg.setAttribute('stroke-width', '1.8');
    svg.setAttribute('stroke-linecap', 'round');
    svg.setAttribute('stroke-linejoin', 'round');
    svg.setAttribute('aria-hidden', 'true');
    paths.forEach(function (p) {
      var node = document.createElementNS(SVG_NS, p.tag);
      Object.keys(p.attrs).forEach(function (k) {
        node.setAttribute(k, p.attrs[k]);
      });
      svg.appendChild(node);
    });
    return svg;
  }

  function ensureButton() {
    if (document.getElementById('theme-toggle')) return;
    var btn = document.createElement('button');
    btn.id = 'theme-toggle';
    btn.className = 'theme-toggle';
    btn.type = 'button';
    btn.setAttribute('aria-label', 'Toggle light mode');

    btn.appendChild(makeSvg('moon', [
      { tag: 'path', attrs: { d: 'M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z' } }
    ]));
    btn.appendChild(makeSvg('sun', [
      { tag: 'circle', attrs: { cx: '12', cy: '12', r: '4' } },
      { tag: 'path', attrs: { d: 'M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41' } }
    ]));
    document.body.appendChild(btn);
  }

  function initCursor() {
    var supportsHover = window.matchMedia('(hover: hover)').matches;
    if (!supportsHover) return;
    var cursor = document.createElement('div');
    cursor.className = 'cursor';
    document.body.appendChild(cursor);
    document.addEventListener('mousemove', function(e) {
      cursor.style.left = e.clientX + 'px';
      cursor.style.top = e.clientY + 'px';
    });
    document.addEventListener('mouseover', function(e) {
      if (e.target.matches('a, button, [role="button"], input, textarea, select, label[for], [data-interactive]')) {
        cursor.classList.add('active');
      }
    });
    document.addEventListener('mouseout', function(e) {
      if (e.target.matches('a, button, [role="button"], input, textarea, select, label[for], [data-interactive]')) {
        cursor.classList.remove('active');
      }
    });
  }

  function wire() {
    applyTheme(readTheme());
    ensureButton();
    initCursor();
    var btn = document.getElementById('theme-toggle');
    if (!btn) return;
    btn.addEventListener('click', function () {
      var next = document.documentElement.classList.contains('light') ? 'dark' : 'light';
      try { localStorage.setItem('theme', next); } catch (e) {}
      applyTheme(next);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', wire);
  } else {
    wire();
  }
})();
