import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ThrottlerGuard } from '@nestjs/throttler';
import { UpdateUserDto } from './dto/update-user.dto';
import { IAuthenticatedRequest } from '../interfaces/request.interface';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { VerifyPhoneDto } from './dto/verify-phone.dto';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UserProfileResponse } from './interfaces/user-profile.interface';
import { User } from '../entities/user.entity';

@ApiTags('Users')
@Controller('users')
@UseGuards(JwtAuthGuard, ThrottlerGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('profile')
  @ApiOperation({ summary: 'Get user profile' })
  @ApiResponse({ status: 200, description: 'Returns user profile data' })
  async getProfile(
    @Req() req: IAuthenticatedRequest,
  ): Promise<UserProfileResponse> {
    return this.usersService.getProfile(req.user.id);
  }

  @Put('profile')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update user profile' })
  @ApiResponse({ status: 200, description: 'Profile updated successfully' })
  async updateProfile(
    @Req() req: IAuthenticatedRequest,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<
    Omit<User, 'password' | 'role' | 'validatePassword' | 'hashPassword'>
  > {
    return this.usersService.updateProfile(req.user.id, updateUserDto);
  }

  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify user email' })
  @ApiResponse({ status: 200, description: 'Email verified successfully' })
  async verifyEmail(
    @Req() req: IAuthenticatedRequest,
    @Body() verifyEmailDto: VerifyEmailDto,
  ): Promise<
    Omit<User, 'password' | 'role' | 'validatePassword' | 'hashPassword'>
  > {
    return this.usersService.verifyEmail(req.user.id, verifyEmailDto);
  }

  @Post('verify-phone')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify user phone number' })
  @ApiResponse({
    status: 200,
    description: 'Phone number verified successfully',
  })
  async verifyPhone(
    @Req() req: IAuthenticatedRequest,
    @Body() verifyPhoneDto: VerifyPhoneDto,
  ): Promise<
    Omit<User, 'password' | 'role' | 'validatePassword' | 'hashPassword'>
  > {
    return this.usersService.verifyPhone(req.user.id, verifyPhoneDto);
  }
}
