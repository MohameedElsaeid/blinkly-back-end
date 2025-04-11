import {
  IsString,
  IsUrl,
  IsOptional,
  IsArray,
  IsObject,
  ValidateNested,
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';

class PlatformRule {
  @IsEnum(['ios', 'android', 'web'])
  platform: 'ios' | 'android' | 'web';

  @IsUrl()
  url: string;

  @IsOptional()
  @IsString()
  minimumVersion?: string;

  @IsOptional()
  @IsString()
  packageName?: string;
}

class UtmParameters {
  @IsOptional()
  @IsString()
  source?: string;

  @IsOptional()
  @IsString()
  medium?: string;

  @IsOptional()
  @IsString()
  campaign?: string;

  @IsOptional()
  @IsString()
  term?: string;

  @IsOptional()
  @IsString()
  content?: string;
}

export class CreateDynamicLinkDto {
  @IsString()
  name: string;

  @IsString()
  alias: string;

  @IsUrl()
  defaultUrl: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PlatformRule)
  rules: PlatformRule[];

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => UtmParameters)
  utmParameters?: UtmParameters;

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
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}
