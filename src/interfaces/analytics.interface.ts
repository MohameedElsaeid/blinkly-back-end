import { ClickEvent } from '../entities/click-event.entity';

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
  // Cloudflare headers
  cfRay?: string;
  cfVisitor?: string;
  cfDeviceType?: string;
  cfMetroCode?: string;
  cfRegion?: string;
  cfRegionCode?: string;
  cfConnectingIp?: string;
  cfIpCity?: string;
  cfIpContinent?: string;
  cfIpLatitude?: string;
  cfIpLongitude?: string;
  cfIpTimeZone?: string;
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
