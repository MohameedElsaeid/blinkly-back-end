import {
  Body,
  Controller,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { SignUpDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { VerifyPhoneDto } from './dto/verify-phone.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { IAuthResponse } from './interfaces/auth.interface';

@ApiTags('Auth')
@UseGuards(ThrottlerGuard)
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Sign up a new user' })
  @ApiBody({ type: SignUpDto })
  @ApiResponse({
    status: 201,
    description: 'User successfully registered',
    type: Object,
  })
  async signUp(
    @Headers() headers: Record<string, string>,
    @Body() signUpDto: SignUpDto,
  ): Promise<IAuthResponse> {
    return this.authService.signUp(signUpDto, {
      deviceId: headers['x-device-id'],
      userAgent: headers['user-agent'],
      platform: headers['x-platform'],
      screenWidth: parseInt(headers['x-screen-width'] || '0', 10),
      screenHeight: parseInt(headers['x-screen-height'] || '0', 10),
      colorDepth: headers['x-color-depth'],
      deviceMemory: headers['x-device-memory'],
      hardwareConcurrency: headers['x-hardware-concurrency'],
      timeZone: headers['x-time-zone'],
      acceptEncoding: headers['accept-encoding'],
      acceptLanguage: headers['accept-language'],
      origin: headers['origin'],
      referer: headers['referer'],
      secChUa: headers['sec-ch-ua'],
      secChUaMobile: headers['sec-ch-ua-mobile'],
      secChUaPlatform: headers['sec-ch-ua-platform'],
      secFetchDest: headers['sec-fetch-dest'],
      secFetchMode: headers['sec-fetch-mode'],
      secFetchSite: headers['sec-fetch-site'],
      dnt: headers['dnt'],
      cfConnectingIp: headers['cf-connecting-ip'],
      cfCountry: headers['cf-country'],
      cfRay: headers['cf-ray'],
      cfVisitor: headers['cf-visitor'],
    });
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Log in an existing user' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({
    status: 200,
    description: 'User logged in successfully',
    type: Object,
  })
  async login(@Body() loginDto: LoginDto): Promise<IAuthResponse> {
    return this.authService.login(loginDto);
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Initiate forgot password flow' })
  @ApiBody({ type: ForgotPasswordDto })
  @ApiResponse({
    status: 200,
    description: 'Password reset link sent to user email',
    type: Object,
  })
  async forgotPassword(
    @Body() forgotPasswordDto: ForgotPasswordDto,
  ): Promise<IAuthResponse> {
    return this.authService.forgotPassword(forgotPasswordDto);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset password using a valid token' })
  @ApiBody({ type: ResetPasswordDto })
  @ApiResponse({
    status: 200,
    description: 'Password successfully reset',
    type: Object,
  })
  async resetPassword(
    @Body() resetPasswordDto: ResetPasswordDto,
  ): Promise<IAuthResponse> {
    return this.authService.resetPassword(resetPasswordDto);
  }

  @Post('verify-phone')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify user phone number via SMS code' })
  @ApiBody({ type: VerifyPhoneDto })
  @ApiResponse({
    status: 200,
    description: 'Phone number verified successfully',
    type: Object,
  })
  async verifyPhone(
    @Body() verifyPhoneDto: VerifyPhoneDto,
  ): Promise<IAuthResponse> {
    return this.authService.verifyPhone(verifyPhoneDto);
  }

  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify user email using a token' })
  @ApiBody({ type: VerifyEmailDto })
  @ApiResponse({
    status: 200,
    description: 'Email verified successfully',
    type: Object,
  })
  async verifyEmail(
    @Body() verifyEmailDto: VerifyEmailDto,
  ): Promise<IAuthResponse> {
    return this.authService.verifyEmail(verifyEmailDto);
  }
}
