export interface RedirectResponse {
  target: string;
  statusCode: number;
  user?: {
    subscription?: {
      plan: string;
    };
  };
}
