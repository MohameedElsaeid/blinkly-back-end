//csrf.controller.ts
import { Controller, Get, Req, Res } from '@nestjs/common';
import { Request, Response } from 'express';
import { CsrfService } from './csrf.service';

@Controller('auth')
export class CsrfController {
  constructor(private readonly csrfService: CsrfService) {}

  @Get('csrf-token')
  getCsrfToken(@Req() req: Request, @Res() res: Response) {
    // Clear existing cookies to prevent conflicts
    const cookieName =
      process.env.NODE_ENV === 'production'
        ? '__Host-psifi.x-csrf-token'
        : 'psifi.x-csrf-token';

    res.clearCookie(cookieName);
    res.clearCookie('XSRF-TOKEN');

    // Generate new token
    const token = this.csrfService.generateToken(req, res);

    if (!token) {
      return res
        .status(403)
        .json({ statusCode: 403, message: 'invalid csrf token' });
    }

    // Set XSRF-TOKEN cookie (client-readable)
    res.cookie('XSRF-TOKEN', token, {
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      httpOnly: false,
      path: '/',
      domain:
        process.env.NODE_ENV === 'production' ? '.blinkly.app' : undefined, // Match backend cookie
    });

    return res.json({ token, expiresAt: new Date(Date.now() + 86400000) });
  }
}
