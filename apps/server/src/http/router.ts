import type { Route, RouteContext, Method } from './types';

export function matchRoute(
  routes: Route[],
  method: string,
  pathname: string,
): { route: Route; params: Record<string, string> } | null {
  const segments = pathname.split('/').filter(Boolean);

  for (const route of routes) {
    if (route.method !== method) continue;
    const routeSegs = route.path.split('/').filter(Boolean);
    if (routeSegs.length !== segments.length) continue;

    const params: Record<string, string> = {};
    let matches = true;
    for (let i = 0; i < segments.length; i++) {
      const routeSeg = routeSegs[i];
      if (routeSeg.startsWith(':')) {
        params[routeSeg.slice(1)] = decodeURIComponent(segments[i]);
      } else if (routeSeg !== segments[i]) {
        matches = false;
        break;
      }
    }
    if (matches) return { route, params };
  }
  return null;
}

export function createContext(
  req: import('http').IncomingMessage,
  res: import('http').ServerResponse,
  url: URL,
): RouteContext {
  return {
    req,
    res,
    method: (req.method || 'GET') as Method,
    url: url.toString(),
    pathname: url.pathname,
    query: url.searchParams,
    params: {},
    body: undefined,
    ip:
      (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      req.socket.remoteAddress ||
      'unknown',
    origin: (req.headers.origin as string) || null,
  };
}
