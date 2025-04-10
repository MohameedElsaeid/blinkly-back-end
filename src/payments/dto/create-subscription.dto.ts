import { IsString, IsUUID } from 'class-validator';

export class CreateSubscriptionDto {
  @IsUUID()
  planId: string;

  @IsString()
  paymentMethodId: string;
}
