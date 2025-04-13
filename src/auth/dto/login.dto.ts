import { IsEmail, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class LoginDto {
  @ApiProperty({
    example: 'user@example.com',
    description: 'The email address of the user trying to log in',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: 'P@ssw0rd!',
    description: 'The user password, which must be at least 8 characters long',
  })
  @IsString()
  @MinLength(8)
  @Transform(({ value }) => value.trim())
  password: string;
}
