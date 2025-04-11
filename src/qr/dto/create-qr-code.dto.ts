import {
  IsString,
  IsNumber,
  IsOptional,
  IsUUID,
  IsHexColor,
  IsUrl,
  Min,
  Max,
} from 'class-validator';

export class CreateQrCodeDto {
  @IsString()
  @IsUrl()
  targetUrl: string;

  @IsOptional()
  @IsUUID()
  linkId?: string;

  @IsOptional()
  @IsNumber()
  @Min(100)
  @Max(2000)
  size?: number;

  @IsOptional()
  @IsHexColor()
  color?: string;

  @IsOptional()
  @IsHexColor()
  backgroundColor?: string;

  @IsOptional()
  @IsUrl()
  logoUrl?: string;
}
