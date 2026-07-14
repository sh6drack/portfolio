const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const apiPath = path.join(root, 'functions', 'api', 'create-payment.js');

const perspectiveView = html.match(/<div id="view-perspective"[\s\S]*?<!-- ===== WORK ===== -->/)?.[0] || '';

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
assert(
  perspectiveView.includes('PRE-ORDER'),
  'perspective page identifies the offer as a preorder'
);
assert(
  perspectiveView.includes('AN UNFILTERED PERSPECTIVE'),
  'perspective page names the preorder title'
);
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

console.log('embedded Square payment structure ok');
