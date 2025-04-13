import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QrController } from './qr.controller';
import { QrCodeService } from './qr.service';
import { QrCode } from '../entities/qr-code.entity';
import { User } from '../entities/user.entity';
import { Link } from '../entities/link.entity';

@Module({
  imports: [TypeOrmModule.forFeature([QrCode, User, Link])],
  controllers: [QrController],
  providers: [QrCodeService],
  exports: [QrCodeService],
})
export class QrModule {}
