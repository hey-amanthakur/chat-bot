import { loadDotEnv, getEnv } from './config';
import { startChatServer } from './server';

loadDotEnv();

const env = getEnv();

if (!env.openrouterApiKey) {
  console.warn('Warning: OPENROUTER_API_KEY is not set. Chat completions will fail.');
}
if (!env.adminEmail || !env.adminPasswordHash) {
  console.warn('Warning: ADMIN_EMAIL / ADMIN_PASSWORD_HASH are not set. Login will be disabled.');
}

startChatServer().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
