import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { resolvePayment, type Feature, type PaymentDecision } from '../services/entitlements.js';
import { currentUser } from './auth.js';

declare module 'fastify' {
  interface FastifyRequest {
    /** set by requireEntitlement(): how this request is being paid for */
    payment: PaymentDecision | null;
  }
}

/**
 * preHandler factory. Resolves subscription / credits / free-first for `feature` and stores the
 * decision on `req.payment`; throws PaywallError (402 `{reason, paywall:true}`) otherwise.
 * Credits are only *debited* by the handler, inside the transaction that persists the result.
 */
export function requireEntitlement(app: FastifyInstance, feature: Feature, opts: { allowFreeFirst?: boolean } = {}) {
  return async (req: FastifyRequest, _reply: FastifyReply) => {
    const user = currentUser(req);
    const body = (req.body ?? {}) as { payWith?: string };
    const payWith = body.payWith === 'credit' ? 'credit' : undefined;
    req.payment = await resolvePayment(app.db, user.id, feature, { payWith, allowFreeFirst: opts.allowFreeFirst });
  };
}
