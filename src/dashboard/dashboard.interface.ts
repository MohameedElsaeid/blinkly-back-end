import { ClickEvent } from '../entities/click-event.entity';

export interface IDashboardTip {
  title: string;
  description: string;
}

export interface ITopLink {
  id: string;
  alias: string;
  originalUrl: string;
  clickCount: number;
}

export interface ITotalClicksResponse {
  totalClicks: number;
  trend: number;
  periodStart: string;
  periodEnd: string;
}

export interface ITopLinksResponse {
  links: ITopLink[];
}

export interface IDashboardTipsResponse {
  tips: IDashboardTip[];
}

export interface IDashboardTricksResponse {
  tricks: string[];
}

export interface LinkAnalytics {
  totalClicks: number;
  uniqueDevices: number;
  clicksByCountry: Record<string, number>;
  clicksByCity: Record<string, number>;
  clicksByBrowser: Record<string, number>;
  clicksByDevice: Record<string, number>;
  clicksByOS: Record<string, number>;
  clicksByDate: Record<string, number>;
  recentClicks: ClickEvent[];
}

export interface DashboardAnalytics {
  clicks_today: {
    count: number;
    change_percentage: number;
  };
  links_24h: {
    count: number;
    change_percentage: number;
  };
  unique_countries_24h: {
    count: number;
    change_percentage: number;
  };
  avg_ctr_7d: {
    percentage: number;
  };
}

export interface DeviceAnalytics {
  total_clicks: number;
  period_start: string;
  period_end: string;
  devices: {
    distribution: Record<string, number>;
    percentages: Record<string, number>;
  };
  browsers: {
    distribution: Record<string, number>;
    percentages: Record<string, number>;
  };
  operating_systems: {
    distribution: Record<string, number>;
    percentages: Record<string, number>;
  };
  browser_versions: {
    distribution: Record<string, number>;
    percentages: Record<string, number>;
  };
  os_versions: {
    distribution: Record<string, number>;
    percentages: Record<string, number>;
  };
  unique_devices: number;
  unique_browsers: number;
  unique_operating_systems: number;
}

export interface GeographicAnalytics {
  total_clicks: number;
  period_start: string;
  period_end: string;
  countries: {
    distribution: Record<string, number>;
    percentages: Record<string, number>;
  };
  cities: {
    distribution: Record<string, number>;
    percentages: Record<string, number>;
  };
  locations: Array<{
    city: string;
    country: string;
    latitude: number;
    longitude: number;
    count: number;
  }>;
  unique_countries: number;
  unique_cities: number;
}

export interface ReferrerAnalytics {
  source: string;
  total_visits: number;
  bounce_rate: number;
  avg_session_duration: number;
  conversion_rate: number;
  total_revenue: number;
  change_percentage: number;
}

export interface TopReferrersResponse {
  data: ReferrerAnalytics[];
  meta: {
    total: number;
    page: number;
    limit: number;
    total_pages: number;
  };
  period: {
    start: string;
    end: string;
  };
}

export interface ClickPerformanceMetrics {
  total_clicks: number;
  unique_visitors: number;
  daily_metrics: Array<{
    date: string;
    clicks: number;
    unique_visitors: number;
  }>;
  period: {
    start: string;
    end: string;
  };
}
