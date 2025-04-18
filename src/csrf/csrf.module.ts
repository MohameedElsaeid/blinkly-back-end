//csrf.module.ts
import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { CsrfService } from './csrf.service';
import { CsrfController } from './csrf.controller';

@Module({
  controllers: [CsrfController],
  providers: [CsrfService],
  exports: [CsrfService],
})
export class CsrfModule implements NestModule {
  constructor(private readonly csrfService: CsrfService) {}

  configure(consumer: MiddlewareConsumer) {
    // 1. Apply CSRF protection to all routes EXCEPT /auth/csrf-token
    consumer
      .apply(this.csrfService.doubleCsrfProtection())
      .exclude({ path: '/auth/csrf-token', method: RequestMethod.GET })
      .forRoutes('*');

    // 2. Generate new token for /auth/csrf-token AFTER protection is set up
    consumer
      .apply((req, res, next) => {
        this.csrfService.generateToken(req, res);
        next();
      })
      .forRoutes({ path: '/auth/csrf-token', method: RequestMethod.GET });
  }
}
