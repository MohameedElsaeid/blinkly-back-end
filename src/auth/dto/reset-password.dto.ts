import { IsString, Matches, MaxLength, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResetPasswordDto {
  @ApiProperty({
    example: 'd4f5g6h7i8j9-reset-token',
    description: 'The password reset token sent to the user’s email',
  })
  @IsString()
  token: string;

  @ApiProperty({
    example: 'NewP@ssw0rd123',
    description:
      'The new password. Must be 8–32 characters, include at least one uppercase letter, one lowercase letter, and one number or special character.',
  })
  @IsString()
  @MinLength(8)
  @MaxLength(32)
  @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    message:
      'Password must contain at least 1 uppercase letter, 1 lowercase letter, and 1 number or special character',
  })
  newPassword: string;
}
