import { UnauthorizedError } from '../http/errors';
import { signJwt, verifyJwt, parseExpiresIn, JwtPayload } from './jwt';
import { verifyPassword } from './password';

export interface AuthServiceDeps {
  jwtSecret: string;
  jwtExpiresIn?: string;
  adminEmail: string;
  adminPasswordHash: string;
  now?: () => number;
  verifyPassword?: (password: string, hash: string) => Promise<boolean> | boolean;
}

export class AuthService {
  private readonly jwtSecret: string;
  private readonly jwtExpiresInSeconds: number;
  private readonly adminEmail: string;
  private readonly adminPasswordHash: string;
  private readonly now: () => number;
  private readonly verifyPasswordFn: (password: string, hash: string) => Promise<boolean>;

  constructor(deps: AuthServiceDeps) {
    this.jwtSecret = deps.jwtSecret;
    this.jwtExpiresInSeconds = parseExpiresIn(deps.jwtExpiresIn || '24h');
    this.adminEmail = deps.adminEmail;
    this.adminPasswordHash = deps.adminPasswordHash;
    this.now = deps.now ?? Date.now;
    const verify = deps.verifyPassword ?? verifyPassword;
    this.verifyPasswordFn = (password, hash) => Promise.resolve(verify(password, hash));
  }

  async login(email: string, password: string): Promise<{ access_token: string }> {
    if (email !== this.adminEmail) {
      throw new UnauthorizedError();
    }
    const passwordValid = await this.verifyPasswordFn(password, this.adminPasswordHash);
    if (!passwordValid) {
      throw new UnauthorizedError();
    }
    const payload: JwtPayload = { email, sub: 'admin' };
    return { access_token: signJwt(payload, this.jwtSecret, this.jwtExpiresInSeconds, this.now) };
  }

  verifyToken(token: string): JwtPayload | null {
    return verifyJwt(token, this.jwtSecret, this.now);
  }

  validateToken(payload: JwtPayload): { email: unknown; role: unknown } {
    return { email: payload.email, role: payload.sub };
  }
}
