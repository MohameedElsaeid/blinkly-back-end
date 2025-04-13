import { IsString, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateSubscriptionDto {
  @ApiProperty({
    example: 'b12a9f9e-6e13-4bdf-a13f-b9472fdc2fa1',
    description: 'The UUID of the selected subscription plan',
    format: 'uuid',
  })
  @IsUUID()
  planId: string;

  @ApiProperty({
    example: 'pm_1Nv9P3ABCDxyz45678oG9eW3',
    description: 'The Stripe payment method ID',
  })
  @IsString()
  paymentMethodId: string;
}
