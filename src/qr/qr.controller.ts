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
  ParseUUIDPipe,
} from '@nestjs/common';
import { QrCodeService } from './qr.service';
import { CreateQrCodeDto } from './dto/create-qr-code.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ThrottlerGuard } from '@nestjs/throttler';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UserRole } from '../entities/user.entity';
import { IAuthenticatedRequest } from '../interfaces/request.interface';
import { QrCode } from '../entities/qr-code.entity';

@Controller('qr')
@UseGuards(JwtAuthGuard, ThrottlerGuard, RolesGuard)
export class QrController {
  constructor(private readonly qrCodeService: QrCodeService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Req() req: IAuthenticatedRequest,
    @Body() createQrCodeDto: CreateQrCodeDto,
  ): Promise<QrCode> {
    return await this.qrCodeService.createQrCode(req.user.id, createQrCodeDto);
  }

  @Get()
  async findAll(@Req() req: IAuthenticatedRequest): Promise<QrCode[]> {
    return await this.qrCodeService.findAll(req.user.id);
  }

  @Get(':id')
  async findOne(
    @Req() req: IAuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<QrCode> {
    return await this.qrCodeService.findOne(req.user.id, id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Req() req: IAuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    await this.qrCodeService.remove(req.user.id, id);
  }

  @Get('admin/stats')
  @Roles(UserRole.ADMIN)
  async getAdminStats(): Promise<{ totalQrCodes: number }> {
    return {
      totalQrCodes: 0, // Implement actual stats
    };
  }
}
