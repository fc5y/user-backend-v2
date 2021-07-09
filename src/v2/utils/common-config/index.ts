import dotenv from 'dotenv';

dotenv.config();

export const DATABASE_GATEWAY_ORIGIN = process.env.DATABASE_GATEWAY_ORIGIN || '';
export const DISABLE_ROLE_VERIFICATION = process.env.DISABLE_ROLE_VERIFICATION === 'true';
export const SESSION_SECRET = process.env.SESSION_SECRET || '';
export const SESSION_SECRET_ALTERNATIVE = process.env.SESSION_SECRET_ALTERNATIVE || '';

if (!DATABASE_GATEWAY_ORIGIN) {
  throw new Error(`
    DATABASE_GATEWAY_ORIGIN is empty.
    Make sure the environment variable is available in .env.

    Example:
    DATABASE_GATEWAY_ORIGIN=https://test.be.freecontest.net
  `);
}

if (!SESSION_SECRET) {
  throw new Error(`
    SESSION_SECRET is empty.
    Make sure the environment variable is available in .env.

    Example:
    SESSION_SECRET=5c4ea279-314c-460b-a61f-6b4923dcd6b3
  `);
}

if (!SESSION_SECRET_ALTERNATIVE) {
  throw new Error(`
    SESSION_SECRET_ALTERNATIVE is empty.
    Make sure the environment variable is available in .env.

    Example:
    SESSION_SECRET_ALTERNATIVE=ff0e8077-f2d2-4bb5-ae09-8b7e03cafe8f
  `);
}
