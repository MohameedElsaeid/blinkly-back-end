export interface HeaderData {
  xGeoData?: string;
  cfVisitor?: string;
  queryParams?: string;
  host?: string;
  cfRay?: string;
  xRequestTime?: Date | null; // ISO timestamp string
  xDeviceMemory?: number | null | undefined;
  xRequestId?: string;
  acceptEncoding?: string;
  xPlatform?: string;
  xForwardedProto?: string;
  xLanguage?: string;

  cfVisitorScheme?: string;
  cfIpcountry?: string;

  xHardwareConcurrency?: number | null;

  // flattened geo-data
  country?: string;
  city?: string;
  latitude: number;
  longitude: number;

  xFbClickId?: string;
  xFbBrowserId?: string;
  cfConnectingO2O?: string;

  contentLength?: number | null;
  xForwardedFor?: string;
  xXsrfToken?: string;
  xUserAgent?: string;
  xTimeZone?: string;
  xScreenWidth?: number | null;
  xScreenHeight?: number | null;
  xRequestedWith?: string;
  contentType?: string;
  cfEwVia?: string;
  cdnLoop?: string;
  acceptLanguage?: string;
  accept?: string;
  cacheControl?: string;
  referer?: string;
  userAgent?: string;
  cfConnectingIp?: string;

  deviceId?: string;
  dnt?: string;
  origin?: string;
  priority?: string;
  secChUa?: string;
  secChUaMobile?: string;
  secChUaPlatform?: string;
  secFetchDest?: string;
  secFetchMode?: string;
  secFetchSite?: string;

  xClientFeatures?: string;
  xColorDepth?: number | null;
  xCsrfToken?: string;
  xCustomHeader?: string;
  xDeviceId?: string;
  doConnectingIp?: string;
}
