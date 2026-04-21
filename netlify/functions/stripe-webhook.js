const Stripe = require('stripe');

exports.handler = async (event) => {
  const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
  const sig = event.headers['stripe-signature'];

  let stripeEvent;
  try {
    stripeEvent = stripe.webhooks.constructEvent(
      event.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Webhook signature failed:', err.message);
    return { statusCode: 400, body: `Webhook Error: ${err.message}` };
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

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ received: true }),
  };
};
