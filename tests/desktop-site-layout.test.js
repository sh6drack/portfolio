const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const articleCss = fs.readFileSync(path.join(root, 'style.css'), 'utf8');

const desktopStart = html.indexOf('@media (min-width: 1024px) {');
const desktopEnd = html.indexOf('@media (max-width: 768px) {', desktopStart);
const desktopCss = html.slice(desktopStart, desktopEnd);
const articleDesktopStart = articleCss.indexOf('@media (min-width: 1024px) {');
const articleDesktopCss = articleCss.slice(articleDesktopStart);
const sharedContextImageRule = html.match(/#view-work \.shared-context-thumb img \{([^}]*)\}/)?.[1] || '';

assert(
  desktopCss.includes('.container-narrow,\n      .container-wide {\n        max-width: 1280px;'),
  'desktop Transmissions, Perspective, and Work share a full desktop shell'
);

assert(
  desktopCss.includes('.fork {\n        grid-template-columns: repeat(3, minmax(0, 1fr));\n        width: min(1200px, 88vw);'),
  'desktop landing uses a wide three-channel rail'
);
assert(
  desktopCss.includes('.fork-block {\n        align-items: center;\n        justify-content: center;\n        text-align: center;'),
  'desktop channel labels are centered in their panels'
);
assert(
  desktopCss.includes('.landing-feature .feature-meta,\n      .feature-title,\n      .feature-byline,\n      .feature-frame {\n        max-width: 1200px;'),
  'desktop landing feature uses the same wide rail'
);
assert(
  desktopCss.includes('.projects-grid {\n        grid-template-columns: repeat(3, minmax(0, 1fr));'),
  'desktop Work uses three columns'
);
assert(
  /position:\s*absolute/.test(sharedContextImageRule),
  'Shared Context image does not stretch its 16:10 thumbnail out of alignment'
);
assert(
  desktopCss.includes('.perspective-offer {\n        width: min(760px, 100%);'),
  'desktop Perspective checkout is not constrained to a mobile form width'
);
assert(
  articleDesktopCss.includes('.container {\n    max-width: 1200px;'),
  'standalone transmissions use a wide desktop shell'
);
assert(
  articleDesktopCss.includes('.trans-heading,\n  .transmission-text {\n    width: min(680px, 100%);'),
  'standalone transmission prose keeps a readable measure inside the desktop shell'
);

console.log('desktop site layout structure ok');
