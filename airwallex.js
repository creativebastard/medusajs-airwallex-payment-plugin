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
    // Create a new Airwallex credit card payment intent
    const paymentIntent = await airwallexClient.paymentIntents.create({
      amount,
      currency,
      payment_method: {
        card
      }
    });

    // If the payment intent requires authentication, return a requires_action status with the next action
    if (paymentIntent.status === 'REQUIRES_ACTION') {
      return {
        status: 'requires_action',
        action: {
          type: 'card_verification',
          payment_intent_id: paymentIntent.id
        }
      };
    }

    // If the payment intent is successful, create a new transaction object in MedusaJS
    if (paymentIntent.status === 'SUCCEEDED') {
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

    // If the payment intent has failed, reject the Promise with an error
    if (paymentIntent.status === 'FAILED') {
      throw new Error(`Payment failed: ${paymentIntent.failure_message}`);
    }

    // If the payment intent is in an unknown state, reject the Promise with an error
    throw new Error(`Unknown payment status: ${paymentIntent.status}`);
  } else {
    // Create a new Airwallex alternative payment intent
    const paymentIntent = await airwallexClient.paymentIntents.create({
      amount,
      currency,
      payment_method: {
        type: paymentMethod
      }
    });

    // If the payment intent requires authentication, return a requires_action status with the next action
    if (paymentIntent.status === 'REQUIRES_ACTION') {
      return {
        status: 'requires_action',
        action: {
          type: 'redirect',
          url: paymentIntent.next_action.redirect_url
        }
      };
    }

    // If the payment intent is successful, create a new transaction object in MedusaJS
    if (paymentIntent.status === 'SUCCEEDED') {
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

    // If the payment intent has failed, reject the Promise with an error
    if (paymentIntent.status === 'FAILED') {
      throw new Error(`Payment failed: ${paymentIntent.failure_message}`);
    }

    // If the payment intent is in an unknown state, reject the Promise with an error
    throw new Error(`Unknown payment status: ${paymentIntent.status}`);
  }
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
