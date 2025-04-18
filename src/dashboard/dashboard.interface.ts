import { Link } from '../entities/link.entity';

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
