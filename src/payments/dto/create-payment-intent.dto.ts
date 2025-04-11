import { IsNumber, IsString, IsIn, Min } from 'class-validator';

export class CreatePaymentIntentDto {
  @IsNumber()
  @Min(1)
  amount: number;

  @IsString()
  @IsIn(['usd', 'eur', 'gbp'])
  currency: string;
}
