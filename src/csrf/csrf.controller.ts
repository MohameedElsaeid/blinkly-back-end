// src/auth/csrf.controller.ts
import { Controller, Get, Req, Res } from '@nestjs/common';
import { Request, Response } from 'express';
import { doubleCsrf } from 'csrf-csrf';

// Create a doubleCsrf instance with your configuration.
// (In a real project consider extracting these settings into a dedicated service or module.)
const { generateToken } = doubleCsrf({
  getSecret: () =>
    process.env.CSRF_SECRET || 'pI4JjN2LmnX9b7A3TzcM5qL8C2FdR3Gs',
  cookieName: '__Host-psifi.x-csrf-token',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    httpOnly: true,
    path: '/',
    maxAge: 60 * 60 * 24,
    domain: process.env.NODE_ENV === 'production' ? '.blinkly.app' : undefined,
  },
  size: 64,
  ignoredMethods: ['GET', 'HEAD', 'OPTIONS'],
  getTokenFromRequest: (req: Request) => {
    // Look for the token in headers, cookies or in the body
    return (
      req.headers['x-csrf-token'] ||
      req.headers['x-xsrf-token'] ||
      req.cookies['XSRF-TOKEN'] ||
      req.body?.csrfToken
    );
  },
});

@Controller('auth')
export class CsrfController {
  @Get('csrf-token')
  getCsrfToken(@Req() req: Request, @Res() res: Response) {
    // Generate a new CSRF token using the double-csrf helper.
    const token: string = generateToken(req, res);

    // If for some reason the token wasn’t generated, return an error.
    if (!token) {
      return res.status(403).json({
        statusCode: 403,
        message: 'invalid csrf token',
      });
    }

    // Set an expiration 24 hours from now.
    const expiresAt: Date = new Date(Date.now() + 86400000);

    // Set a client-readable cookie for the token.
    res.cookie('XSRF-TOKEN', token, {
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      httpOnly: false, // Allow client JavaScript to read this value.
      expires: expiresAt,
    });

    // Return the token and the expiration time.
    return res.json({
      token,
      expiresAt,
    });
  }
}
