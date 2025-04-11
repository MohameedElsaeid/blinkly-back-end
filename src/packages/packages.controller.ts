import { Controller, Get, UseGuards } from '@nestjs/common';
import { PackagesService } from './packages.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ThrottlerGuard } from '@nestjs/throttler';

@Controller('packages')
@UseGuards(ThrottlerGuard)
export class PackagesController {
  constructor(private readonly packagesService: PackagesService) {}

  @Get()
  async getAllPackages() {
    return this.packagesService.getAllPackages();
  }

  @Get('features')
  async getPackageFeatures() {
    return this.packagesService.getPackageFeatures();
  }

  @UseGuards(JwtAuthGuard)
  @Get('current')
  getCurrentPackage() {
    return this.packagesService.getCurrentPackage();
  }
}
