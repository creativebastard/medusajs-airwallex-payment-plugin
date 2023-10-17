// Import the necessary libraries
import { MedusaPlugin } from '@medusajs/medusa/plugins';
import Airwallex from 'airwallex';

// Create a new MedusaPlugin class
class AirwallexPlugin extends MedusaPlugin {
  constructor(config) {
    super(config);

    // Create a new Airwallex client
    this.airwallex = new Airwallex({
      apiKey: config.apiKey,
      apiSecret: config.apiSecret,
    });
  }

  // This method will be called when a payment is processed
  async processPayment(payment) {
    try {
      // Create a new Airwallex charge
      const charge = await this.airwallex.charges.create({
        amount: payment.amount,
        currency: payment.currency,
        description: payment.description,
        source: payment.source,
      });

      // If the charge is successful, return the charge ID
      if (charge.status === 'successful') {
        return charge.id;
      }

      // If the charge is not successful, throw an error
      throw new Error(`Airwallex charge failed: ${charge.message}`);
    } catch (error) {
      // Handle the error
      console.error(error);
    }
  }

  // This method will be called when a partial refund is processed
  async partialRefundPayment(refund) {
    try {
      // Create a new Airwallex refund
      const refund = await this.airwallex.refunds.create({
        chargeId: refund.chargeId,
        amount: refund.amount,
        currency: refund.currency,
        description: refund.description,
      });

      // If the refund is successful, return the refund ID
      if (refund.status === 'successful') {
        return refund.id;
      }

      // If the refund is not successful, throw an error
      throw new Error(`Airwallex refund failed: ${refund.message}`);
    } catch (error) {
      // Handle the error
      console.error(error);
    }
  }

  // This method will be called when a recurring payment is processed
  async createRecurringPayment(subscription) {
    try {
      // Create a new Airwallex subscription
      const subscription = await this.airwallex.subscriptions.create({
        planId: subscription.planId,
        customerId: subscription.customerId,
      });

      // If the subscription is successful, return the subscription ID
      if (subscription.status === 'active') {
        return subscription.id;
      }

      // If the subscription is not successful, throw an error
      throw new Error(`Airwallex subscription failed: ${subscription.message}`);
    } catch (error) {
      // Handle the error
      console.error(error);
    }
  }
}

// Export the AirwallexPlugin class
export default AirwallexPlugin;
