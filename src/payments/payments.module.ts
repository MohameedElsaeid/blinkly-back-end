import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { User } from '../entities/user.entity';
import { UserSubscription } from '../entities/user-subscription.entity';
import { Plan } from '../entities/plan.entity';
import { StripeService } from './stripe.service';
import { FacebookModule } from '../facebook/facebook.module';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([User, UserSubscription, Plan]),
    FacebookModule,
  ],
  controllers: [PaymentsController],
  providers: [PaymentsService, StripeService],
  exports: [PaymentsService, StripeService],
})
export class PaymentsModule {}
