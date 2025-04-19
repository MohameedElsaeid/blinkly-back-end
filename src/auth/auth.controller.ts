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
import { HeaderData } from '../interfaces/headers.interface';
import { SignupService } from './services/signup.service';
import { HeaderTransformPipe } from '../pipes/header‑transform.pipe';

@ApiTags('Auth')
@UseGuards(ThrottlerGuard)
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly signupService: SignupService,
    private readonly headerTransform: HeaderTransformPipe,
  ) {}

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
    @Headers() raw: Record<string, string>,
    @Body() signUpDto: SignUpDto,
  ): Promise<IAuthResponse> {
    const headers = this.headerTransform.transform(raw);
    return this.signupService.signUp(signUpDto, headers);
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
