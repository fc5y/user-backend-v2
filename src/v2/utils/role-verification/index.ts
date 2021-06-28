import { NextFunction, Request, Response } from 'express';
import { DISABLE_ROLE_VERIFICATION } from '../common-config';
import { ERROR_CODE, GeneralError } from '../common-errors';

export function mustBeAdmin(req: Request, res: Response, next: NextFunction) {
  try {
    if (DISABLE_ROLE_VERIFICATION) return next();
    const isAdmin = false; // TODO: implement this
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