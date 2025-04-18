import { Controller, Get, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';
import {
  IDashboardTip,
  ITopLink,
  ITotalClicksResponse,
} from './dashboard.interface';

@Controller('dashboard')
@UseGuards(JwtAuthGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('total-clicks')
  async getTotalClicks(
    @GetUser('id') userId: string,
  ): Promise<ITotalClicksResponse> {
    return this.dashboardService.getTotalClicks(userId);
  }

  @Get('top-links')
  async getTopLinks(
    @GetUser('id') userId: string,
  ): Promise<{ links: ITopLink[] }> {
    const links = await this.dashboardService.getTopLinks(userId);
    return { links };
  }

  @Get('tips')
  getDashboardTips(): { tips: IDashboardTip[] } {
    return { tips: this.dashboardService.getDashboardTips() };
  }

  @Get('tricks')
  getDashboardTricks(): { tricks: string[] } {
    return { tricks: this.dashboardService.getDashboardTricks() };
  }
}
