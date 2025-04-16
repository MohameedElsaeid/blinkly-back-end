// src/auth/csrf.controller.ts
import { Controller, Get, Res } from '@nestjs/common';
import { Response } from 'express';

@Controller('auth')
export class CsrfController {
  @Get('csrf-token')
  getCsrfToken(@Res() res: Response) {
    const token: string = res.locals.csrfToken;
    const expiresAt: Date = new Date(Date.now() + 86400000);
    res.cookie('XSRF-TOKEN', token, {
      secure: true,
      sameSite: 'none',
      httpOnly: false,
      expires: expiresAt,
    });
    res.json({
      token,
      expiresAt,
    });
  }
}
