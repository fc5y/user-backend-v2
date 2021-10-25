import bcrypt from 'bcryptjs';
import db from '../../utils/database-gateway';
import dbw from '../../utils/database-gateway-wrapper';
import * as otpManager from '../../utils/otp-manager';
import * as jwtManager from '../../utils/jwt-manager';
import { assertEmail, assertUsername, assertPassword } from '../../utils/auth';
import { assertWithSchema } from '../../utils/validation';
import { ERROR_CODE, GeneralError } from '../../utils/common-errors';
import { JSONSchemaType } from 'ajv';
import { loadUser, saveUser } from '../../utils/session-utils';
import { NextFunction, Request, Response, Router } from 'express';
import { sendEmail, EMAIL_TEMPLATE_ID } from '../../utils/email-service';

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

//#region POST /api/v2/auth/request-signup

type RequestSignupBody = {
  email: string;
  username: string;
  full_name: string;
};

const requestSignupBodySchema: JSONSchemaType<RequestSignupBody> = {
  type: 'object',
  required: ['email', 'username', 'full_name'],
  properties: {
    email: { type: 'string' },
    username: { type: 'string' },
    full_name: { type: 'string' },
  },
};

async function requestSignup(req: Request, res: Response, next: NextFunction) {
  try {
    const body = assertWithSchema(req.body, requestSignupBodySchema);
    const email = assertEmail(body.email);
    const username = assertUsername(body.username);

    if ((await dbw.users.getUserOrUndefined({ username })) !== undefined) {
      throw new GeneralError({
        error: ERROR_CODE.USERNAME_EXISTED,
        error_msg: 'Username already existed',
        data: { username },
      });
    }

    if ((await dbw.users.getUserOrUndefined({ email })) !== undefined) {
      throw new GeneralError({
        error: ERROR_CODE.EMAIL_EXISTED,
        error_msg: 'Email already existed',
        data: { email },
      });
    }

    const otp = otpManager.createOtp(email, username);
    const sendResponse = await sendEmail({
      recipient_email: email,
      template_id: EMAIL_TEMPLATE_ID.SIGNUP_EMAIL_TEMPLATE_ID,
      params: {
        displayed_name: body.full_name,
        otp,
      },
    });

    if (sendResponse.error) {
      throw new GeneralError({
        error: ERROR_CODE.EMAIL_SERVICE_ERROR,
        error_msg: 'Received non-zero code from Email Service when sending OTP email',
        data: { response: sendResponse },
      });
    }

    res.json({
      error: 0,
      error_msg: 'OTP has been sent',
      data: {
        email,
      },
    });
  } catch (error) {
    next(error);
  }
}

//#endregion

//#region POST /api/v2/auth/verify-otp

type VerifyOtpBody = {
  email: string;
  username: string | null;
  otp: string;
};

const verifyOtpBodySchema: JSONSchemaType<VerifyOtpBody> = {
  type: 'object',
  required: ['email', 'username', 'otp'],
  properties: {
    email: {
      type: 'string',
    },
    username: {
      type: 'string',
      nullable: true,
    },
    otp: {
      type: 'string',
      minLength: 6,
      maxLength: 6,
    },
  },
};

async function verifyOtp(req: Request, res: Response, next: NextFunction) {
  try {
    const body = assertWithSchema(req.body, verifyOtpBodySchema);
    const isCorrectOtp = otpManager.verifyOtp(body.email, body.username, body.otp);
    if (!isCorrectOtp) {
      return res.json({
        error: ERROR_CODE.OTP_INCORRECT,
        error_msg: 'OTP is incorrect',
      });
    }

    const token = jwtManager.createJWT(body.email, body.username);
    res.json({
      error: 0,
      error_msg: 'OTP is correct',
      data: { token },
    });
  } catch (error) {
    next(error);
  }
}

//#endregion

//#region POST /api/v2/auth/signup

type SignupBody = {
  token: string;
  username: string;
  full_name: string;
  school_name: string;
  email: string;
  password: string;
};

// TODO: add maxLength restrictions here
const signupBodySchema: JSONSchemaType<SignupBody> = {
  type: 'object',
  required: ['token', 'username', 'full_name', 'school_name', 'email', 'password'],
  properties: {
    token: {
      type: 'string',
    },
    username: {
      type: 'string',
    },
    full_name: {
      type: 'string',
    },
    school_name: {
      type: 'string',
    },
    email: {
      type: 'string',
    },
    password: {
      type: 'string',
    },
  },
};

async function signup(req: Request, res: Response, next: NextFunction) {
  try {
    const body = assertWithSchema(req.body, signupBodySchema);
    const email = assertEmail(body.email);
    const username = assertUsername(body.username);
    const password = assertPassword(body.password);

    // 1. Verify JWT
    jwtManager.verifyJWTOrThrow(body.email, body.username, body.token);

    // 2. Check if user exists
    if ((await dbw.users.getUserOrUndefined({ username })) !== undefined) {
      throw new GeneralError({
        error: ERROR_CODE.USERNAME_EXISTED,
        error_msg: 'Username already existed',
        data: { username },
      });
    }

    if ((await dbw.users.getUserOrUndefined({ email })) !== undefined) {
      throw new GeneralError({
        error: ERROR_CODE.EMAIL_EXISTED,
        error_msg: 'Email already existed',
        data: { email },
      });
    }

    // 3. Create user
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(password, salt);

    await dbw.users.createUserOrThrow({
      username: body.username,
      full_name: body.full_name,
      email: body.email,
      school_name: body.school_name,
      password: hashedPassword,
    });

    res.json({
      error: 0,
      error_msg: 'Signed up successfully',
      data: {
        username: body.username,
        email: body.email,
      },
    });
  } catch (error) {
    next(error);
  }
}

//#endregion

//#region POST /api/v2/auth/request-change-email

type RequestChangeEmailBody = {
  new_email: string;
};

const requestChangeEmailBodySchema: JSONSchemaType<RequestChangeEmailBody> = {
  type: 'object',
  required: ['new_email'],
  properties: {
    new_email: { type: 'string' },
  },
};

async function requestChangeEmail(req: Request, res: Response, next: NextFunction) {
  try {
    const currentUser = loadUser(req);

    if (!currentUser) {
      throw new GeneralError({
        error: ERROR_CODE.UNAUTHORIZED,
        error_msg: 'User is not logged in',
        data: null,
      });
    }

    const body = assertWithSchema(req.body, requestChangeEmailBodySchema);
    const new_email = assertEmail(body.new_email);
    const username = currentUser.username;
    const user = await dbw.users.getUserOrThrow({ username });
    const otp = otpManager.createOtp(new_email, username);
    const sendResponse = await sendEmail({
      recipient_email: new_email,
      template_id: EMAIL_TEMPLATE_ID.CHANGE_EMAIL_EMAIL_TEMPLATE_ID,
      params: {
        displayed_name: user.full_name,
        username,
        new_email,
        otp,
      },
    });
    if (sendResponse.error) {
      throw new GeneralError({
        error: ERROR_CODE.EMAIL_SERVICE_ERROR,
        error_msg: 'Received non-zero code from Email Service when sending OTP email',
        data: { response: sendResponse },
      });
    }
    res.json({
      error: 0,
      error_msg: 'OTP has been sent',
      data: { email: new_email },
    });
  } catch (error) {
    next(error);
  }
}

//#endregion

//#region POST /api/v2/auth/change-email

type ChangeEmail = {
  token: string;
  new_email: string;
};

const changeEmailBodySchema: JSONSchemaType<ChangeEmail> = {
  type: 'object',
  required: ['new_email', 'token'],
  properties: {
    token: { type: 'string' },
    new_email: { type: 'string' },
  },
};

async function changeEmail(req: Request, res: Response, next: NextFunction) {
  try {
    const currentUser = loadUser(req);

    if (!currentUser) {
      throw new GeneralError({
        error: ERROR_CODE.UNAUTHORIZED,
        error_msg: 'User is not logged in',
        data: null,
      });
    }

    const body = assertWithSchema(req.body, changeEmailBodySchema);
    const new_email = assertEmail(body.new_email);
    const username = currentUser.username;
    jwtManager.verifyJWTOrThrow(new_email, username, body.token);

    await dbw.users.updateUserEmailOrThrow(currentUser.user_id, new_email);

    res.json({
      error: 0,
      error_msg: 'Successfully changed email',
      data: { new_email, username },
    });
  } catch (error) {
    next(error);
  }
}

//#endregion

//#region POST /api/v2/auth/request-reset-password

type RequestResetPasswordBody = {
  email: string;
};

const requestResetPasswordBodySchema: JSONSchemaType<RequestResetPasswordBody> = {
  type: 'object',
  required: ['email'],
  properties: {
    email: { type: 'string' },
  },
};

async function requestResetPassword(req: Request, res: Response, next: NextFunction) {
  try {
    const body = assertWithSchema(req.body, requestResetPasswordBodySchema);
    const email = assertEmail(body.email);
    const user = await dbw.users.getUserWithEmail(email);
    const otp = otpManager.createOtp(email, null);
    const sendResponse = await sendEmail({
      recipient_email: email,
      template_id: EMAIL_TEMPLATE_ID.RESET_PASSWORD_EMAIL_TEMPLATE_ID,
      params: {
        displayed_name: user.full_name,
        username: user.username,
        otp,
      },
    });
    if (sendResponse.error) {
      throw new GeneralError({
        error: ERROR_CODE.EMAIL_SERVICE_ERROR,
        error_msg: 'Received non-zero code from Email Service when sending OTP email',
        data: { response: sendResponse },
      });
    }
    res.json({
      error: 0,
      error_msg: 'OTP has been sent',
      data: {
        email,
      },
    });
  } catch (error) {
    next(error);
  }
}

//#endregion

//#region POST /api/v2/auth/reset-password

type ResetPassword = {
  token: string;
  email: string;
  new_password: string;
};

const resetPasswordBodySchema: JSONSchemaType<ResetPassword> = {
  type: 'object',
  required: ['token', 'email', 'new_password'],
  properties: {
    token: { type: 'string' },
    email: { type: 'string' },
    new_password: { type: 'string' },
  },
};

async function resetPassword(req: Request, res: Response, next: NextFunction) {
  try {
    const body = assertWithSchema(req.body, resetPasswordBodySchema);
    const email = assertEmail(body.email);
    const new_password = assertPassword(body.new_password);
    jwtManager.verifyJWTOrThrow(email, null, body.token);

    const user = await dbw.users.getUserWithEmail(email);
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(new_password, salt);

    await dbw.users.updateUserPasswordOrThrow(user.id, hashedPassword);

    res.json({
      error: 0,
      error_msg: 'Successfully reset password',
      data: {
        email,
        username: user.username,
      },
    });
  } catch (error) {
    next(error);
  }
}

//#endregion

const router = Router();
router.get('/login-status', loginStatus);
router.post('/login', login);
router.post('/logout', logout);
router.post('/request-signup', requestSignup);
router.post('/verify-otp', verifyOtp);
router.post('/signup', signup);
router.post('/request-change-email', requestChangeEmail);
router.post('/change-email', changeEmail);
router.post('/request-reset-password', requestResetPassword);
router.post('/reset-password', resetPassword);
export default router;
