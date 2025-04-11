import {
  IsArray,
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  IsUrl,
} from 'class-validator';
import { RedirectType } from '@/entities/link.entity';

export class CreateLinkDto {
  @IsUrl()
  originalUrl: string | undefined;

  @IsOptional()
  @IsString()
  alias?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsEnum(RedirectType)
  redirectType?: RedirectType;

  @IsOptional()
  @IsDateString()
  expiresAt?: Date;

  @IsOptional()
  @IsString()
  metaTitle?: string;

  @IsOptional()
  @IsString()
  metaDescription?: string;

  @IsOptional()
  @IsUrl()
  metaImage?: string;

  @IsOptional()
  @IsString()
  description?: string;
}
