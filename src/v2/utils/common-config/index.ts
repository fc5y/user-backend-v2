import dotenv from 'dotenv';

dotenv.config();

export const DATABASE_GATEWAY_ORIGIN = process.env.DATABASE_GATEWAY_ORIGIN || '';
export const DISABLE_ROLE_VERIFICATION = process.env.DISABLE_ROLE_VERIFICATION === 'true';
export const SESSION_SECRET = process.env.SESSION_SECRET || '';
export const SESSION_SECRET_ALTERNATIVE = process.env.SESSION_SECRET_ALTERNATIVE || '';
export const CMS_MANAGER_ORIGIN = process.env.CMS_MANAGER_ORIGIN || '';
export const CMS_MANAGER_SIGNATURE = process.env.CMS_MANAGER_SIGNATURE || '';
export const SENDER_EMAIL = process.env.SENDER_EMAIL || '';
export const EMAIL_SERVICE_ORIGIN = process.env.EMAIL_SERVICE_ORIGIN || '';
export const SHOW_DEBUG = process.env.SHOW_DEBUG === 'true';

if (!DATABASE_GATEWAY_ORIGIN) {
  throw new Error(`
    DATABASE_GATEWAY_ORIGIN is empty.
    Make sure the environment variable is available in .env.
    Please ask the Database Gateway maintainers to provide this info.

    Example:
    DATABASE_GATEWAY_ORIGIN=https://test.be.freecontest.net
  `);
}

if (!SESSION_SECRET) {
  throw new Error(`
    SESSION_SECRET is empty.
    Make sure the environment variable is available in .env.
    You can generate a random string by yourself.

    Example:
    SESSION_SECRET=5c4ea279-314c-460b-a61f-6b4923dcd6b3
  `);
}

if (!SESSION_SECRET_ALTERNATIVE) {
  throw new Error(`
    SESSION_SECRET_ALTERNATIVE is empty.
    Make sure the environment variable is available in .env.
    You can generate a random string by yourself.

    Example:
    SESSION_SECRET_ALTERNATIVE=ff0e8077-f2d2-4bb5-ae09-8b7e03cafe8f
  `);
}

if (!CMS_MANAGER_ORIGIN) {
  throw new Error(`
    CMS_MANAGER_ORIGIN is empty.
    Make sure the environment variable is available in .env.
    Please ask the CMS Manager maintainers to provide this info.

    Example:
    CMS_MANAGER_ORIGIN=https://cms.freecontest.net
  `);
}

if (!CMS_MANAGER_SIGNATURE) {
  throw new Error(`
    CMS_MANAGER_SIGNATURE is empty.
    Make sure the environment variable is available in .env.
    Please ask the CMS Manager maintainers to provide this info.

    Example:
    CMS_MANAGER_SIGNATURE=ada09e51-a269-495f-93c9-e22f593be317
  `);
}

if (!SENDER_EMAIL) {
  throw new Error(`
    SENDER_EMAIL is empty.
    Make sure the environment variable is available in .env.
    Please ask the Email Service maintainers to provide this info.

    Example:
    SENDER_EMAIL=no-reply@freecontest.net
  `);
}

if (!EMAIL_SERVICE_ORIGIN) {
  throw new Error(`
    EMAIL_SERVICE_ORIGIN is empty.
    Make sure the environment variable is available in .env.
    Please ask the Email Service maintainers to provide this info.

    Example:
    EMAIL_SERVICE_ORIGIN=https://test.be.freecontest.net
  `);
}
