import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { QrCodeService } from './qr.service';
import { CreateQrCodeDto } from './dto/create-qr-code.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ThrottlerGuard } from '@nestjs/throttler';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UserRole } from '../entities/user.entity';

@Controller('qr')
@UseGuards(JwtAuthGuard, ThrottlerGuard, RolesGuard)
export class QrController {
  constructor(private readonly qrCodeService: QrCodeService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Req() req, @Body() createQrCodeDto: CreateQrCodeDto) {
    return this.qrCodeService.createQrCode(req.user.id, createQrCodeDto);
  }

  @Get()
  async findAll(@Req() req) {
    return this.qrCodeService.findAll(req.user.id);
  }

  @Get(':id')
  async findOne(@Req() req, @Param('id') id: string) {
    return this.qrCodeService.findOne(req.user.id, id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Req() req, @Param('id') id: string) {
    await this.qrCodeService.remove(req.user.id, id);
  }

  @Get('admin/stats')
  @Roles(UserRole.ADMIN)
  async getAdminStats() {
    // Admin-only endpoint for QR code statistics
    return {
      message: 'Admin access only',
    };
  }
}
