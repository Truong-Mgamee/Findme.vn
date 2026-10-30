/** Helpers for POST /v1/ai/ask (not in the OpenAPI document yet — see README "API gaps"). */
import type { PaywallBody } from '@findme/api-client';
import { isPaywall } from '@findme/api-client';
export { apiUrl, authHeaders } from './api';

export interface AskRequest {
  question: string;
  readingId?: string;
  payWith?: 'credit';
}
export interface AskResponse {
  text: string;
  quotaLeft: number;
}

export function isPaywallBody(b: unknown): b is PaywallBody {
  return isPaywall(b);
}
