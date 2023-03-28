const airwallex = require('airwallex');
const Medusa = require('medusa-ecommerce');

class AirwallexPaymentProcessor {
  constructor(options) {
    this.options = options;
    this.client = new airwallex({
      api_key: options.api_key,
      env: options.env || 'test'
    });
  }

  async processPayment(payment) {
    const { amount, currency, paymentMethod, card } = payment;

    try {
      const paymentIntent = await this.createPaymentIntent(amount, currency, paymentMethod, card);
      const result = await this.handlePaymentIntent(paymentIntent, paymentMethod);
      return result;
    } catch (error) {
      throw new Error(`Payment failed: ${error.message}`);
    }
  }

  async createPaymentIntent(amount, currency, paymentMethod, card) {
    const paymentMethodOptions = card ? { card } : { type: paymentMethod };

    const paymentIntent = await this.client.paymentIntents.create({
      amount,
      currency,
      payment_method: paymentMethodOptions
    });

    return paymentIntent;
  }

  async handlePaymentIntent(paymentIntent, paymentMethod) {
    const { status, failure_message, next_action } = paymentIntent;

    switch (status) {
      case 'REQUIRES_ACTION':
        return this.handleRequiresAction(paymentIntent);
      case 'SUCCEEDED':
        return this.handleSuccess(paymentIntent, paymentMethod);
      default:
        throw new Error(`Payment failed: ${failure_message}`);
    }
  }

  handleRequiresAction(paymentIntent) {
    const { next_action } = paymentIntent;

    switch (next_action.type) {
      case 'card_verification':
        return {
          status: 'requires_action',
          action: {
            type: 'card_verification',
            payment_intent_id: paymentIntent.id
          }
        };
      case 'redirect':
        return {
          status: 'requires_action',
          action: {
            type: 'redirect',
            url: next_action.redirect_url
          }
        };
      default:
        throw new Error(`Unknown action type: ${next_action.type}`);
    }
  }

  async handleSuccess(paymentIntent, paymentMethod) {
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
}

module.exports = AirwallexPaymentProcessor;
