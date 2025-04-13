import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PackagesController } from './packages.controller';
import { PackagesService } from './packages.service';
import { Plan } from '../entities/plan.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Plan])],
  controllers: [PackagesController],
  providers: [PackagesService],
  exports: [PackagesService],
})
export class PackagesModule {}
