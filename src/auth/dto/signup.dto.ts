import {
  IsNotEmpty,
  IsEmail,
  IsString,
  MinLength,
  MaxLength,
  Matches,
  IsPhoneNumber,
  IsISO31661Alpha2,
} from 'class-validator';
import { Match } from '../decorators/match.decorator';

export class SignUpDto {
  @IsNotEmpty({ message: 'Password is required' })
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  @MaxLength(32, { message: 'Password must not exceed 32 characters' })
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/,
    {
      message:
        'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
    },
  )
  password: string;

  @IsNotEmpty({ message: 'Password confirmation is required' })
  @Match('password', {
    message: 'Password confirmation does not match password',
  })
  passwordConfirmation: string;

  @IsNotEmpty({ message: 'First name is required' })
  @IsString()
  @MinLength(2, { message: 'First name must be at least 2 characters' })
  @MaxLength(50, { message: 'First name must not exceed 50 characters' })
  @Matches(/^[a-zA-Z\s\-']+$/, {
    message:
      'First name can only contain letters, spaces, hyphens, and apostrophes',
  })
  firstName: string;

  @IsNotEmpty({ message: 'Last name is required' })
  @IsString()
  @MinLength(2, { message: 'Last name must be at least 2 characters' })
  @MaxLength(50, { message: 'Last name must not exceed 50 characters' })
  @Matches(/^[a-zA-Z\s\-']+$/, {
    message:
      'Last name can only contain letters, spaces, hyphens, and apostrophes',
  })
  lastName: string;

  @IsNotEmpty({ message: 'Country code is required' })
  @IsString()
  @Matches(/^\+[1-9]\d{0,2}$/, {
    message:
      'Country code must start with + and contain 1-3 digits (e.g., +1, +44, +971)',
  })
  countryCode: string;

  @IsNotEmpty({ message: 'Phone number is required' })
  @IsPhoneNumber(undefined, {
    message: 'Phone number must be a valid international phone number',
  })
  phoneNumber: string;

  @IsNotEmpty({ message: 'Country is required' })
  @IsISO31661Alpha2({
    message: 'Country must be a valid ISO 3166-1 alpha-2 code',
  })
  country: string;

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
  @Matches(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, {
    message: 'Email format is invalid',
  })
  email: string;
}
