const Stripe = require('stripe');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { amount, metadata = {} } = req.body;

    if (!amount || amount < 50) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount),
      currency: 'usd',
      automatic_payment_methods: { enabled: true },
      metadata,
    });

    return res.status(200).json({ clientSecret: paymentIntent.client_secret });
  } catch (err) {
    console.error('create-payment-intent error:', err.message);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
