import db from '../../utils/database-gateway';
import bcrypt from 'bcryptjs';
import { JSONSchemaType } from 'ajv';
import { NextFunction, Request, Response, Router } from 'express';
import { loadUser, loadUserOrThrow, saveUser } from '../../utils/session-utils';
import { assertWithSchema } from '../../utils/validation';
import { ERROR_CODE, GeneralError } from '../../utils/common-errors';
import * as otpManager from '../../utils/otp-manager';

//#region GET /api/v2/auth/login-status

async function loginStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const user = loadUser(req);
    res.json({
      error: 0,
      error_msg: 'Login status',
      data: {
        is_logged_in: !!user,
        username: user ? user.username : null,
      },
    });
  } catch (err) {
    next(err);
  }
}

//#endregion

//#region POST /api/v2/auth/login

type LoginBody = {
  auth_key: string;
  password: string;
};

const loginBodySchema: JSONSchemaType<LoginBody> = {
  type: 'object',
  required: ['auth_key', 'password'],
  properties: {
    auth_key: {
      type: 'string',
    },
    password: {
      type: 'string',
    },
  },
};

async function login(req: Request, res: Response, next: NextFunction) {
  try {
    // 1. Get user
    const { auth_key, password } = assertWithSchema(req.body, loginBodySchema);
    const { error, error_msg, data } = await db.users.getUsers({
      offset: 0,
      limit: 1,
      username: auth_key,
    });
    if (error || !data) {
      throw new GeneralError({
        error: ERROR_CODE.DATABASE_GATEWAY_ERROR,
        error_msg: 'Received non-zero code from Database Gateway when getting users',
        data: { response: { error, error_msg, data } },
      });
    }
    if (data.items.length < 1) {
      throw new GeneralError({
        error: ERROR_CODE.USER_NOT_FOUND,
        error_msg: 'User not found',
        data: { response: { error, error_msg, data } },
      });
    }
    const user = data.items[0];

    // 2. Validate password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (isValidPassword) {
      saveUser(req, { user_id: user.id, username: user.username });
      res.json({
        error: 0,
        error_msg: 'Logged in successfully',
        data: { username: user.username },
      });
    } else {
      res.json({
        error: ERROR_CODE.UNAUTHORIZED,
        error_msg: 'Unauthorized',
        data: null,
      });
    }
  } catch (err) {
    next(err);
  }
}

//#endregion

//#region POST /api/v2/auth/logout

async function logout(req: Request, res: Response, next: NextFunction) {
  try {
    saveUser(req, null);
    res.json({
      error: 0,
      error_msg: 'Logout successfully',
      data: null,
    });
  } catch (err) {
    next(err);
  }
}

//#endregion

//#region POST /api/v2/auth/send-otp

const REGEX_EMAIL_LOOSE = /^[a-zA-Z0-9.!#$%&’*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;

type SentOtpBody = {
  email: string;
};

const sendOtpBodySchema: JSONSchemaType<SentOtpBody> = {
  type: 'object',
  required: ['email'],
  properties: {
    email: { type: 'string' },
  },
};

function assertEmail(email: string) {
  if (!REGEX_EMAIL_LOOSE.test(email)) {
    throw new GeneralError({
      error: ERROR_CODE.INVALID_EMAIL,
      error_msg: 'Invalid email',
      data: { email },
    });
  }
  return email;
}

async function sendOtp(req: Request, res: Response, next: NextFunction) {
  try {
    const body = assertWithSchema(req.body, sendOtpBodySchema);
    const email = assertEmail(body.email);
    const currentUser = loadUserOrThrow(req);
    const otp = otpManager.createOtp(currentUser.user_id);
    // TODO: send OTP email here
    res.json({
      error: 0,
      error_msg: 'OTP has been sent',
      data: {
        email,
        otp, // TODO: remove this later
      },
    });
  } catch (error) {
    next(error);
  }
}

//#endregion

//#region POST /api/v2/auth/verify-otp

type VerifyOtpBody = {
  otp: string;
};

const verifyOtpBodySchema: JSONSchemaType<VerifyOtpBody> = {
  type: 'object',
  required: ['otp'],
  properties: {
    otp: {
      type: 'string',
      minLength: 6,
      maxLength: 6,
    },
  },
};

async function verifyOtp(req: Request, res: Response, next: NextFunction) {
  try {
    const currentUser = loadUserOrThrow(req);
    const body = assertWithSchema(req.body, verifyOtpBodySchema);
    const isCorrectOtp = otpManager.verifyOtp(currentUser.user_id, body.otp);
    res.json({
      error: 0,
      error_msg: isCorrectOtp ? 'OTP is correct' : 'OTP is incorrect',
      data: { is_correct_otp: isCorrectOtp },
    });
  } catch (error) {
    next(error);
  }
}

//#endregion

async function signup(req: Request, res: Response, next: NextFunction) {
  throw new Error('Not implemented');
}

const router = Router();
router.get('/login-status', loginStatus);
router.post('/login', login);
router.post('/logout', logout);
router.post('/send-otp', sendOtp);
router.post('/verify-otp', verifyOtp);
router.post('/signup', signup);
export default router;
