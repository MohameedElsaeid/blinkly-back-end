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
