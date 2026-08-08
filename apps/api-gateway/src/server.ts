import * as http from 'http';
import * as fs from 'fs';
import * as path from 'path';
import { Env, getEnv } from './config';
import { OpenRouterService } from './ai/services/openrouter.service';
import { RagService } from './ai/services/rag.service';
import { LeadDetectorService } from './ai/services/lead-detector.service';
import { ChatService } from './chat/chat.service';
import { LeadsService } from './leads/leads.service';
import { AdminService } from './admin/admin.service';
import { AuthService } from './auth/auth.service';
import { HealthService } from './health/health.service';
import { buildRoutes, RouteDeps } from './routes';
import { matchRoute, createContext } from './http/router';
import { HttpError } from './http/errors';
import { RouteContext, sendError, sendText } from './http/types';
import { applyCorsHeaders, readJsonBody, RateLimiter, extractBearerToken } from './http/middleware';
import { serveStatic } from './http/static';
import { projectRoot, dataClientsDir, dataLeadsDir } from './paths';

export interface ServerOptions {
  port?: number;
  env?: Env;
  clients?: Record<string, Record<string, any>>;
  openrouterFetch?: typeof fetch;
  widgetDist?: string;
  projectRoot?: string;
  dataDir?: string;
  rateLimiter?: RateLimiter;
  verifyPassword?: (password: string, hash: string) => Promise<boolean> | boolean;
  log?: (message: string) => void;
}

export interface ChatServer {
  server: http.Server;
  url: string;
}

export function createChatServer(options: ServerOptions = {}): http.Server {
  const env = options.env ?? getEnv();

  const openrouter = new OpenRouterService({
    baseUrl: env.openrouterBaseUrl,
    apiKey: env.openrouterApiKey,
    fetchFn: options.openrouterFetch,
  });

  const rag = new RagService({ dataDir: env.dataDir ?? undefined });
  if (options.clients) rag.setClients(options.clients);

  const leadDetector = new LeadDetectorService();
  const chat = new ChatService({ openrouter, rag, leadDetector });
  const leads = new LeadsService({ dataDir: env.leadsDataDir ?? undefined });
  const admin = new AdminService({ dataDir: env.dataDir ?? undefined });
  const auth = new AuthService({
    jwtSecret: env.jwtSecret,
    jwtExpiresIn: env.jwtExpiresIn,
    adminEmail: env.adminEmail,
    adminPasswordHash: env.adminPasswordHash,
    verifyPassword: options.verifyPassword,
  });
  const health = new HealthService();

  const deps: RouteDeps = { chat, leads, admin, auth, health };
  const routes = buildRoutes(deps);
  const limiter = options.rateLimiter ?? new RateLimiter();
  const log = options.log ?? ((message: string) => console.log(message));

  const root = options.projectRoot ?? projectRoot();
  const dockerWidgetDist = path.join(root, 'widgets-dist');
  const widgetDist =
    options.widgetDist ??
    (fs.existsSync(dockerWidgetDist)
      ? dockerWidgetDist
      : path.join(root, 'widgets', 'chat-widget', 'dist'));

  return http.createServer(async (req, res) => {
    const url = new URL(req.url || '/', 'http://localhost');
    const ctx = createContext(req, res, url);

    applyCorsHeaders(ctx, env);

    if (ctx.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    try {
      if (ctx.pathname.startsWith('/widgets/')) {
        const handled = await serveStatic(req, res, ctx.pathname, [
          { prefix: '/widgets/', rootDir: widgetDist },
        ]);
        if (handled) return;
        sendText(res, 404, 'Not Found');
        return;
      }

      if (!ctx.pathname.startsWith('/api/')) {
        if (env.nodeEnv === 'production') {
          sendText(res, 404, 'Not Found');
          return;
        }
        const handled = await serveStatic(req, res, ctx.pathname, [
          { prefix: '/', rootDir: root },
        ]);
        if (handled) return;
        sendText(res, 404, 'Not Found');
        return;
      }

      const match = matchRoute(routes, ctx.method, ctx.pathname);
      if (!match) {
        sendError(res, 404, 'Cannot match any route');
        return;
      }
      const { route } = match;
      ctx.params = match.params;

      await readJsonBody(ctx);

      if (route.rateLimit) {
        const key = `${route.path}:${ctx.ip}`;
        const result = limiter.check(key, route.rateLimit.limit, route.rateLimit.ttlMs);
        if (!result.allowed) {
          res.setHeader('Retry-After', Math.ceil(result.retryAfterMs / 1000));
          sendError(res, 429, 'ThrottlerException: Too Many Requests');
          return;
        }
      }

      if (route.auth) {
        const token = extractBearerToken(req);
        const payload = token ? auth.verifyToken(token) : null;
        if (!payload) {
          sendError(res, 401, 'Unauthorized');
          return;
        }
        (ctx as RouteContext & { user: unknown }).user = auth.validateToken(payload);
      }

      await route.handler(ctx);
    } catch (error) {
      if (error instanceof HttpError) {
        if (!res.headersSent) sendError(res, error.status, error.message);
      } else {
        log(`Unhandled error: ${error instanceof Error ? error.stack : String(error)}`);
        if (!res.headersSent) sendError(res, 500, 'Internal server error');
      }
    } finally {
      if (!res.writableEnded) {
        try {
          res.end();
        } catch {
          /* ignore */
        }
      }
    }
  });
}

export async function startChatServer(options: ServerOptions = {}): Promise<ChatServer> {
  const env = options.env ?? getEnv();
  const port = options.port ?? env.port;

  const server = createChatServer({ ...options, env });
  await new Promise<void>((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, () => {
      server.removeListener('error', reject);
      resolve();
    });
  });

  const address = server.address();
  const boundPort = typeof address === 'object' && address !== null ? address.port : port;
  const url = `http://localhost:${boundPort}`;
  const log = options.log ?? ((message: string) => console.log(message));
  log(`ChatBot running at ${url}`);
  log(`Widget: ${url}/widgets/chat-widget.min.js`);
  log(`Health: ${url}/api/health`);
  log(`Data dir: ${options.dataDir ?? env.dataDir ?? dataClientsDir()}`);

  return { server, url };
}
