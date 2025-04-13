import { IsNotEmpty, IsPhoneNumber, IsString, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VerifyPhoneDto {
  @ApiProperty({
    example: '123456',
    description: '6-digit verification code sent via SMS',
    minLength: 6,
    maxLength: 6,
  })
  @IsString()
  @Length(6, 6)
  code: string;

  @ApiProperty({
    example: '+14155552671',
    description: 'Phone number to verify. Must be in international format.',
  })
  @IsNotEmpty({ message: 'Phone number is required' })
  @IsPhoneNumber(undefined, {
    message: 'Phone number must be a valid international phone number',
  })
  phoneNumber: string;
}
