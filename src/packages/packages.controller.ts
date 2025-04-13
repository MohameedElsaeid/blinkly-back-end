import { Controller, Get, UseGuards } from '@nestjs/common';
import { PackagesService } from './packages.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ThrottlerGuard } from '@nestjs/throttler';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

@ApiTags('Packages')
@UseGuards(ThrottlerGuard)
@Controller('packages')
export class PackagesController {
  constructor(private readonly packagesService: PackagesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all available packages' })
  @ApiResponse({ status: 200, description: 'List of all packages' })
  async getAllPackages() {
    return this.packagesService.getAllPackages();
  }

  @Get('features')
  @ApiOperation({ summary: 'Get all available package features' })
  @ApiResponse({ status: 200, description: 'List of all package features' })
  async getPackageFeatures() {
    return this.packagesService.getPackageFeatures();
  }

  @UseGuards(JwtAuthGuard)
  @Get('current')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user package' })
  @ApiResponse({
    status: 200,
    description: 'Details of the current user package',
  })
  getCurrentPackage() {
    return this.packagesService.getCurrentPackage();
  }
}
