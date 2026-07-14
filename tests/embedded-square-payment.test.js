const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const apiPath = path.join(root, 'functions', 'api', 'create-payment.js');
const sharedContextImagePath = path.join(root, 'shared-context-lab.png');

const perspectiveView = html.match(/<div id="view-perspective"[\s\S]*?<!-- ===== WORK ===== -->/)?.[0] || '';
const workView = html.match(/<div id="view-work"[\s\S]*?<!-- ===== ROUTER ===== -->/)?.[0] || '';

assert(
  perspectiveView.includes('https://web.squarecdn.com/v1/square.js'),
  'perspective view loads the Square Web Payments SDK'
);
assert(
  perspectiveView.includes('data-square-application-id="sq0idp-TlquK5NRSG9BbKAlj0VqzQ"'),
  'perspective view exposes the Square application id for Web Payments'
);
assert(
  perspectiveView.includes('data-square-location-id="LT80EPP7A675W"'),
  'perspective view exposes the Square location id for Web Payments'
);
assert(perspectiveView.includes('id="card-container"'), 'perspective view includes the on-site card container');
assert(perspectiveView.includes('id="payment-form"'), 'perspective view includes the on-site payment form');
assert(perspectiveView.includes('id="payment-status"'), 'perspective view includes payment status text');
assert(!perspectiveView.includes('square.link'), 'perspective view no longer redirects to Square checkout');
assert(!html.includes('SAMPLE BOOK'), 'site does not describe the offer as a sample book');
assert(!/religious studies/i.test(html), 'site no longer identifies Shadrack’s degree as religious studies');
assert(
  html.includes("Brown University Computer Science & Contemplative Studies '27."),
  'SEO description spells out the updated degree'
);
assert(
  (html.match(/CONTEMPLATIVE STUDIES/g) || []).length === 4,
  'site identifies Shadrack’s degree as contemplative studies everywhere it appears'
);
assert(!html.includes('CS &amp; CONTEMPLATIVE STUDIES'), 'desktop footers do not abbreviate computer science');
assert(
  (html.match(/COMPUTER SCIENCE &amp; CONTEMPLATIVE STUDIES/g) || []).length === 3,
  'every content footer spells out computer science'
);
assert(
  perspectiveView.includes('PRE-ORDER'),
  'perspective page identifies the offer as a preorder'
);
assert(!perspectiveView.includes('AN UNFILTERED PERSPECTIVE'), 'perspective checkout omits an extra title');
assert(
  perspectiveView.includes('PRE-ORDER $500,000'),
  'payment action shows the $500,000 preorder price'
);
assert(html.includes("fetch('/api/create-payment'"), 'client sends token to the local payment endpoint');
assert(html.includes('card.tokenize('), 'client tokenizes the card on site');
assert(html.includes("amount: '500000.00'"), 'client tokenization uses the $500,000 amount');

assert(fs.existsSync(apiPath), 'Cloudflare Pages create-payment function exists');
const api = fs.readFileSync(apiPath, 'utf8');
assert(api.includes('env.SQUARE_ACCESS_TOKEN'), 'Cloudflare function reads the Square token from env');
assert(api.includes('https://connect.squareup.com/v2/payments'), 'API route calls Square CreatePayment');
assert(api.includes('amount: 50000000'), 'API route charges 50000000 cents');
assert(api.includes("currency: 'USD'"), 'API route charges USD');
assert(api.includes('source_id'), 'API route forwards the payment source token');
assert(api.includes('idempotency_key'), 'API route sends an idempotency key');
assert(api.includes('onRequestPost'), 'Cloudflare function handles POST requests');

assert(workView.includes('10 PROJECTS'), 'Work header counts the Shared Context Lab card');
assert.strictEqual(
  (html.match(/10 PROJECTS/g) || []).length,
  2,
  'landing and Work both count ten projects'
);
assert(
  workView.includes('href="https://sharedcontextlab.com"'),
  'Work links to Shared Context Lab'
);
assert(fs.existsSync(sharedContextImagePath), 'Shared Context Lab card image exists');
assert(
  workView.includes('<img src="shared-context-lab.png" alt="Shared Context Lab">'),
  'Shared Context Lab card uses the supplied wordmark image'
);
assert(
  !workView.includes('<span class="shared-context-wordmark">'),
  'Shared Context Lab card no longer substitutes a text wordmark'
);
assert(
  workView.includes('AI Engineer Intern helping build Cue, a personal AI that learns your life, and helps you live it.'),
  'Shared Context Lab card describes the Cue internship'
);
assert(
  workView.indexOf('sharedcontextlab.com') < workView.indexOf('blueno.polarity-lab.com'),
  'Shared Context Lab appears above Blueno'
);

console.log('embedded Square payment structure ok');
