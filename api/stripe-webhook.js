const Stripe = require('stripe');

// Vercel buffers the body by default, but Stripe needs the raw body to verify
// the signature. This config disables body parsing so we get the raw stream.
export const config = { api: { bodyParser: false } };

async function getRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
  const sig = req.headers['stripe-signature'];
  const rawBody = await getRawBody(req);

  let stripeEvent;
  try {
    stripeEvent = stripe.webhooks.constructEvent(
      rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Webhook signature failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  switch (stripeEvent.type) {
    case 'payment_intent.succeeded': {
      const intent = stripeEvent.data.object;
      console.log('Payment succeeded:', intent.id, '$' + (intent.amount / 100).toFixed(2));
      // TODO: send confirmation email, update inventory
      break;
    }
    case 'payment_intent.payment_failed': {
      const intent = stripeEvent.data.object;
      console.log('Payment failed:', intent.id, intent.last_payment_error?.message);
      break;
    }
    default:
      console.log('Unhandled event:', stripeEvent.type);
  }

  return res.status(200).json({ received: true });
}
