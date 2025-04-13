import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { StripeService } from './stripe.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ThrottlerGuard } from '@nestjs/throttler';
import { CreatePaymentIntentDto } from './dto/create-payment-intent.dto';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { ProcessRefundDto } from './dto/process-refund.dto';
import { IAuthenticatedRequest } from '../interfaces/request.interface';

interface WebhookRequest extends Request {
  rawBody: Buffer;
}

@Controller('payments')
@UseGuards(JwtAuthGuard, ThrottlerGuard)
export class PaymentsController {
  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly stripeService: StripeService,
  ) {}

  @Post('payment-intent')
  async createPaymentIntent(
    @Req() req: IAuthenticatedRequest,
    @Body() dto: CreatePaymentIntentDto,
  ) {
    return this.paymentsService.createPaymentIntent(req.user.id, dto);
  }

  @Post('subscriptions')
  async createSubscription(
    @Req() req: IAuthenticatedRequest,
    @Body() dto: CreateSubscriptionDto,
  ) {
    return this.paymentsService.createSubscription(req.user.id, dto);
  }

  @Delete('subscriptions')
  async cancelSubscription(@Req() req: IAuthenticatedRequest) {
    return this.paymentsService.cancelSubscription(req.user.id);
  }

  @Get('payment-methods')
  async getPaymentMethods(@Req() req: IAuthenticatedRequest) {
    return this.paymentsService.getPaymentMethods(req.user.id);
  }

  @Post('refunds')
  async processRefund(
    @Req() req: IAuthenticatedRequest,
    @Body() dto: ProcessRefundDto,
  ) {
    return this.paymentsService.processRefund(
      req.user.id,
      dto.paymentIntentId,
      dto.amount,
    );
  }

  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  async handleWebhook(
    @Headers('stripe-signature') signature: string,
    @Req() request: WebhookRequest,
  ) {
    if (!signature) {
      throw new Error('Missing stripe-signature header');
    }

    const event = this.stripeService.handleWebhookEvent(
      signature,
      request.rawBody,
    );

    // Handle different event types
    switch (event.type) {
      case 'payment_intent.succeeded':
        await this.paymentsService.handleSuccessfulPayment(event.data);
        break;
      // case 'payment_intent.payment_failed':
      //   await this.paymentsService.handleFailedPayment(event.data);
      //   break;
      // case 'customer.subscription.deleted':
      //   await this.paymentsService.handleSubscriptionCancellation(event.data);
      //   break;
      // case 'invoice.payment_succeeded':
      //   await this.paymentsService.handleSuccessfulSubscriptionPayment(
      //     event.data,
      //   );
      //   break;
      // case 'invoice.payment_failed':
      //   await this.paymentsService.handleFailedSubscriptionPayment(event.data);
      //   break;
    }

    return { received: true };
  }
}
