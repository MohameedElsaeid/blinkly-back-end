import { IsIn, IsNumber, IsString, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePaymentIntentDto {
  @ApiProperty({
    example: 4999,
    description:
      'The payment amount in the smallest currency unit (e.g., cents)',
    minimum: 1,
  })
  @IsNumber()
  @Min(1)
  amount: number;

  @ApiProperty({
    example: 'usd',
    description: 'The currency for the payment. Must be one of: usd, eur, gbp.',
    enum: ['usd', 'eur', 'gbp'],
  })
  @IsString()
  @IsIn(['usd', 'eur', 'gbp'])
  currency: string;
}
