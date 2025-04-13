import { IsDate, IsOptional, IsString, Length, Matches } from 'class-validator';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @Length(2, 50)
  @Matches(/^[a-zA-Z\s\-']+$/)
  firstName?: string;

  @IsOptional()
  @IsString()
  @Length(2, 50)
  @Matches(/^[a-zA-Z\s\-']+$/)
  lastName?: string;

  @IsOptional()
  @IsString()
  @Length(0, 255)
  address?: string;

  @IsOptional()
  @IsString()
  @Length(0, 100)
  city?: string;

  @IsOptional()
  @IsString()
  @Length(0, 20)
  postalCode?: string;

  @IsOptional()
  @IsString()
  @Length(0, 255)
  profilePicture?: string;

  @IsOptional()
  @IsString()
  @Length(0, 500)
  bio?: string;

  @IsOptional()
  @IsString()
  @Length(2, 10)
  preferredLanguage?: string;

  @IsOptional()
  @IsString()
  timezone?: string;

  @IsOptional()
  @IsDate()
  dateOfBirth?: Date;
}
