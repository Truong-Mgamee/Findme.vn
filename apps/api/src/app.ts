import Fastify, { type FastifyError, type FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { hasZodFastifySchemaValidationErrors, isResponseSerializationError, jsonSchemaTransform, serializerCompiler, validatorCompiler, type ZodTypeProvider } from 'fastify-type-provider-zod';
import { loadConfig, type AppConfig, type Env } from './config.js';
import { createDb, schema, type Db, type DbDriver, type DbHandle } from './db/client.js';
import { AppError } from './lib/errors.js';
import { Metrics } from './lib/metrics.js';
import { createStore, type KvStore } from './lib/store.js';
import localePlugin from './plugins/locale.js';
import authPlugin from './plugins/auth.js';
import { systemRoutes } from './routes/system.js';
import { authRoutes } from './routes/auth.js';
import { meRoutes } from './routes/me.js';
import { profileRoutes } from './routes/profiles.js';
import { almanacPickRoutes, almanacRoutes } from './routes/almanac.js';
import { todayRoutes } from './routes/today.js';
import { readingRoutes } from './routes/readings.js';
import { contentRoutes } from './routes/content.js';
import { entitlementRoutes } from './routes/entitlements.js';
import { webhookRoutes } from './routes/webhooks.js';
import { aiRoutes } from './routes/ai.js';
import { adminRoutes } from './routes/admin.js';
import { billingRoutes } from './routes/billing.js';
import { pushRoutes } from './routes/push.js';

export const API_VERSION = '0.1.0';

declare module 'fastify' {
  interface FastifyInstance {
    config: AppConfig;
    db: Db;
    dbDriver: DbDriver;
    store: KvStore;
    storeKind: 'memory' | 'redis';
    metrics: Metrics;
    apiVersion: string;
    schema: typeof schema;
  }
}

export interface BuildOptions {
  env?: Partial<Record<keyof Env, string | undefined>>;
  /** reuse an existing handle (tests); otherwise created from DATABASE_URL and migrated */
  dbHandle?: DbHandle;
  logger?: boolean;
}

/** Birth data must never reach logs: redact common field names anywhere in the log object. */
const REDACT_PATHS = ['req.headers.authorization', 'req.headers.cookie', 'birth', '*.birth', 'body.birth', '*.body.birth', 'date', '*.date', 'time', '*.time', 'place', '*.place', 'fullName', '*.fullName', 'birthDate', '*.birthDate', 'token', '*.token'];

export async function buildApp(opts: BuildOptions = {}): Promise<FastifyInstance> {
  const config = loadConfig(opts.env);
  const isDev = config.NODE_ENV === 'development';
  const app = Fastify({
    logger:
      opts.logger === false || config.NODE_ENV === 'test'
        ? false
        : { level: config.LOG_LEVEL, redact: { paths: REDACT_PATHS, censor: '[redacted]' }, ...(isDev ? { transport: { target: 'pino-pretty', options: { colorize: true, translateTime: 'HH:MM:ss' } } } : {}) },
    trustProxy: true,
    ajv: { customOptions: { removeAdditional: false } },
  }).withTypeProvider<ZodTypeProvider>();
  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

  for (const g of config.generated) app.log.warn(`${g} not set — generated a random one for this process (tokens/ciphertexts will not survive a restart). Set it in .env.`);

  const dbHandle = opts.dbHandle ?? (await createDb(config.DATABASE_URL));
  if (!opts.dbHandle) await dbHandle.migrate();
  const { store, kind: storeKind } = await createStore(config.REDIS_URL);
  if (dbHandle.driver === 'pglite' && !config.DATABASE_URL?.startsWith('pglite:')) app.log.warn('DATABASE_URL not set — using in-memory PGlite; data is lost on restart.');

  app.decorate('config', config);
  app.decorate('db', dbHandle.db);
  app.decorate('dbDriver', dbHandle.driver);
  app.decorate('store', store);
  app.decorate('storeKind', storeKind);
  app.decorate('metrics', new Metrics());
  app.decorate('apiVersion', API_VERSION);
  app.decorate('schema', schema);
  app.addHook('onClose', async () => {
    await store.close();
    if (!opts.dbHandle) await dbHandle.close();
  });

  await app.register(helmet, { contentSecurityPolicy: false /* JSON API; swagger-ui needs inline scripts */ });
  await app.register(cors, { origin: config.CORS_ORIGIN === '*' ? true : config.CORS_ORIGIN.split(',').map((s) => s.trim()), credentials: true, exposedHeaders: ['x-ratelimit-limit', 'x-ratelimit-remaining'] });
  await app.register(rateLimit, { global: true, max: config.RATE_LIMIT_MAX, timeWindow: '1 minute', keyGenerator: (req) => req.user?.id ?? req.ip });
  await app.register(swagger, {
    openapi: {
      openapi: '3.1.0',
      info: { title: 'Findme API', version: API_VERSION, description: 'Compute-then-explain API: deterministic engines (Zi Wei, Bazi, almanac, numerology, astrology) behind a guest-first REST surface. Headers: `Authorization: Bearer <guest JWT>`, `X-Locale`, `Accept-Language`, `X-Tz`.' },
      servers: [{ url: '/' }],
      tags: [
        { name: 'system' },
        { name: 'auth' },
        { name: 'me' },
        { name: 'profiles' },
        { name: 'engines', description: 'Raw engine output per profile' },
        { name: 'almanac' },
        { name: 'today', description: 'Daily Oracle' },
        { name: 'readings' },
        { name: 'content' },
        { name: 'billing' },
        { name: 'webhooks' },
        { name: 'admin', description: 'Content ops; X-Admin-Token' },
      ],
      components: { securitySchemes: { bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' } } },
    },
    transform: jsonSchemaTransform,
  });
  await app.register(swaggerUi, { routePrefix: '/docs', uiConfig: { docExpansion: 'list', persistAuthorization: true } });

  await app.register(localePlugin);
  await app.register(authPlugin);

  app.addHook('onResponse', async (req, reply) => {
    app.metrics.inc('http_requests_total', { route: req.routeOptions.url ?? req.url, method: req.method, status: reply.statusCode });
  });

  app.setErrorHandler((error: unknown, req, reply) => {
    const err = error as FastifyError & { validation?: unknown };
    if (err instanceof AppError) return reply.code(err.statusCode).send({ error: err.code, message: err.message, ...err.extra });
    if (hasZodFastifySchemaValidationErrors(err)) return reply.code(400).send({ error: 'validation', message: err.message, issues: err.validation });
    if (isResponseSerializationError(err)) {
      req.log.error({ err, route: req.routeOptions.url }, 'response serialization failed');
      return reply.code(500).send({ error: 'serialization', message: 'response did not match schema' });
    }
    const status = typeof err.statusCode === 'number' ? err.statusCode : 500;
    if (status >= 500) req.log.error({ err }, 'unhandled error');
    return reply.code(status).send({ error: err.code ?? (status >= 500 ? 'internal' : 'error'), message: status >= 500 && !isDev ? 'internal error' : err.message });
  });
  app.setNotFoundHandler((req, reply) => reply.code(404).send({ error: 'not_found', message: `route ${req.method} ${req.url} not found` }));

  // liveness alias outside the versioned prefix (load balancers)
  app.get('/healthz', { schema: { hide: true } }, async () => ({ ok: true }));

  await app.register(
    async (v1) => {
      await v1.register(systemRoutes);
      await v1.register(authRoutes);
      await v1.register(meRoutes);
      await v1.register(profileRoutes);
      await v1.register(almanacRoutes);
      await v1.register(almanacPickRoutes);
      await v1.register(todayRoutes);
      await v1.register(readingRoutes);
      await v1.register(aiRoutes);
      await v1.register(adminRoutes);
      await v1.register(billingRoutes);
      await v1.register(pushRoutes);
      await v1.register(contentRoutes);
      await v1.register(entitlementRoutes);
      await v1.register(webhookRoutes);
    },
    { prefix: '/v1' },
  );

  return app;
}
