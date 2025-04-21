import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RedirectController } from './redirect.controller';
import { Link } from '../entities/link.entity';
import { DynamicLink } from '../entities/dynamic-link.entity';
import { RedirectService } from './redirect.service';
import { ClickEvent } from '../entities/click-event.entity';
import { DynamicLinkClickEvent } from '../entities/dynamic-link-click-event.entity';
import { UserDevice } from '../entities/user-device.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Link,
      DynamicLink,
      ClickEvent,
      DynamicLinkClickEvent,
      UserDevice,
    ]),
  ],
  controllers: [RedirectController],
  providers: [RedirectService],
  exports: [RedirectService],
})
export class RedirectModule {}
