import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { User } from '../entities/user.entity';
import { Plan } from '../entities/plan.entity';

@Injectable()
export class StripeService {
  private readonly stripe: Stripe;
  private readonly logger = new Logger(StripeService.name);

  constructor(private configService: ConfigService) {
    const secretKey = this.configService.get<string>('STRIPE_SECRET_KEY');
    if (!secretKey) {
      throw new Error('STRIPE_SECRET_KEY is not configured');
    }

    this.stripe = new Stripe(secretKey);
  }

  async retrievePaymentIntent(
    paymentIntentId: string,
  ): Promise<Stripe.PaymentIntent> {
    try {
      return await this.stripe.paymentIntents.retrieve(paymentIntentId);
    } catch (error) {
      this.logger.error(
        `Failed to retrieve payment intent ${paymentIntentId}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      throw error;
    }
  }

  async createCustomer(user: User): Promise<string> {
    try {
      const customer = await this.stripe.customers.create({
        email: user.email,
        name: user.getFullName(),
        metadata: {
          userId: user.id,
        },
      });

      return customer.id;
    } catch (error) {
      this.logger.error(
        `Failed to create Stripe customer: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      throw error;
    }
  }

  async createPaymentIntent(
    amount: number,
    currency: string,
    customerId: string,
  ): Promise<Stripe.PaymentIntent> {
    try {
      return await this.stripe.paymentIntents.create({
        amount,
        currency,
        customer: customerId,
        payment_method_types: ['card'],
      });
    } catch (error) {
      this.logger.error(
        `Failed to create payment intent: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      throw error;
    }
  }

  async createSubscription(
    customerId: string,
    plan: Plan,
    paymentMethodId: string,
  ): Promise<Stripe.Subscription> {
    try {
      await this.stripe.paymentMethods.attach(paymentMethodId, {
        customer: customerId,
      });

      await this.stripe.customers.update(customerId, {
        invoice_settings: {
          default_payment_method: paymentMethodId,
        },
      });

      const priceId = this.getPriceIdForPlan(plan);
      return await this.stripe.subscriptions.create({
        customer: customerId,
        items: [{ price: priceId }],
        payment_behavior: 'default_incomplete',
        payment_settings: { save_default_payment_method: 'on_subscription' },
        expand: ['latest_invoice.payment_intent'],
      });
    } catch (error) {
      this.logger.error(
        `Failed to create subscription: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      throw error;
    }
  }

  async cancelSubscription(
    subscriptionId: string,
  ): Promise<Stripe.Subscription> {
    try {
      return await this.stripe.subscriptions.cancel(subscriptionId);
    } catch (error) {
      this.logger.error(
        `Failed to cancel subscription: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      throw error;
    }
  }

  async createRefund(
    paymentIntentId: string,
    amount?: number,
  ): Promise<Stripe.Refund> {
    try {
      const refundParams: Stripe.RefundCreateParams = {
        payment_intent: paymentIntentId,
      };

      if (amount) {
        refundParams.amount = amount;
      }

      return await this.stripe.refunds.create(refundParams);
    } catch (error) {
      this.logger.error(
        `Failed to create refund: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      throw error;
    }
  }

  async listPaymentMethods(
    customerId: string,
  ): Promise<Stripe.PaymentMethod[]> {
    try {
      const { data } = await this.stripe.paymentMethods.list({
        customer: customerId,
        type: 'card',
      });
      return data;
    } catch (error) {
      this.logger.error(
        `Failed to list payment methods: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      throw error;
    }
  }

  handleWebhookEvent(signature: string, payload: Buffer): Stripe.Event {
    const webhookSecret = this.configService.get<string>(
      'STRIPE_WEBHOOK_SECRET',
    );
    if (!webhookSecret) {
      throw new Error('STRIPE_WEBHOOK_SECRET is not configured');
    }
    try {
      const event = this.stripe.webhooks.constructEvent(
        payload,
        signature,
        webhookSecret,
      );

      this.logger.log(`Processing webhook event: ${event.type}`);
      return event;
    } catch (error) {
      this.logger.error(
        `Webhook signature verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      throw error;
    }
  }

  private getPriceIdForPlan(plan: Plan): string {
    const priceKey = `STRIPE_PRICE_${plan.name.toUpperCase()}_${plan.billingFrequency.toUpperCase()}`;
    const priceId = this.configService.get<string>(priceKey);

    if (!priceId) {
      throw new Error(
        `No Stripe price ID configured for plan: ${plan.name} (${plan.billingFrequency})`,
      );
    }

    return priceId;
  }
}
