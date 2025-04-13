import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VerifyEmailDto {
  @ApiProperty({
    example: 'abc123-verification-token',
    description:
      'The email verification token sent to the user’s email address',
  })
  @IsString()
  token: string;
}
