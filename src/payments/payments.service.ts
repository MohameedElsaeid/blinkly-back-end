import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import {
  UserSubscription,
  SubscriptionStatus,
} from '../entities/user-subscription.entity';
import { Plan } from '../entities/plan.entity';
import { StripeService } from './stripe.service';
import { CreatePaymentIntentDto } from './dto/create-payment-intent.dto';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';

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
  ) {}

  async createPaymentIntent(userId: string, dto: CreatePaymentIntentDto) {
    try {
      const user = await this.userRepository.findOne({ where: { id: userId } });
      if (!user) {
        throw new NotFoundException('User not found');
      }

      let customerId = user.activeSubscription?.stripeCustomerId;
      if (!customerId) {
        customerId = await this.stripeService.createCustomer(user);
      }

      const paymentIntent = await this.stripeService.createPaymentIntent(
        dto.amount,
        dto.currency.toLowerCase(),
        customerId,
      );

      return {
        clientSecret: paymentIntent.client_secret,
      };
    } catch (error) {
      this.logger.error(`Failed to create payment intent: ${error.message}`);
      throw error;
    }
  }

  async createSubscription(userId: string, dto: CreateSubscriptionDto) {
    try {
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

      const subscription = await this.stripeService.createSubscription(
        customerId,
        plan,
        dto.paymentMethodId,
      );

      const userSubscription = this.subscriptionRepository.create({
        user,
        plan,
        status: SubscriptionStatus.ACTIVE,
        startDate: new Date(),
        stripeSubscriptionId: subscription.id,
        stripeCustomerId: customerId,
      });

      await this.subscriptionRepository.save(userSubscription);

      // Update user's active subscription
      user.activeSubscription = userSubscription;
      await this.userRepository.save(user);

      return {
        subscriptionId: subscription.id,
        clientSecret: (subscription.latest_invoice as any).payment_intent
          .client_secret,
      };
    } catch (error) {
      this.logger.error(`Failed to create subscription: ${error.message}`);
      throw error;
    }
  }

  async cancelSubscription(userId: string) {
    try {
      const user = await this.userRepository.findOne({
        where: { id: userId },
        relations: ['activeSubscription'],
      });

      if (!user || !user.activeSubscription) {
        throw new NotFoundException('No active subscription found');
      }

      if (!user.activeSubscription.stripeSubscriptionId) {
        throw new BadRequestException('Stripe subscription ID is missing');
      }

      await this.stripeService.cancelSubscription(
        user.activeSubscription.stripeSubscriptionId,
      );

      user.activeSubscription.status = SubscriptionStatus.CANCELLED;
      user.activeSubscription.endDate = new Date();
      await this.subscriptionRepository.save(user.activeSubscription);

      return { message: 'Subscription cancelled successfully' };
    } catch (error) {
      this.logger.error(`Failed to cancel subscription: ${error.message}`);
      throw error;
    }
  }

  async getPaymentMethods(userId: string) {
    try {
      const user = await this.userRepository.findOne({
        where: { id: userId },
        relations: ['activeSubscription'],
      });

      if (!user || !user.activeSubscription?.stripeCustomerId) {
        throw new NotFoundException('No payment methods found');
      }

      return await this.stripeService.listPaymentMethods(
        user.activeSubscription.stripeCustomerId,
      );
    } catch (error) {
      this.logger.error(`Failed to get payment methods: ${error.message}`);
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
      this.logger.error(`Failed to process refund: ${error.message}`);
      throw error;
    }
  }
}
