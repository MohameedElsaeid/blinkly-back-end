import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BillingFrequency, Plan, PlanName } from '../entities/plan.entity';

@Injectable()
export class PackagesService {
  private readonly logger = new Logger(PackagesService.name);

  constructor(
    @InjectRepository(Plan)
    private readonly planRepository: Repository<Plan>,
  ) {
    this.seedPlans().catch((error) => {
      this.logger.error('Failed to seed plans:', error);
    });
  }

  async getAllPackages() {
    return this.planRepository.find({
      order: {
        price: 'ASC',
      },
    });
  }

  async getPackageFeatures() {
    const plans = await this.planRepository.find();
    return plans.map((plan) => ({
      name: plan.name,
      features: plan.features.split('\n'),
      price: plan.price,
      billingFrequency: plan.billingFrequency,
      isMostPopular: plan.isMostPopular,
    }));
  }

  getCurrentPackage() {
    // This will be implemented when user context is available
    return null;
  }

  private async seedPlans() {
    const count = await this.planRepository.count();
    if (count > 0) {
      return;
    }

    const plans = [
      {
        name: PlanName.FREE,
        billingFrequency: BillingFrequency.MONTHLY,
        price: 0,
        description: 'Perfect for personal use',
        features: [
          'Up to 10 short links per month',
          'Basic click tracking',
          'Standard support',
        ].join('\n'),
        shortenedLinksLimit: 10,
        qrCodesLimit: 5,
        freeTrialAvailable: false,
        isMostPopular: false,
      },
      {
        name: PlanName.BASIC,
        billingFrequency: BillingFrequency.MONTHLY,
        price: 999, // $9.99
        description: 'Great for professionals',
        features: [
          'Up to 100 short links per month',
          'Basic analytics',
          'Custom QR codes',
          'Priority support',
        ].join('\n'),
        shortenedLinksLimit: 100,
        qrCodesLimit: 50,
        freeTrialAvailable: true,
        freeTrialDays: 14,
        isMostPopular: true,
      },
      {
        name: PlanName.PROFESSIONAL,
        billingFrequency: BillingFrequency.MONTHLY,
        price: 2999, // $29.99
        description: 'Perfect for growing businesses',
        features: [
          'Up to 1000 short links per month',
          'Advanced analytics',
          'Custom domains',
          'API access',
          'Premium support',
        ].join('\n'),
        shortenedLinksLimit: 1000,
        qrCodesLimit: 500,
        freeTrialAvailable: true,
        freeTrialDays: 14,
        isMostPopular: false,
      },
      {
        name: PlanName.BUSINESS,
        billingFrequency: BillingFrequency.MONTHLY,
        price: 9999, // $99.99
        description: 'For large organizations',
        features: [
          'Unlimited short links',
          'Enterprise analytics',
          'Multiple custom domains',
          'Advanced API access',
          'Dedicated support',
          'SLA guarantee',
        ].join('\n'),
        shortenedLinksLimit: null,
        qrCodesLimit: null,
        freeTrialAvailable: true,
        freeTrialDays: 30,
        isMostPopular: false,
      },
    ];

    await this.planRepository.save(plans);
    this.logger.log('Plans seeded successfully');
  }
}
