import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly configService: ConfigService) {
    super({
      // Extract token from the Bearer header.
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      // Use the same secret as in AuthModule:
      secretOrKey:
        configService.get<string>('JWT_SECRET') ||
        'pI4JjN2LmnX9b7A3TzcM5qL8C2FdR3Gh',
    });
  }

  async validate(payload: any) {
    // Optionally add more user validation logic here.
    return { id: payload.sub, email: payload.email };
  }
}
