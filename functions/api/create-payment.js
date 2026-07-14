const SQUARE_VERSION = '2026-05-20';
const LOCATION_ID = 'LT80EPP7A675W';
const AMOUNT_MONEY = {
  amount: 50000000,
  currency: 'USD'
};

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store'
    }
  });
}

export async function onRequestPost({ request, env }) {
  if (!env.SQUARE_ACCESS_TOKEN) {
    return json({ ok: false, error: 'Payment configuration missing.' }, 500);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: 'Invalid payment request.' }, 400);
  }

  const sourceId = typeof body.sourceId === 'string' ? body.sourceId.trim() : '';
  const email = typeof body.email === 'string' ? body.email.trim() : '';

  if (!sourceId) {
    return json({ ok: false, error: 'Missing payment source.' }, 400);
  }

  const squarePayload = {
    source_id: sourceId,
    idempotency_key: crypto.randomUUID(),
    amount_money: AMOUNT_MONEY,
    location_id: LOCATION_ID,
    note: 'AN UNFILTERED SERIES OF TRANSMISSIONS PRE-ORDER'
  };

  if (email) {
    squarePayload.buyer_email_address = email;
  }

  const squareResponse = await fetch('https://connect.squareup.com/v2/payments', {
    method: 'POST',
    headers: {
      'Square-Version': SQUARE_VERSION,
      'Authorization': `Bearer ${env.SQUARE_ACCESS_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(squarePayload)
  });

  const squareBody = await squareResponse.json().catch(() => ({}));

  if (!squareResponse.ok) {
    const error = Array.isArray(squareBody.errors) && squareBody.errors[0]
      ? squareBody.errors[0].detail || squareBody.errors[0].code
      : 'Payment failed.';
    return json({ ok: false, error }, squareResponse.status);
  }

  return json({
    ok: true,
    paymentId: squareBody.payment && squareBody.payment.id,
    receiptUrl: squareBody.payment && squareBody.payment.receipt_url
  });
}

export async function onRequestOptions() {
  return json({ ok: true });
}
