import {
  IsEmail,
  IsISO31661Alpha2,
  IsNotEmpty,
  IsPhoneNumber,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Match } from '../decorators/match.decorator';
import { ApiProperty } from '@nestjs/swagger';

export class SignUpDto {
  @ApiProperty({
    example: 'user@example.com',
    description: 'Email must be a valid email address.',
  })
  @IsNotEmpty({ message: 'Email is required' })
  @IsEmail(
    {
      allow_display_name: false,
      require_tld: true,
      allow_utf8_local_part: false,
      allow_ip_domain: false,
    },
    {
      message: 'Email must be a valid email address',
    },
  )
  @MaxLength(255, { message: 'Email must not exceed 255 characters' })
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9])[A-Za-z\d\S]{8,}$/,
    {
      message:
        'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
    },
  )
  email: string;

  @ApiProperty({
    example: 'Secret@123',
    description:
      'Password must be 8-32 characters long, containing at least one uppercase letter, one lowercase letter, one number, and one special character.',
  })
  @IsNotEmpty({ message: 'Password is required' })
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  @MaxLength(32, { message: 'Password must not exceed 32 characters' })
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9])[A-Za-z\d\S]{8,}$/,
    {
      message:
        'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
    },
  )
  password: string;

  @ApiProperty({
    example: 'Secret@123',
    description: 'Password confirmation must match the provided password.',
  })
  @IsNotEmpty({ message: 'Password confirmation is required' })
  @Match('password', {
    message: 'Password confirmation does not match password',
  })
  passwordConfirmation: string;

  @ApiProperty({
    example: 'John',
    description: 'The first name of the user.',
  })
  @IsNotEmpty({ message: 'First name is required' })
  @IsString()
  @MinLength(2, { message: 'First name must be at least 2 characters' })
  @MaxLength(50, { message: 'First name must not exceed 50 characters' })
  @Matches(/^[a-zA-Z\s\-']+$/, {
    message:
      'First name can only contain letters, spaces, hyphens, and apostrophes',
  })
  firstName: string;

  @ApiProperty({
    example: 'Doe',
    description: 'The last name of the user.',
  })
  @IsNotEmpty({ message: 'Last name is required' })
  @IsString()
  @MinLength(2, { message: 'Last name must be at least 2 characters' })
  @MaxLength(50, { message: 'Last name must not exceed 50 characters' })
  @Matches(/^[a-zA-Z\s\-']+$/, {
    message:
      'Last name can only contain letters, spaces, hyphens, and apostrophes',
  })
  lastName: string;

  @ApiProperty({
    example: '+1',
    description:
      'Country code must start with + and contain 1-3 digits (e.g., +1, +44, +971).',
  })
  @IsNotEmpty({ message: 'Country code is required' })
  @IsString()
  @Matches(/^\+[1-9]\d{0,2}$/, {
    message:
      'Country code must start with + and contain 1-3 digits (e.g., +1, +44, +971)',
  })
  countryCode: string;

  @ApiProperty({
    example: '+14155552671',
    description: 'Phone number must be a valid international phone number.',
  })
  @IsNotEmpty({ message: 'Phone number is required' })
  @IsPhoneNumber(undefined, {
    message: 'Phone number must be a valid international phone number',
  })
  phoneNumber: string;

  @ApiProperty({
    example: 'US',
    description: 'Country must be a valid ISO 3166-1 alpha-2 code.',
  })
  @IsNotEmpty({ message: 'Country is required' })
  @IsISO31661Alpha2({
    message: 'Country must be a valid ISO 3166-1 alpha-2 code',
  })
  country: string;
}
