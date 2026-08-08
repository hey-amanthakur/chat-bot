import { Route, RouteContext, sendJson } from './http/types';
import {
  assertObject,
  rejectUnknownKeys,
  expectString,
  expectEmail,
  expectBoolean,
  expectEnum,
} from './http/validate';
import { ChatService } from './chat/chat.service';
import { LeadsService, LeadInput } from './leads/leads.service';
import { AdminService, CreateClientInput, UpdateClientInput } from './admin/admin.service';
import { AuthService } from './auth/auth.service';
import { HealthService } from './health/health.service';

export interface RouteDeps {
  chat: ChatService;
  leads: LeadsService;
  admin: AdminService;
  auth: AuthService;
  health: HealthService;
}

function parseChatBody(ctx: RouteContext): {
  clientId: string;
  message: string;
  sessionId?: string;
} {
  const body = assertObject(ctx.body);
  rejectUnknownKeys(body, ['clientId', 'message', 'sessionId']);
  const clientId = expectString(body, 'clientId', { max: 100 });
  const message = expectString(body, 'message', { max: 2000 });
  const sessionId = expectString(body, 'sessionId', { max: 100, optional: true });
  return { clientId: clientId as string, message: message as string, sessionId };
}

function parseLeadBody(ctx: RouteContext): LeadInput {
  const body = assertObject(ctx.body);
  rejectUnknownKeys(body, ['clientId', 'name', 'email', 'phone', 'reason', 'conversationId']);
  const clientId = expectString(body, 'clientId', { max: 100 });
  const name = expectString(body, 'name', { max: 100 });
  const email = expectEmail(body, 'email', { optional: true });
  const phone = expectString(body, 'phone', { max: 20, optional: true });
  const reason = expectString(body, 'reason', { max: 500 });
  const conversationId = expectString(body, 'conversationId', { max: 100 });
  return {
    clientId: clientId as string,
    name: name as string,
    email,
    phone,
    reason: reason as string,
    conversationId: conversationId as string,
  };
}

function parseLoginBody(ctx: RouteContext): { email: string; password: string } {
  const body = assertObject(ctx.body);
  rejectUnknownKeys(body, ['email', 'password']);
  const email = expectEmail(body, 'email');
  const password = expectString(body, 'password', { min: 8, max: 100 });
  return { email: email as string, password: password as string };
}

function parseCreateClientBody(ctx: RouteContext): CreateClientInput {
  const body = assertObject(ctx.body);
  rejectUnknownKeys(body, ['name', 'slug', 'tone', 'leadCaptureEnabled', 'leadNotificationMethod']);
  const name = expectString(body, 'name', { max: 100 });
  const slug = expectString(body, 'slug', { max: 100 });
  const tone = expectEnum(body, 'tone', ['formal', 'casual', 'friendly'], { optional: true });
  const leadCaptureEnabled = expectBoolean(body, 'leadCaptureEnabled', { optional: true });
  const leadNotificationMethod = expectString(body, 'leadNotificationMethod', {
    max: 100,
    optional: true,
  });
  return {
    name: name as string,
    slug: slug as string,
    tone,
    leadCaptureEnabled,
    leadNotificationMethod,
  };
}

function parseUpdateClientBody(ctx: RouteContext): UpdateClientInput {
  const body = assertObject(ctx.body);
  rejectUnknownKeys(body, ['name', 'tone', 'leadCaptureEnabled', 'leadNotificationMethod']);
  const name = expectString(body, 'name', { max: 100, optional: true });
  const tone = expectEnum(body, 'tone', ['formal', 'casual', 'friendly'], { optional: true });
  const leadCaptureEnabled = expectBoolean(body, 'leadCaptureEnabled', { optional: true });
  const leadNotificationMethod = expectString(body, 'leadNotificationMethod', {
    max: 100,
    optional: true,
  });
  return { name, tone, leadCaptureEnabled, leadNotificationMethod };
}

export function buildRoutes(deps: RouteDeps): Route[] {
  return [
    {
      method: 'POST',
      path: '/api/chat',
      rateLimit: { limit: 20, ttlMs: 60000 },
      async handler(ctx) {
        const { clientId, message, sessionId } = parseChatBody(ctx);
        const result = await deps.chat.processMessage(clientId, message, sessionId || ctx.ip);
        sendJson(ctx.res, 201, result);
      },
    },
    {
      method: 'POST',
      path: '/api/leads',
      rateLimit: { limit: 10, ttlMs: 60000 },
      async handler(ctx) {
        const data = parseLeadBody(ctx);
        const lead = await deps.leads.createLead(data);
        sendJson(ctx.res, 201, lead);
      },
    },
    {
      method: 'GET',
      path: '/api/leads/:clientId',
      async handler(ctx) {
        const leads = await deps.leads.getLeads(ctx.params.clientId);
        sendJson(ctx.res, 200, leads);
      },
    },
    {
      method: 'POST',
      path: '/api/admin/login',
      rateLimit: { limit: 5, ttlMs: 900000 },
      async handler(ctx) {
        const { email, password } = parseLoginBody(ctx);
        const result = await deps.auth.login(email, password);
        sendJson(ctx.res, 201, result);
      },
    },
    {
      method: 'GET',
      path: '/api/admin/clients',
      auth: true,
      rateLimit: { limit: 30, ttlMs: 60000 },
      async handler(ctx) {
        const result = await deps.admin.getClients();
        sendJson(ctx.res, 200, result);
      },
    },
    {
      method: 'POST',
      path: '/api/admin/clients',
      auth: true,
      rateLimit: { limit: 10, ttlMs: 3600000 },
      async handler(ctx) {
        const data = parseCreateClientBody(ctx);
        const result = await deps.admin.createClient(data);
        sendJson(ctx.res, 201, result);
      },
    },
    {
      method: 'PUT',
      path: '/api/admin/clients/:id',
      auth: true,
      rateLimit: { limit: 10, ttlMs: 3600000 },
      async handler(ctx) {
        const data = parseUpdateClientBody(ctx);
        const result = await deps.admin.updateClient(ctx.params.id, data);
        sendJson(ctx.res, 200, result);
      },
    },
    {
      method: 'GET',
      path: '/api/health',
      handler(ctx) {
        sendJson(ctx.res, 200, deps.health.check());
      },
    },
  ];
}
