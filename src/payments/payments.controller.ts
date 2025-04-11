import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  UseGuards,
  Headers,
  Req,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { StripeService } from './stripe.service';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { ThrottlerGuard } from '@nestjs/throttler';
import { CreatePaymentIntentDto } from './dto/create-payment-intent.dto';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { ProcessRefundDto } from './dto/process-refund.dto';

@Controller('payments')
@UseGuards(JwtAuthGuard, ThrottlerGuard)
export class PaymentsController {
  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly stripeService: StripeService,
  ) {}

  @Post('payment-intent')
  async createPaymentIntent(@Req() req, @Body() dto: CreatePaymentIntentDto) {
    return this.paymentsService.createPaymentIntent(req.user.id, dto);
  }

  @Post('subscriptions')
  async createSubscription(@Req() req, @Body() dto: CreateSubscriptionDto) {
    return this.paymentsService.createSubscription(req.user.id, dto);
  }

  @Delete('subscriptions')
  async cancelSubscription(@Req() req) {
    return this.paymentsService.cancelSubscription(req.user.id);
  }

  @Get('payment-methods')
  async getPaymentMethods(@Req() req) {
    return this.paymentsService.getPaymentMethods(req.user.id);
  }

  @Post('refunds')
  async processRefund(@Req() req, @Body() dto: ProcessRefundDto) {
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
    @Req() request,
  ) {
    const payload = request.rawBody;
    const event = await this.stripeService.handleWebhookEvent(
      signature,
      payload,
    );

    // Handle different event types
    switch (event.type) {
      case 'payment_intent.succeeded':
        // Handle successful payment
        break;
      case 'payment_intent.payment_failed':
        // Handle failed payment
        break;
      case 'customer.subscription.deleted':
        // Handle subscription cancellation
        break;
      case 'invoice.payment_succeeded':
        // Handle successful subscription payment
        break;
      case 'invoice.payment_failed':
        // Handle failed subscription payment
        break;
    }

    return { received: true };
  }
}
