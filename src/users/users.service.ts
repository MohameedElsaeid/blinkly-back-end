import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async getProfile(userId: string): Promise<User> {
    try {
      const user = await this.userRepository.findOne({
        where: { id: userId },
        relations: ['activeSubscription', 'activeSubscription.plan'],
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      return user;
    } catch (error) {
      this.logger.error(`Failed to get user profile: ${error.message}`);
      throw error;
    }
  }

  async updateProfile(
    userId: string,
    updateUserDto: UpdateUserDto,
  ): Promise<User> {
    try {
      const user = await this.userRepository.findOne({
        where: { id: userId },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      Object.assign(user, updateUserDto);
      return await this.userRepository.save(user);
    } catch (error) {
      this.logger.error(`Failed to update user profile: ${error.message}`);
      throw error;
    }
  }
}
