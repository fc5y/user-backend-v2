import { NextFunction, Request, Response } from 'express';
import { ADMIN_USERNAME_LIST, DISABLE_ROLE_VERIFICATION } from '../common-config';
import { ERROR_CODE, GeneralError } from '../common-errors';
import { loadUser } from '../session-utils';

const adminUsernameList = ADMIN_USERNAME_LIST.split(';').filter((username) => !!username);

export function mustBeAdmin(req: Request, res: Response, next: NextFunction) {
  try {
    if (DISABLE_ROLE_VERIFICATION) return next();

    const user = loadUser(req);

    if (!user) {
      throw new GeneralError({
        error: ERROR_CODE.UNAUTHORIZED,
        error_msg: 'User is not logged in',
        data: null,
      });
    }

    const isAdmin = adminUsernameList.includes(user.username);

    if (!isAdmin) {
      throw new GeneralError({
        error: ERROR_CODE.ROLE_MUST_BE_ADMIN,
        error_msg: 'User is not logged in or not an admin. Set DISABLE_ROLE_VERIFICATION=true to bypass this check.',
        data: null,
      });
    }
    return next();
  } catch (error) {
    next(error);
  }
}
