import { ERROR_CODE, GeneralError } from './common-errors';

const REGEX_EMAIL_LOOSE = /^[a-zA-Z0-9.!#$%&’*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;
const REGEX_USERNAME_LOOSE = /^[a-zA-Z0-9_-]{3,16}$/;
const REGEX_PASSWORD_LOOSE = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}$/;

export function assertEmail(email: string) {
  if (!REGEX_EMAIL_LOOSE.test(email)) {
    throw new GeneralError({
      error: ERROR_CODE.INVALID_EMAIL,
      error_msg: 'Invalid email',
      data: { email },
    });
  }
  return email;
}

export function assertUsername(username: string) {
  if (!REGEX_USERNAME_LOOSE.test(username)) {
    throw new GeneralError({
      error: ERROR_CODE.INVALID_USERNAME,
      error_msg: 'Invalid username',
      data: { username },
    });
  }
  return username;
}

export function assertPassword(password: string) {
  if (!REGEX_PASSWORD_LOOSE.test(password)) {
    throw new GeneralError({
      error: ERROR_CODE.INVALID_PASSWORD,
      error_msg: 'Invalid password',
      data: { password },
    });
  }
  return password;
}
