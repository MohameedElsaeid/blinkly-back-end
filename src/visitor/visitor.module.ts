import { MiddlewareConsumer, Module, RequestMethod } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Visit } from '../entities/visit.entity';
import { VisitorService } from './visitor.service';
import { VisitorMiddleware } from '../middleware/visitor.middleware';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Module({
  imports: [
    TypeOrmModule.forFeature([Visit]),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '1d' },
      }),
    }),
  ],
  providers: [VisitorService],
  exports: [VisitorService],
})
export class VisitorModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(VisitorMiddleware)
      .forRoutes({ path: '*', method: RequestMethod.ALL });
  }
}
