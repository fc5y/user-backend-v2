import { ERROR_CODE, GeneralError } from '../../utils/common-errors';

const REGEX_EMAIL_LOOSE = /^[a-zA-Z0-9.!#$%&’*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;

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
  // TODO: add validation
  return username;
}

export function assertPassword(password: string) {
  // TODO: add validation
  return password;
}
