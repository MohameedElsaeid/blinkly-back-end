// src/auth/csrf.controller.ts
import { Controller, Get, Res } from '@nestjs/common';
import { Response } from 'express';

@Controller('auth')
export class CsrfController {
  @Get('csrf-token')
  getCsrfToken(@Res() res: Response) {
    res.json({
      token: res.locals.csrfToken,
      expiresAt: new Date(Date.now() + 86400000).toISOString(),
    });
  }
}
