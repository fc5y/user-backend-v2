import { sign, verify } from 'jsonwebtoken';
import { JWT_SECRET } from '../common-config';
import { ERROR_CODE, GeneralError } from '../common-errors';

const JWT_MAX_AGE = 10 * 60; // 10 minutes

export function createJWT(email: string, username: string | null): string {
  const payload = { email, username };
  return sign(payload, JWT_SECRET, { expiresIn: JWT_MAX_AGE });
}

export function verifyJWTOrThrow(email: string, username: string | null, token: string) {
  try {
    // FIXME: properly validate payload
    const payload = verify(token, JWT_SECRET) as any;
    if (payload.email !== email || payload.username !== username) {
      throw new GeneralError({
        error: ERROR_CODE.JWT_INVALID,
        error_msg: 'Email/Username not matched',
        data: { token },
      });
    }
  } catch {
    throw new GeneralError({
      error: ERROR_CODE.JWT_INVALID,
      error_msg: 'Invalid token',
      data: { token },
    });
  }
}
