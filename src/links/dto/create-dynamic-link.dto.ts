import {
  IsArray,
  IsEnum,
  IsObject,
  IsOptional,
  IsString,
  IsUrl,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class PlatformRule {
  @ApiProperty({
    enum: ['ios', 'android', 'web'],
    description: 'Target platform',
  })
  @IsEnum(['ios', 'android', 'web'])
  platform: 'ios' | 'android' | 'web';

  @ApiProperty({
    example: 'https://example.com/app',
    description: 'URL for this platform',
  })
  @IsUrl()
  url: string;

  @ApiPropertyOptional({
    example: '1.2.3',
    description: 'Minimum required app version (optional)',
  })
  @IsOptional()
  @IsString()
  minimumVersion?: string;

  @ApiPropertyOptional({
    example: 'com.example.app',
    description: 'Package name (optional)',
  })
  @IsOptional()
  @IsString()
  packageName?: string;
}

class UtmParameters {
  @ApiPropertyOptional({
    example: 'google',
    description: 'UTM source (e.g., google, facebook)',
  })
  @IsOptional()
  @IsString()
  source?: string;

  @ApiPropertyOptional({
    example: 'cpc',
    description: 'UTM medium (e.g., banner, email)',
  })
  @IsOptional()
  @IsString()
  medium?: string;

  @ApiPropertyOptional({
    example: 'summer-sale',
    description: 'UTM campaign name',
  })
  @IsOptional()
  @IsString()
  campaign?: string;

  @ApiPropertyOptional({
    example: 'shoes',
    description: 'UTM term (for keyword ads)',
  })
  @IsOptional()
  @IsString()
  term?: string;

  @ApiPropertyOptional({
    example: 'discount',
    description: 'UTM content (A/B test label)',
  })
  @IsOptional()
  @IsString()
  content?: string;
}

export class CreateDynamicLinkDto {
  @ApiProperty({
    example: 'Summer Promo Link',
    description: 'Name of the dynamic link',
  })
  @IsString()
  name: string;

  @ApiProperty({
    example: 'summer-promo',
    description: 'Custom alias for the link',
  })
  @IsString()
  alias: string;

  @ApiProperty({
    example: 'https://example.com/fallback',
    description: 'Fallback URL',
  })
  @IsUrl()
  defaultUrl: string;

  @ApiProperty({
    description: 'Platform-specific rules for redirection',
    type: [PlatformRule],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PlatformRule)
  rules: PlatformRule[];

  @ApiPropertyOptional({
    description: 'UTM parameters for tracking',
    type: UtmParameters,
  })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => UtmParameters)
  utmParameters?: UtmParameters;

  @ApiPropertyOptional({
    example: 'Promo Page',
    description: 'Meta title for link preview',
  })
  @IsOptional()
  @IsString()
  metaTitle?: string;

  @ApiPropertyOptional({
    example: 'Check out our summer deals!',
    description: 'Meta description for link preview',
  })
  @IsOptional()
  @IsString()
  metaDescription?: string;

  @ApiPropertyOptional({
    example: 'https://example.com/image.jpg',
    description: 'Meta image URL for link preview',
  })
  @IsOptional()
  @IsUrl()
  metaImage?: string;

  @ApiPropertyOptional({
    example: ['promo', 'summer'],
    description: 'Optional tags to categorize the link',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}
