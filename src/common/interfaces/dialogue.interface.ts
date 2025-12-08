export interface DialogContext {
  userId: string;
  sessionId: string;
  intent?: string;
  enriched?: boolean;
  routed?: boolean;
  transformed?: boolean;
  metadata?: Record<string, any>;
  [key: string]: any;
}
