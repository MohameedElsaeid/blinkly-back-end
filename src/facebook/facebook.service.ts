import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto-js';
import { User } from '../entities/user.entity';

export enum FacebookEventName {
  LEAD = 'Lead',
  PURCHASE = 'Purchase',
  START_TRIAL = 'StartTrial',
  COMPLETE_REGISTRATION = 'CompleteRegistration',
  ADD_PAYMENT_INFO = 'AddPaymentInfo',
  INITIATE_CHECKOUT = 'InitiateCheckout',
  FIND_LOCATION = 'FindLocation',
  VIEW_CONTENT = 'ViewContent',
  ADD_TO_CART = 'AddToCart',
  SUBSCRIBE = 'Subscribe',
  CONTACT = 'Contact',
}

interface FacebookEventData {
  event_name: FacebookEventName;
  event_time: number;
  event_source_url?: string;
  event_id?: string;
  user_data: {
    em?: string;
    ph?: string;
    fn?: string;
    ln?: string;
    ge?: string;
    db?: string;
    ct?: string;
    st?: string;
    zp?: string;
    country?: string;
    external_id?: string;
    client_ip_address?: string;
    client_user_agent?: string;
    fbc?: string;
    fbp?: string;
    subscription_id?: string;
  };
  custom_data?: {
    currency?: string;
    value?: number;
    content_name?: string;
    content_category?: string;
    content_ids?: string[];
    content_type?: string;
    contents?: Array<{
      id: string;
      quantity: number;
      item_price?: number;
    }>;
    num_items?: number;
    predicted_ltv?: number;
    status?: string;
    search_string?: string;
    delivery_category?: string;
  };
  action_source: string;
}

@Injectable()
export class FacebookService {
  private readonly logger = new Logger(FacebookService.name);
  private readonly accessToken: string;
  private readonly pixelId: string;
  private readonly testEventCode?: string;
  private readonly isProduction: boolean;

  constructor(private readonly configService: ConfigService) {
    this.accessToken = process.env.FACEBOOK_ACCESS_TOKEN || '';
    this.pixelId = process.env.FACEBOOK_PIXEL_ID || '';
    this.testEventCode = process.env.FACEBOOK_TEST_EVENT_CODE;
    this.isProduction = process.env.NODE_ENV === 'production';
  }

  private hashData(data: string): string {
    return crypto.SHA256(data.trim().toLowerCase()).toString();
  }

  private async sendEvent(eventData: FacebookEventData): Promise<void> {
    if (!this.isProduction) {
      this.logger.debug(
        'Skipping Facebook event in non-production environment',
      );
      return;
    }

    try {
      const url = `https://graph.facebook.com/v19.0/${this.pixelId}/events`;
      const body = {
        data: [eventData],
        access_token: this.accessToken,
        ...(this.testEventCode && { test_event_code: this.testEventCode }),
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error(`Facebook API error: ${response.statusText}`);
      }

      this.logger.log(
        `Facebook event ${eventData.event_name} sent successfully`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to send Facebook event: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  private getUserData(user: User, headers: Record<string, any>): any {
    const userData: any = {};

    if (user.email) userData.em = this.hashData(user.email);
    if (user.phoneNumber) userData.ph = this.hashData(user.phoneNumber);
    if (user.firstName) userData.fn = this.hashData(user.firstName);
    if (user.lastName) userData.ln = this.hashData(user.lastName);
    if (user.dateOfBirth)
      userData.db = this.hashData(user.dateOfBirth.toISOString().split('T')[0]);
    if (user.city) userData.ct = this.hashData(user.city);
    if (user.postalCode) userData.zp = this.hashData(user.postalCode);
    if (user.id) userData.external_id = this.hashData(user.id);

    // Non-hashed data
    userData.client_ip_address =
      headers['cf-connecting-ip'] || headers['x-forwarded-for'];
    userData.client_user_agent = headers['user-agent'];
    userData.fbc = headers['x-fb-click-id'];
    userData.fbp = headers['x-fb-browser-id'];

    return userData;
  }

  async trackLead(
    user: User,
    headers: Record<string, any>,
    data?: any,
  ): Promise<void> {
    const eventData: FacebookEventData = {
      event_name: FacebookEventName.LEAD,
      event_time: Math.floor(Date.now() / 1000),
      event_source_url: headers.referer,
      user_data: this.getUserData(user, headers),
      custom_data: data,
      action_source: 'website',
    };

    await this.sendEvent(eventData);
  }

  async trackPurchase(
    user: User,
    headers: Record<string, any>,
    amount: number,
    currency: string,
    items?: Array<{ id: string; quantity: number; price: number }>,
  ): Promise<void> {
    const eventData: FacebookEventData = {
      event_name: FacebookEventName.PURCHASE,
      event_time: Math.floor(Date.now() / 1000),
      event_source_url: headers.referer,
      user_data: this.getUserData(user, headers),
      custom_data: {
        currency,
        value: amount,
        contents: items?.map((item) => ({
          id: item.id,
          quantity: item.quantity,
          item_price: item.price,
        })),
        num_items: items?.reduce((sum, item) => sum + item.quantity, 0),
      },
      action_source: 'website',
    };

    await this.sendEvent(eventData);
  }

  async trackStartTrial(
    user: User,
    headers: Record<string, any>,
    planName: string,
  ): Promise<void> {
    const eventData: FacebookEventData = {
      event_name: FacebookEventName.START_TRIAL,
      event_time: Math.floor(Date.now() / 1000),
      event_source_url: headers.referer,
      user_data: this.getUserData(user, headers),
      custom_data: {
        content_name: planName,
      },
      action_source: 'website',
    };

    await this.sendEvent(eventData);
  }

  async trackCompleteRegistration(
    user: User,
    headers: Record<string, any>,
  ): Promise<void> {
    const eventData: FacebookEventData = {
      event_name: FacebookEventName.COMPLETE_REGISTRATION,
      event_time: Math.floor(Date.now() / 1000),
      event_source_url: headers.referer,
      user_data: this.getUserData(user, headers),
      action_source: 'website',
    };

    await this.sendEvent(eventData);
  }

  async trackAddPaymentInfo(
    user: User,
    headers: Record<string, any>,
  ): Promise<void> {
    const eventData: FacebookEventData = {
      event_name: FacebookEventName.ADD_PAYMENT_INFO,
      event_time: Math.floor(Date.now() / 1000),
      event_source_url: headers.referer,
      user_data: this.getUserData(user, headers),
      action_source: 'website',
    };

    await this.sendEvent(eventData);
  }

  async trackInitiateCheckout(
    user: User,
    headers: Record<string, any>,
    amount: number,
    currency: string,
  ): Promise<void> {
    const eventData: FacebookEventData = {
      event_name: FacebookEventName.INITIATE_CHECKOUT,
      event_time: Math.floor(Date.now() / 1000),
      event_source_url: headers.referer,
      user_data: this.getUserData(user, headers),
      custom_data: {
        currency,
        value: amount,
      },
      action_source: 'website',
    };

    await this.sendEvent(eventData);
  }

  async trackViewContent(
    user: User,
    headers: Record<string, any>,
    contentType: string,
    contentId: string,
  ): Promise<void> {
    const eventData: FacebookEventData = {
      event_name: FacebookEventName.VIEW_CONTENT,
      event_time: Math.floor(Date.now() / 1000),
      event_source_url: headers.referer,
      user_data: this.getUserData(user, headers),
      custom_data: {
        content_type: contentType,
        content_ids: [contentId],
      },
      action_source: 'website',
    };

    await this.sendEvent(eventData);
  }

  async trackAddToCart(
    user: User,
    headers: Record<string, any>,
    items: Array<{ id: string; quantity: number; price: number }>,
    currency: string,
  ): Promise<void> {
    const eventData: FacebookEventData = {
      event_name: FacebookEventName.ADD_TO_CART,
      event_time: Math.floor(Date.now() / 1000),
      event_source_url: headers.referer,
      user_data: this.getUserData(user, headers),
      custom_data: {
        currency,
        value: items.reduce((sum, item) => sum + item.price * item.quantity, 0),
        contents: items.map((item) => ({
          id: item.id,
          quantity: item.quantity,
          item_price: item.price,
        })),
      },
      action_source: 'website',
    };

    await this.sendEvent(eventData);
  }

  async trackSubscribe(
    user: User,
    headers: Record<string, any>,
    planName: string,
    amount: number,
    currency: string,
  ): Promise<void> {
    const eventData: FacebookEventData = {
      event_name: FacebookEventName.SUBSCRIBE,
      event_time: Math.floor(Date.now() / 1000),
      event_source_url: headers.referer,
      user_data: this.getUserData(user, headers),
      custom_data: {
        content_name: planName,
        currency,
        value: amount,
      },
      action_source: 'website',
    };

    await this.sendEvent(eventData);
  }

  async trackContact(
    user: User,
    headers: Record<string, any>,
    method: string,
  ): Promise<void> {
    const eventData: FacebookEventData = {
      event_name: FacebookEventName.CONTACT,
      event_time: Math.floor(Date.now() / 1000),
      event_source_url: headers.referer,
      user_data: this.getUserData(user, headers),
      custom_data: {
        content_category: method,
      },
      action_source: 'website',
    };

    await this.sendEvent(eventData);
  }
}
