import db from '../../utils/database-gateway';
import dbw from '../../utils/database-gateway-wrapper';
import bcrypt from 'bcryptjs';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import { assertWithSchema, JSONSchemaType } from '../../utils/validation';
import { GeneralError, ERROR_CODE } from '../../utils/common-errors';
import { NextFunction, Request, Response, Router } from 'express';
import {
  generateContestPassword,
  getContestById,
  getContestIdByName,
  getHashedPassword,
  getUserById,
  cropAvatar,
} from './utils';
import { uploadJPEG } from '../../utils/aws-s3';
import { loadUser } from '../../utils/session-utils';
import { assertPassword } from '../../utils/auth';
import { formatUser } from '../users/utils';

//#region  GET /api/v2/me

async function getMyInfo(req: Request, res: Response, next: NextFunction) {
  try {
    const user = loadUser(req);

    if (!user) {
      throw new GeneralError({
        error: ERROR_CODE.UNAUTHORIZED,
        error_msg: 'User is not logged in',
        data: null,
      });
    }

    const { error, error_msg, data } = await db.users.getUsers({
      offset: 0,
      limit: 1,
      id: user.user_id,
    });

    if (error || !data) {
      throw new GeneralError({
        error: ERROR_CODE.DATABASE_GATEWAY_ERROR,
        error_msg: 'Received non-zero code from Database Gateway when getting users',
        data: { response: { error, error_msg, data } },
      });
    }
    if (!data.items.length) {
      throw new GeneralError({
        error: ERROR_CODE.USER_NOT_FOUND,
        error_msg: 'Can not find any user match the given info',
        data: { response: { error, error_msg, data } },
      });
    }
    const result = {
      error: 0,
      error_msg: 'Me',
      data: {
        user: formatUser(data.items[0], false),
      },
    };
    res.json(result);
  } catch (error) {
    next(error);
  }
}

//#endregion

//#region POST /api/v2/me/update

type UpdateMyInfoParams = {
  full_name: string;
  school_name: string;
  avatar: string;
};

const updateMyInfoParamsSchema: JSONSchemaType<UpdateMyInfoParams> = {
  type: 'object',
  required: ['full_name', 'school_name', 'avatar'],
  properties: {
    full_name: { type: 'string' },
    school_name: { type: 'string' },
    avatar: { type: 'string' },
  },
};

async function updateMyInfo(req: Request, res: Response, next: NextFunction) {
  try {
    // 1. Check if user is logged in
    const currentUser = loadUser(req);

    if (!currentUser) {
      throw new GeneralError({
        error: ERROR_CODE.UNAUTHORIZED,
        error_msg: 'User is not logged in',
        data: null,
      });
    }

    const user_id = currentUser.user_id;

    // 2. Send update request
    const { full_name, school_name, avatar } = assertWithSchema(req.body, updateMyInfoParamsSchema);

    const updateResponse = await db.users.updateUser({
      where: {
        user_id,
      },
      values: {
        full_name,
        school_name,
        avatar,
      },
    });

    if (updateResponse.error) {
      throw new GeneralError({
        error: ERROR_CODE.DATABASE_GATEWAY_ERROR,
        error_msg: 'Received non-zero code from Database Gateway when updating user',
        data: { response: updateResponse },
      });
    }

    // 3. Send get request
    const getResponse = await db.users.getUsers({
      offset: 0,
      limit: 1,
      id: user_id,
    });

    if (getResponse.error || !getResponse.data) {
      throw new GeneralError({
        error: ERROR_CODE.DATABASE_GATEWAY_ERROR,
        error_msg: 'Received non-zero code from Database Gateway when getting users',
        data: { response: getResponse },
      });
    }

    const user = getResponse.data.items[0];

    if (!user) {
      throw new GeneralError({
        error: ERROR_CODE.USER_NOT_FOUND,
        error_msg: 'User not found',
        data: { user_id },
      });
    }

    // 4. Reply
    res.json({
      error: 0,
      error_msg: 'User updated',
      data: {
        user: formatUser(user, false),
      },
    });
  } catch (error) {
    next(error);
  }
}

//#endregion

//#region POST /api/v2/me/change-password

type UpdateMyPasswordParams = {
  old_password: string;
  new_password: string;
};

const updateMyPasswordParamsSchema: JSONSchemaType<UpdateMyPasswordParams> = {
  type: 'object',
  required: ['old_password', 'new_password'],
  properties: {
    old_password: { type: 'string' },
    new_password: { type: 'string' },
  },
};

async function updateMyPassword(req: Request, res: Response, next: NextFunction) {
  try {
    const currentUser = loadUser(req);

    if (!currentUser) {
      throw new GeneralError({
        error: ERROR_CODE.UNAUTHORIZED,
        error_msg: 'User is not logged in',
        data: null,
      });
    }

    const body = assertWithSchema(req.body, updateMyPasswordParamsSchema);
    const new_password = assertPassword(body.new_password);
    const old_password = body.old_password;

    const user = await getUserById(currentUser.user_id);
    const isValidPassword = await bcrypt.compare(old_password, user.password);
    if (isValidPassword) {
      const { error, error_msg } = await db.users.updateUser({
        where: {
          user_id: currentUser.user_id,
        },
        values: {
          password: await getHashedPassword(new_password),
        },
      });
      if (error) {
        throw new GeneralError({
          error: ERROR_CODE.DATABASE_GATEWAY_ERROR,
          error_msg: 'Received non-zero code from Database Gateway when getting users',
          data: { response: { error, error_msg } },
        });
      }
      res.json({
        error: 0,
        error_msg: 'Password updated',
      });
    } else {
      res.json({
        error: ERROR_CODE.WRONG_OLD_PASSWORD,
        error_msg: 'Wrong old password',
        data: null,
      });
    }
  } catch (error) {
    next(error);
  }
}

//#endregion

//#region GET /api/v2/me/participations

type GetMyParticipationsParams = {
  offset: number;
  limit: number;
};

const getMyParticipationsParamsSchema: JSONSchemaType<GetMyParticipationsParams> = {
  type: 'object',
  required: ['offset', 'limit'],
  properties: {
    offset: { type: 'integer' },
    limit: { type: 'integer' },
  },
};

async function getMyParticipations(req: Request, res: Response, next: NextFunction) {
  try {
    const currentUser = loadUser(req);

    if (!currentUser) {
      throw new GeneralError({
        error: ERROR_CODE.UNAUTHORIZED,
        error_msg: 'User is not logged in',
        data: null,
      });
    }

    const { offset, limit } = assertWithSchema(req.query, getMyParticipationsParamsSchema);
    const { error, error_msg, data } = await db.participations.getParticipations({
      user_id: currentUser.user_id,
      has_total: true,
      offset,
      limit,
    });
    if (error || !data) {
      throw new GeneralError({
        error: ERROR_CODE.DATABASE_GATEWAY_ERROR,
        error_msg: 'Received non-zero code from Database Gateway when getting my participations',
        data: { response: { error, error_msg, data } },
      });
    }
    const user = await getUserById(currentUser.user_id);
    const result = {
      error: 0,
      error_msg: 'My participations',
      data: {
        total: data.total,
        participations: await Promise.all(
          data.items.map(async (participation) => {
            const contestInfo = await getContestById(participation.contest_id);
            return {
              username: user.username,
              contest_name: contestInfo.contest_name,
              contest_title: contestInfo.contest_title,
              is_hidden: participation.is_hidden,
              rating: participation.rating,
              rating_change: participation.rating_change,
              score: participation.score,
              contest_rank: participation.rank_in_contest,
            };
          }),
        ),
      },
    };
    res.json(result);
  } catch (error) {
    next(error);
  }
}

//#endregion

//#region POST /api/v2/me/participations/create

type CreateMyParticipationsParams = {
  contest_name: string;
  is_hidden: boolean;
};

const createMyParticipationsParamsSchema: JSONSchemaType<CreateMyParticipationsParams> = {
  type: 'object',
  required: ['contest_name', 'is_hidden'],
  properties: {
    contest_name: { type: 'string' },
    is_hidden: { type: 'boolean' },
  },
};

async function createMyParticipations(req: Request, res: Response, next: NextFunction) {
  try {
    const currentUser = loadUser(req);

    if (!currentUser) {
      throw new GeneralError({
        error: ERROR_CODE.UNAUTHORIZED,
        error_msg: 'User is not logged in',
        data: null,
      });
    }

    const { contest_name, is_hidden } = assertWithSchema(req.body, createMyParticipationsParamsSchema);
    const contest_id = await getContestIdByName(contest_name);

    const participation = await dbw.participations.getParticipationOrUndefined({
      user_id: currentUser.user_id,
      contest_id,
    });
    if (participation !== undefined) {
      throw new GeneralError({
        error: ERROR_CODE.PARTICIPATION_ALREADY_EXISTS,
        error_msg: 'Participation already exists',
        data: {},
      });
    }

    const { error, error_msg, data } = await db.participations.createMyParticipations({
      user_id: currentUser.user_id,
      contest_id,
      is_hidden,
      contest_password: generateContestPassword(),
      rank_in_contest: 0,
      rating: 0,
      rating_change: 0,
      score: 0,
      synced: false,
    });
    if (error) {
      throw new GeneralError({
        error: ERROR_CODE.DATABASE_GATEWAY_ERROR,
        error_msg: 'Received non-zero code from Database Gateway when creating my participations',
        data: { response: { error, error_msg, data } },
      });
    }
    res.json({
      error: 0,
      error_msg: 'My participation created',
    });
  } catch (error) {
    next(error);
  }
}

//#endregion

//#region POST /api/v2/me/change-avatar

type UpdateMyAvatarParams = {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
};

const UpdateMyAvatarParamsSchema: JSONSchemaType<UpdateMyAvatarParams> = {
  type: 'object',
  required: ['x1', 'y1', 'x2', 'y2'],
  properties: {
    x1: { type: 'integer', minimum: 0 },
    y1: { type: 'integer', minimum: 0 },
    x2: { type: 'integer', minimum: 0 },
    y2: { type: 'integer', minimum: 0 },
  },
};

const avatarUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    files: 1,
    fileSize: 5242880, // 5MB
  },
}).single('avatar');

async function updateMyAvatar(req: Request, res: Response, next: NextFunction) {
  try {
    const currentUser = loadUser(req);

    if (!currentUser) {
      throw new GeneralError({
        error: ERROR_CODE.UNAUTHORIZED,
        error_msg: 'User is not logged in',
        data: null,
      });
    }

    if (!req.file) {
      throw new GeneralError({
        error: ERROR_CODE.JSON_SCHEMA_VALIDATION_FAILED,
        error_msg: 'No file included in request body',
        data: null,
      });
    }

    const { x1, y1, x2, y2 } = assertWithSchema(req.body, UpdateMyAvatarParamsSchema);
    if (x1 > x2 || y1 > y2 || x2 - x1 !== y2 - y1) {
      throw new GeneralError({
        error: ERROR_CODE.INVALID_AVATAR_COORDINATES,
        error_msg: 'Cropped area must be a square',
        data: null,
      });
    }

    const key = uuidv4() + '.jpg';
    const buffer = await cropAvatar(req.file.buffer, x1, y1, x2, y2);
    const url = await uploadJPEG(key, buffer);
    const { error, error_msg } = await db.users.updateUser({
      where: {
        user_id: currentUser.user_id,
      },
      values: {
        avatar: url,
      },
    });
    if (error) {
      throw new GeneralError({
        error: ERROR_CODE.DATABASE_GATEWAY_ERROR,
        error_msg: 'Received non-zero code from Database Gateway when updating avatar',
        data: { response: { error, error_msg } },
      });
    }
    res.json({
      error: 0,
      error_msg: 'Successfully changed avatar',
      data: { url },
    });
  } catch (error) {
    next(error);
  }
}

//#endregion

const router = Router();
router.get('/', getMyInfo);
router.post('/update', updateMyInfo);
router.post('/change-password', updateMyPassword);
router.get('/participations', getMyParticipations);
router.post('/participations/create', createMyParticipations);
router.post('/change-avatar', avatarUpload, updateMyAvatar);

export default router;
