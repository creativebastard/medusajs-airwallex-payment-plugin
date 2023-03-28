// Import the Airwallex Node.js SDK
const airwallex = require('airwallex');

// Initialize the Airwallex SDK with your API key
const airwallexClient = new airwallex.Client({
  apiKey: 'YOUR_API_KEY_HERE',
  apiBase: 'https://api.airwallex.com'
});

async function processPayment(payment) {
  const { amount, currency, paymentMethod } = payment;

  // Create a new Airwallex payment intent
  const paymentIntent = await airwallexClient.paymentIntents.create({
    amount,
    currency,
    payment_method: paymentMethod
  });

  // If the payment intent requires authentication, redirect the customer to the authentication URL
  if (paymentIntent.next_action.type === 'redirect') {
    return {
      status: 'requires_action',
      action: {
        type: 'redirect',
        url: paymentIntent.next_action.redirect_url
      }
    };
  }

  // If the payment intent is successful, create a new transaction object in MedusaJS
  if (paymentIntent.status === 'succeeded') {
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

  // If the payment intent is still in progress, return a requires_action status with the next action
  if (paymentIntent.status === 'requires_action') {
    return {
      status: 'requires_action',
      action: {
        type: 'redirect',
        url: paymentIntent.next_action.redirect_url
      }
    };
  }

  // If the payment intent has failed, reject the Promise with an error
  if (paymentIntent.status === 'failed') {
    throw new Error(`Payment failed: ${paymentIntent.last_payment_error.message}`);
  }

  // If the payment intent is in an unknown state, reject the Promise with an error
  throw new Error(`Unknown payment status: ${paymentIntent.status}`);
}

async function refundPayment(transaction, amount) {
  // Use the Airwallex API to refund the payment
  const refund = await airwallexClient.refunds.create(transaction.provider_id, {
    amount: amount,
    currency: transaction.currency
  });

  // Update the transaction status in MedusaJS to refunded
  transaction.status = 'refunded';
  await transaction.save();

  return {
    status: 'refunded',
    refund
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
