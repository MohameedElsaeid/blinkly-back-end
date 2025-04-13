import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ThrottlerGuard } from '@nestjs/throttler';
import { UpdateUserDto } from './dto/update-user.dto';
import { IAuthenticatedRequest } from '../interfaces/request.interface';
import { User } from '../entities/user.entity';

@Controller('users')
@UseGuards(JwtAuthGuard, ThrottlerGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('profile')
  async getProfile(@Req() req: IAuthenticatedRequest): Promise<User> {
    return this.usersService.getProfile(req.user.id);
  }

  @Put('profile')
  @HttpCode(HttpStatus.OK)
  async updateProfile(
    @Req() req: IAuthenticatedRequest,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<User> {
    return this.usersService.updateProfile(req.user.id, updateUserDto);
  }
}
