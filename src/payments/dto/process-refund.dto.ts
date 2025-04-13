import { IsString, IsNumber, IsOptional, Min } from 'class-validator';

export class ProcessRefundDto {
  @IsString()
  paymentIntentId: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  amount?: number;
}
