export interface HealthStatus {
  status: string;
  timestamp: string;
  service: string;
}

export class HealthService {
  check(): HealthStatus {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'api-gateway',
    };
  }
}
