export interface TimeRange {
  startDate: Date;
  endDate: Date;
}

export interface LinkCreationMetrics {
  totalLinks: number;
  newLinksPerDay: Array<{
    date: string;
    count: number;
  }>;
  deletedLinks: number;
  updatedLinks: number;
}

export interface SessionMetrics {
  totalSessions: number;
  averageSessionDuration: number;
  bounceRate: number;
  sessionsPerDay: Array<{
    date: string;
    count: number;
  }>;
}

export interface ConversionMetrics {
  totalConversions: number;
  conversionRate: number;
  conversionsByType: Record<string, number>;
  conversionValue: number;
  conversionsPerDay: Array<{
    date: string;
    count: number;
    value: number;
  }>;
}

export interface CampaignMetrics {
  bySources: Array<{
    source: string;
    clicks: number;
    conversions: number;
    value: number;
  }>;
  byMediums: Array<{
    medium: string;
    clicks: number;
    conversions: number;
    value: number;
  }>;
  byCampaigns: Array<{
    campaign: string;
    clicks: number;
    conversions: number;
    value: number;
  }>;
}

export interface QrCodeMetrics {
  totalScans: number;
  scansByCode: Array<{
    qrCodeId: string;
    name: string;
    scans: number;
  }>;
  scansPerDay: Array<{
    date: string;
    count: number;
  }>;
}

export interface TagMetrics {
  byTag: Array<{
    tag: string;
    clicks: number;
    conversions: number;
  }>;
}

export interface RetentionMetrics {
  dailyActiveUsers: number;
  monthlyActiveUsers: number;
  retentionByWeek: Array<{
    week: string;
    retentionRate: number;
  }>;
}

export interface ErrorMetrics {
  totalErrors: number;
  errorsByType: Record<string, number>;
  averageResponseTime: number;
}

export interface AnalyticsDashboardResponse {
  timeRange: TimeRange;
  linkCreation: LinkCreationMetrics;
  sessions: SessionMetrics;
  conversions: ConversionMetrics;
  campaigns: CampaignMetrics;
  qrCodes: QrCodeMetrics;
  tags: TagMetrics;
  retention: RetentionMetrics;
  errors: ErrorMetrics;
}
