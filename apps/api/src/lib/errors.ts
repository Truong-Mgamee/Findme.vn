export class AppError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message?: string,
    public extra: Record<string, unknown> = {},
  ) {
    super(message ?? code);
  }
}

export const notFound = (what: string) => new AppError(404, 'not_found', `${what} not found`);
export const badRequest = (code: string, message?: string, extra?: Record<string, unknown>) => new AppError(400, code, message, extra);
export const unauthorized = (message = 'missing or invalid token') => new AppError(401, 'unauthorized', message);
export const forbidden = (message = 'forbidden') => new AppError(403, 'forbidden', message);
export const notImplemented = (what: string) => new AppError(501, 'not_implemented', `${what} is not available yet`);

/** 402 body is always `{ reason, paywall: true, ...extra }` so the clients can route to the paywall. */
export class PaywallError extends AppError {
  constructor(reason: string, extra: Record<string, unknown> = {}) {
    super(402, reason, `payment required: ${reason}`, { paywall: true, ...extra });
  }
}
