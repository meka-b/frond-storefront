import { betterAuth } from 'better-auth';
import db from './db/index.js';

export const auth = betterAuth({
  database: db,
  emailAndPassword: {
    enabled: true,
    autoSignIn: true
  },
  secret: process.env.BETTER_AUTH_SECRET || 'frond-botanical-secret-key-2026-auth-ultra-secure',
  baseURL: process.env.BETTER_AUTH_URL || 'https://frond.ecomm-0320.workers.dev'
});
