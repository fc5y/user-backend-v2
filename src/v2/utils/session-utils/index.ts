import session from 'express-session';
import { assertWithSchema } from '../validation';
import { JSONSchemaType } from 'ajv';
import { Request } from 'express';
import { SESSION_SECRET, SESSION_SECRET_ALTERNATIVE } from '../common-config';

type User = {
  user_id: number;
  username: string;
};

const userSchema: JSONSchemaType<User> = {
  type: 'object',
  required: ['user_id', 'username'],
  properties: {
    user_id: {
      type: 'integer',
      minimum: 0,
    },
    username: {
      type: 'string',
    },
  },
};

export function sessionMiddleware() {
  return session({
    cookie: {
      maxAge: 2419200, // 4 weeks
      httpOnly: true,
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production', // only set secure to true for HTTPS connections
    },
    resave: false,
    saveUninitialized: false,
    secret: [SESSION_SECRET, SESSION_SECRET_ALTERNATIVE],
  });
}

export function loadUser(req: Request): User | null {
  const user = (req.session as any).user;
  try {
    return assertWithSchema(user, userSchema);
  } catch (_err) {
    return null;
  }
}

export function saveUser(req: Request, user: User | null) {
  (req.session as any).user = user;
}
