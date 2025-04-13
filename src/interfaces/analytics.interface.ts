import { ClickEvent } from '../entities/click-event.entity';

// Interfaces for raw query results to ensure safe property access.
export interface DeviceMetric {
  device: string;
  count: string;
}

export interface BrowserMetric {
  browser: string;
  count: string;
}

export interface CountryMetric {
  country: string;
  count: string;
}

export interface IClickData {
  ipAddress: string;
  userAgent: string;
  referrer?: string;
  country?: string;
  state?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  sessionId?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmTerm?: string;
  utmContent?: string;
}

export interface IAnalyticsOverview {
  totalClicks: number;
  standardClicks: number;
  dynamicClicks: number;
  recentClicks?: ClickEvent[];
}

export interface IClicksByMetric {
  [key: string]: number;
}

export interface ILinkAnalytics {
  totalClicks: number;
  events: ClickEvent[];
}

export interface IDateRangeAnalytics extends ILinkAnalytics {
  clicksByDate: { [key: string]: number };
}
