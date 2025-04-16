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
    // Define monthly plans with updated pricing and features
    const monthlyPlans = [
      {
        name: PlanName.FREE,
        billingFrequency: BillingFrequency.MONTHLY,
        price: 0,
        description: 'Basic link shortening for personal use',
        features: [
          '10 shortened links/month',
          '2 QR codes/month',
          'Community support',
        ].join('\n'),
        shortenedLinksLimit: 10,
        qrCodesLimit: 2,
        freeTrialAvailable: false,
        isMostPopular: false,
      },
      {
        name: PlanName.BASIC,
        billingFrequency: BillingFrequency.MONTHLY,
        price: 900, // $9/mo
        description: 'For creators and small businesses',
        features: [
          '500 shortened links/month',
          '50 QR codes/month',
          'Advanced analytics',
          'Password-protected links',
          'Email support',
        ].join('\n'),
        shortenedLinksLimit: 500,
        qrCodesLimit: 50,
        freeTrialAvailable: true,
        freeTrialDays: 7,
        isMostPopular: false,
      },
      {
        name: PlanName.PROFESSIONAL,
        billingFrequency: BillingFrequency.MONTHLY,
        price: 2900, // $29/mo
        description: 'Advanced features for teams',
        features: [
          '5000 shortened links/month',
          '500 QR codes/month',
          'Advanced analytics',
          'Password-protected links',
          'Custom domains',
          'Team access (Up to 5)',
          'Priority email support',
        ].join('\n'),
        shortenedLinksLimit: 5000,
        qrCodesLimit: 500,
        freeTrialAvailable: true,
        freeTrialDays: 7,
        isMostPopular: true,
      },
      {
        name: PlanName.BUSINESS,
        billingFrequency: BillingFrequency.MONTHLY,
        price: 7900, // $79/mo
        description: 'Complete solution for organizations',
        features: [
          '20000 shortened links/month',
          '2000 QR codes/month',
          'Advanced analytics',
          'Password-protected links',
          'Custom domains',
          'Team access (Up to 20)',
          'Priority + Live Chat support',
        ].join('\n'),
        shortenedLinksLimit: 20000,
        qrCodesLimit: 2000,
        freeTrialAvailable: true,
        freeTrialDays: 7,
        isMostPopular: false,
      },
      {
        name: PlanName.ENTERPRISE,
        billingFrequency: BillingFrequency.MONTHLY,
        price: null,
        description: 'Tailored solutions for large enterprises',
        features: [
          'Unlimited shortened links/month',
          'Unlimited QR codes/month',
          'Advanced analytics',
          'Password-protected links',
          'Custom domains',
          'Team access (Unlimited)',
          '24/7 Dedicated support',
        ].join('\n'),
        shortenedLinksLimit: null,
        qrCodesLimit: null,
        freeTrialAvailable: false,
        isMostPopular: false,
      },
    ];

    // Define yearly plans with updated annual pricing (save ~15%)
    const yearlyPlans = [
      {
        name: PlanName.FREE,
        billingFrequency: BillingFrequency.YEARLY,
        price: 0,
        description: 'Basic link shortening for personal use',
        features: [
          '10 shortened links/month',
          '2 QR codes/month',
          'Community support',
        ].join('\n'),
        shortenedLinksLimit: 10,
        qrCodesLimit: 2,
        freeTrialAvailable: false,
        isMostPopular: false,
      },
      {
        name: PlanName.BASIC,
        billingFrequency: BillingFrequency.YEARLY,
        price: 9000, // $90/yr
        description: 'For creators and small businesses',
        features: [
          '500 shortened links/month',
          '50 QR codes/month',
          'Advanced analytics',
          'Password-protected links',
          'Email support',
        ].join('\n'),
        shortenedLinksLimit: 500,
        qrCodesLimit: 50,
        freeTrialAvailable: true,
        freeTrialDays: 7,
        isMostPopular: false,
      },
      {
        name: PlanName.PROFESSIONAL,
        billingFrequency: BillingFrequency.YEARLY,
        price: 29000, // $290/yr
        description: 'Advanced features for teams',
        features: [
          '5000 shortened links/month',
          '500 QR codes/month',
          'Advanced analytics',
          'Password-protected links',
          'Custom domains',
          'Team access (Up to 5)',
          'Priority email support',
        ].join('\n'),
        shortenedLinksLimit: 5000,
        qrCodesLimit: 500,
        freeTrialAvailable: true,
        freeTrialDays: 7,
        isMostPopular: true,
      },
      {
        name: PlanName.BUSINESS,
        billingFrequency: BillingFrequency.YEARLY,
        price: 79000, // $790/yr
        description: 'Complete solution for organizations',
        features: [
          '20000 shortened links/month',
          '2000 QR codes/month',
          'Advanced analytics',
          'Password-protected links',
          'Custom domains',
          'Team access (Up to 20)',
          'Priority + Live Chat support',
        ].join('\n'),
        shortenedLinksLimit: 20000,
        qrCodesLimit: 2000,
        freeTrialAvailable: true,
        freeTrialDays: 7,
        isMostPopular: false,
      },
      {
        name: PlanName.ENTERPRISE,
        billingFrequency: BillingFrequency.YEARLY,
        price: null,
        description: 'Tailored solutions for large enterprises',
        features: [
          'Unlimited shortened links/month',
          'Unlimited QR codes/month',
          'Advanced analytics',
          'Password-protected links',
          'Custom domains',
          'Team access (Unlimited)',
          '24/7 Dedicated support',
        ].join('\n'),
        shortenedLinksLimit: null,
        qrCodesLimit: null,
        freeTrialAvailable: false,
        isMostPopular: false,
      },
    ];

    const allPlans = [...monthlyPlans, ...yearlyPlans];

    // Upsert plans: if a plan with the same name and billingFrequency exists, update it; otherwise, create it.
    for (const planData of allPlans) {
      const existingPlan = await this.planRepository.findOne({
        where: {
          name: planData.name,
          billingFrequency: planData.billingFrequency,
        },
      });
      if (existingPlan) {
        this.planRepository.merge(existingPlan, planData);
        await this.planRepository.save(existingPlan);
      } else {
        await this.planRepository.save(planData);
      }
    }
    this.logger.log('Plans seeded/updated successfully');
  }
}
