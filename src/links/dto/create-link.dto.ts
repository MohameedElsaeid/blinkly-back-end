import {
  IsArray,
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  IsUrl,
  ValidateIf,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RedirectType } from '../../entities/link.entity';

export class CreateLinkDto {
  @ApiProperty({
    example: 'https://example.com/landing-page',
    description: 'The original (destination) URL to shorten',
  })
  @IsUrl()
  originalUrl: string | undefined;

  @ApiPropertyOptional({
    example: 'promo-link',
    description: 'Optional custom alias for the short link',
  })
  @IsOptional()
  @IsString()
  alias?: string;

  @ApiPropertyOptional({
    example: ['campaign', 'sale'],
    description: 'Tags used for filtering and grouping links',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({
    enum: RedirectType,
    example: RedirectType.PERMANENT,
    description: 'HTTP redirect type (301 for permanent, 302 for temporary)',
  })
  @IsOptional()
  @IsEnum(RedirectType)
  redirectType?: RedirectType;

  @ApiPropertyOptional({
    example: '2025-12-31T23:59:59.000Z',
    description: 'Expiration date and time for the short link',
  })
  @IsOptional()
  @ValidateIf((o) => o.expiresAt !== '')
  @IsDateString()
  expiresAt?: string;

  @ApiPropertyOptional({
    example: 'Big Sale!',
    description: 'Meta title for link previews (e.g., social media)',
  })
  @IsOptional()
  @IsString()
  metaTitle?: string;

  @ApiPropertyOptional({
    example: 'Check out our biggest sale of the year.',
    description: 'Meta description for link previews',
  })
  @IsOptional()
  @IsString()
  metaDescription?: string;

  @ApiPropertyOptional({
    example: 'https://example.com/banner.jpg',
    description: 'Meta image URL for social media previews',
  })
  @IsOptional()
  @ValidateIf((o) => o.metaImage !== '')
  @IsUrl()
  metaImage?: string;

  @ApiPropertyOptional({
    example: 'Internal tracking link for ad campaign #X',
    description: 'Optional internal description for this link',
  })
  @IsOptional()
  @IsString()
  description?: string;
}
