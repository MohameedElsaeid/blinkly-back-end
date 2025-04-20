import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { User } from '../entities/user.entity';
import { PassportModule } from '@nestjs/passport';
import { LocalStrategy } from './strategies/local.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UserSubscription } from '../entities/user-subscription.entity';
import { Plan } from '../entities/plan.entity';
import { VisitorModule } from '../visitor/visitor.module';
import { SignupService } from './services/signup.service';
import { HeaderTransformPipe } from '../pipes/header‑transform.pipe';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Plan, UserSubscription]),
    PassportModule,
    ConfigModule,
    VisitorModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret:
          configService.get<string>('JWT_SECRET') ||
          'pI4JjN2LmnX9b7A3TzcM5qL8C2FdR3Gh',
        signOptions: { expiresIn: '1d' },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    HeaderTransformPipe,
    SignupService,
    AuthService,
    LocalStrategy,
    JwtStrategy,
  ],
  exports: [JwtModule, AuthService],
})
export class AuthModule {}
