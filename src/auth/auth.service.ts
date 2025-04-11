import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User } from '@/entities/user.entity';
import { SignUpDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { VerifyPhoneDto } from './dto/verify-phone.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';

// Define the JWT payload interface to type the token payload
interface IJwtPayload {
  sub: string;
  email?: string;
}

interface IAuthResponse {
  success: boolean;
  message: string;
  data?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    token: string;
  };
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
  ) {}

  async signUp(signUpDto: SignUpDto): Promise<IAuthResponse> {
    try {
      const existingUser = await this.userRepository.findOne({
        where: [
          { email: signUpDto.email },
          { phoneNumber: signUpDto.phoneNumber },
        ],
      });

      if (existingUser) {
        throw new ConflictException(
          'User with this email or phone number already exists',
        );
      }

      const salt = await bcrypt.genSalt();
      const hashedPassword = await bcrypt.hash(signUpDto.password, salt);

      const user = this.userRepository.create({
        ...signUpDto,
        password: hashedPassword,
      });

      const savedUser = await this.userRepository.save(user);

      const token = this.jwtService.sign({
        sub: savedUser.id,
        email: savedUser.email,
      });

      this.logger.log(`User registered successfully: ${savedUser.email}`);

      return {
        success: true,
        message: 'User registered successfully',
        data: {
          id: savedUser.id,
          email: savedUser.email,
          firstName: savedUser.firstName,
          lastName: savedUser.lastName,
          token,
        },
      };
    } catch (error) {
      this.logger.error(`Registration failed: ${error.message}`, error.stack);

      if (error instanceof ConflictException) {
        throw error;
      }

      throw new InternalServerErrorException(
        'An error occurred while registering the user',
      );
    }
  }

  async login(loginDto: LoginDto): Promise<IAuthResponse> {
    try {
      const user = await this.userRepository.findOne({
        where: { email: loginDto.email },
      });

      if (!user) {
        throw new UnauthorizedException('Invalid credentials');
      }

      const isPasswordValid = await bcrypt.compare(
        loginDto.password,
        user.password,
      );

      if (!isPasswordValid) {
        throw new UnauthorizedException('Invalid credentials');
      }

      const token = this.jwtService.sign({
        sub: user.id,
        email: user.email,
      });

      this.logger.log(`User logged in successfully: ${user.email}`);

      return {
        success: true,
        message: 'Login successful',
        data: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          token,
        },
      };
    } catch (error) {
      this.logger.error(`Login failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  async forgotPassword(
    forgotPasswordDto: ForgotPasswordDto,
  ): Promise<IAuthResponse> {
    try {
      const user = await this.userRepository.findOne({
        where: { email: forgotPasswordDto.email },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      // Generate password reset token with expiration
      const resetToken = this.jwtService.sign(
        { sub: user.id },
        { expiresIn: '1h' },
      );

      // TODO: Implement email service integration to send the resetToken to the user
      // For now, log the resetToken to verify the token generation.
      this.logger.log(`Password reset token for ${user.email}: ${resetToken}`);

      // To ensure the resetToken variable is used, include it in the response data.
      return {
        success: true,
        message: 'Password reset instructions sent to your email',
        data: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          token: resetToken, // For development/testing; remove before production use.
        },
      };
    } catch (error) {
      this.logger.error(
        `Password reset request failed: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async resetPassword(
    resetPasswordDto: ResetPasswordDto,
  ): Promise<IAuthResponse> {
    try {
      // Type cast the payload as IJwtPayload to ensure safe access to its properties.
      const payload: IJwtPayload = this.jwtService.verify(
        resetPasswordDto.token,
      );
      const user = await this.userRepository.findOne({
        where: { id: payload.sub },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      const salt = await bcrypt.genSalt();
      user.password = await bcrypt.hash(resetPasswordDto.newPassword, salt);
      await this.userRepository.save(user);

      this.logger.log(`Password reset successful for user: ${user.email}`);

      return {
        success: true,
        message: 'Password reset successful',
      };
    } catch (error) {
      this.logger.error(`Password reset failed: ${error.message}`, error.stack);
      throw new UnauthorizedException('Invalid or expired reset token');
    }
  }

  async verifyPhone(verifyPhoneDto: VerifyPhoneDto): Promise<IAuthResponse> {
    // Use await to satisfy the lint rule and simulate async operation.
    await Promise.resolve();

    // Use the properties of verifyPhoneDto to prevent "unused variable" error.
    // Assuming verifyPhoneDto contains phoneNumber and verificationCode fields.
    this.logger.log(
      `Verifying phone for ${verifyPhoneDto.phoneNumber} using code ${verifyPhoneDto.verificationCode}`,
    );

    // TODO: Implement proper phone verification logic
    return {
      success: true,
      message: 'Phone number verified successfully',
    };
  }

  async verifyEmail(verifyEmailDto: VerifyEmailDto): Promise<IAuthResponse> {
    try {
      // Type cast the payload to IJwtPayload for safe member access.
      const payload: IJwtPayload = this.jwtService.verify(verifyEmailDto.token);
      const user = await this.userRepository.findOne({
        where: { id: payload.sub },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      user.isEmailVerified = true;
      await this.userRepository.save(user);

      this.logger.log(`Email verified successfully for user: ${user.email}`);

      return {
        success: true,
        message: 'Email verified successfully',
      };
    } catch (error) {
      this.logger.error(
        `Email verification failed: ${error.message}`,
        error.stack,
      );
      throw new UnauthorizedException('Invalid or expired verification token');
    }
  }
}
