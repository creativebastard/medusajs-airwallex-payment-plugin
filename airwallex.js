// Import the Airwallex Node.js SDK
const airwallex = require('airwallex');

// Initialize the Airwallex SDK with your API key
const airwallexClient = new airwallex.Client({
  apiKey: 'YOUR_API_KEY_HERE',
  apiBase: 'https://api.airwallex.com'
});

async function processPayment(payment) {
  const { amount, currency, paymentMethod, card } = payment;

  if (paymentMethod === 'card') {
    const paymentIntent = await createCreditCardPaymentIntent(amount, currency, card);
    return handlePaymentIntent(paymentIntent, paymentMethod);
  } else {
    const paymentIntent = await createAlternativePaymentIntent(amount, currency, paymentMethod);
    return handlePaymentIntent(paymentIntent, paymentMethod);
  }
}

async function createCreditCardPaymentIntent(amount, currency, card) {
  return airwallexClient.paymentIntents.create({
    amount,
    currency,
    payment_method: {
      card
    }
  });
}

async function createAlternativePaymentIntent(amount, currency, paymentMethod) {
  return airwallexClient.paymentIntents.create({
    amount,
    currency,
    payment_method: {
      type: paymentMethod
    }
  });
}

function handlePaymentIntent(paymentIntent, paymentMethod) {
  if (paymentIntent.status === 'REQUIRES_ACTION') {
    return handleRequiresAction(paymentIntent);
  }

  if (paymentIntent.status === 'SUCCEEDED') {
    return handleSuccess(paymentIntent, paymentMethod);
  }

  throw new Error(`Payment failed: ${paymentIntent.failure_message}`);
}

function handleRequiresAction(paymentIntent) {
  if (paymentIntent.next_action.type === 'card_verification') {
    return {
      status: 'requires_action',
      action: {
        type: 'card_verification',
        payment_intent_id: paymentIntent.id
      }
    };
  }

  if (paymentIntent.next_action.type === 'redirect') {
    return {
      status: 'requires_action',
      action: {
        type: 'redirect',
        url: paymentIntent.next_action.redirect_url
      }
    };
  }

  throw new Error(`Unknown action type: ${paymentIntent.next_action.type}`);
}

async function handleSuccess(paymentIntent, paymentMethod) {
  const transaction = await Medusa.Transaction.create({
    amount: paymentIntent.amount,
    currency: paymentIntent.currency,
    status: 'captured',
    payment_id: paymentMethod,
    provider_id: paymentIntent.id
  });

  return {
    status: 'captured',
    transaction
  };
}

// Export the processPayment and refundPayment functions as a MedusaJS plugin
module.exports = {
  name: 'airwallex',
  version: '1.0.0',
  config: {},
  async initialize() {},
  async processPayment,
  async refundPayment
};
