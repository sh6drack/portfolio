const assert = require('assert');
const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.resolve(__dirname, '..', 'index.html'), 'utf8');
const desktopStart = html.indexOf('@media (min-width: 769px) {');
const desktopEnd = html.indexOf('@media (max-width: 768px) {', desktopStart);
const desktopCss = html.slice(desktopStart, desktopEnd);

assert(
  desktopCss.includes('.fork {\n        grid-template-columns: repeat(3, minmax(0, 1fr));\n        width: min(1200px, 88vw);'),
  'desktop landing uses a wide three-channel rail'
);
assert(
  desktopCss.includes('.fork-featured {\n        grid-column: auto;\n        width: auto;\n        justify-self: stretch;'),
  'desktop keeps Physical Perspective in the same row as the other channels'
);

console.log('desktop landing layout structure ok');
