import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import {
  SubscriptionStatus,
  UserSubscription,
} from '../entities/user-subscription.entity';
import { Plan } from '../entities/plan.entity';
import { StripeService } from './stripe.service';
import { CreatePaymentIntentDto } from './dto/create-payment-intent.dto';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import Stripe from 'stripe';
import {
  ExtendedInvoice,
  IStripeEventData,
} from './interfaces/stripe.interface';
import { FacebookService } from '../facebook/facebook.service';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(UserSubscription)
    private readonly subscriptionRepository: Repository<UserSubscription>,
    @InjectRepository(Plan)
    private readonly planRepository: Repository<Plan>,
    private readonly stripeService: StripeService,
    private readonly facebookService: FacebookService,
  ) {}

  async createPaymentIntent(userId: string, dto: CreatePaymentIntentDto) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    let customerId = user.activeSubscription?.stripeCustomerId;
    if (!customerId) {
      customerId = await this.stripeService.createCustomer(user);
    }
    try {
      const paymentIntent = await this.stripeService.createPaymentIntent(
        dto.amount,
        dto.currency.toLowerCase(),
        customerId,
      );

      // Track Facebook event
      await this.facebookService.trackInitiateCheckout(
        user,
        { referer: 'https://your-domain.com/checkout' },
        dto.amount / 100,
        dto.currency.toUpperCase(),
      );

      return {
        clientSecret: paymentIntent.client_secret,
      };
    } catch (error) {
      this.logger.error(
        `Failed to create payment intent: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      throw error;
    }
  }

  async createSubscription(
    userId: string,
    dto: CreateSubscriptionDto,
  ): Promise<{ subscriptionId: string; clientSecret: string | null }> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const plan = await this.planRepository.findOne({
      where: { id: dto.planId },
    });
    if (!plan) {
      throw new NotFoundException('Plan not found');
    }

    let customerId = user.activeSubscription?.stripeCustomerId;
    if (!customerId) {
      customerId = await this.stripeService.createCustomer(user);
    }

    try {
      // Create the Stripe subscription and expand the latest invoice and its payment intent.
      const subscription = await this.stripeService.createSubscription(
        customerId,
        plan,
        dto.paymentMethodId,
      );

      const invoice = subscription.latest_invoice as ExtendedInvoice;

      let paymentIntent: Stripe.PaymentIntent;
      if (typeof invoice.payment_intent === 'string') {
        // If payment_intent is returned as a string, retrieve the full PaymentIntent object.
        paymentIntent = await this.stripeService.retrievePaymentIntent(
          invoice.payment_intent,
        );
      } else if (invoice.payment_intent) {
        paymentIntent = invoice.payment_intent;
      } else {
        throw new Error('Payment intent not found on invoice');
      }

      // Create and save a new subscription record in your database.
      const userSubscription = this.subscriptionRepository.create({
        user,
        plan,
        status: SubscriptionStatus.ACTIVE,
        startDate: new Date(),
        stripeSubscriptionId: subscription.id,
        stripeCustomerId: customerId,
      });

      await this.subscriptionRepository.save(userSubscription);

      // Update user's active subscription.
      user.activeSubscription = userSubscription;
      await this.userRepository.save(user);

      // Track Facebook event
      await this.facebookService.trackSubscribe(
        user,
        { referer: 'https://blinkly.app/subscription' },
        plan.name,
        plan.price ? plan.price / 100 : 0,
        'USD',
      );

      return {
        subscriptionId: subscription.id,
        clientSecret: paymentIntent.client_secret,
      };
    } catch (error) {
      this.logger.error(
        `Failed to create subscription: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      throw error;
    }
  }

  async cancelSubscription(userId: string) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['activeSubscription'],
    });

    if (!user?.activeSubscription) {
      throw new NotFoundException('No active subscription found');
    }

    const { stripeSubscriptionId } = user.activeSubscription;
    if (!stripeSubscriptionId) {
      throw new BadRequestException('Stripe subscription ID is missing');
    }
    try {
      await this.stripeService.cancelSubscription(stripeSubscriptionId);

      user.activeSubscription.status = SubscriptionStatus.CANCELLED;
      user.activeSubscription.endDate = new Date();
      await this.subscriptionRepository.save(user.activeSubscription);

      return { message: 'Subscription cancelled successfully' };
    } catch (error) {
      this.logger.error(
        `Failed to cancel subscription: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      throw error;
    }
  }

  async getPaymentMethods(userId: string) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['activeSubscription'],
    });

    if (!user?.activeSubscription?.stripeCustomerId) {
      throw new NotFoundException('No payment methods found');
    }
    try {
      return await this.stripeService.listPaymentMethods(
        user.activeSubscription.stripeCustomerId,
      );
    } catch (error) {
      this.logger.error(
        `Failed to get payment methods: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      throw error;
    }
  }

  async processRefund(
    userId: string,
    paymentIntentId: string,
    amount?: number,
  ) {
    try {
      const refund = await this.stripeService.createRefund(
        paymentIntentId,
        amount,
      );
      return { refundId: refund.id };
    } catch (error) {
      this.logger.error(
        `Failed to process refund: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      throw error;
    }
  }

  async handleSuccessfulPayment(data: IStripeEventData): Promise<void> {
    console.log(data);
  }

  //
  // async handleFailedPayment(data: IStripeEventData): Promise<void> {
  //   // Implementation
  //   await Promise.resolve();
  // }
  //
  // async handleSubscriptionCancellation(data: IStripeEventData): Promise<void> {
  //   // Implementation
  //   await Promise.resolve();
  // }
  //
  // async handleSuccessfulSubscriptionPayment(
  //   data: IStripeEventData,
  // ): Promise<void> {
  //   // Implementation
  //   await Promise.resolve();
  // }
  //
  // async handleFailedSubscriptionPayment(data: IStripeEventData): Promise<void> {
  //   // Implementation
  //   await Promise.resolve();
  // }
}
