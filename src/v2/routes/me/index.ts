import db from '../../utils/database-gateway';
import dbw from '../../utils/database-gateway-wrapper';
import bcrypt from 'bcryptjs';
import { assertWithSchema, JSONSchemaType } from '../../utils/validation';
import { GeneralError, ERROR_CODE } from '../../utils/common-errors';
import { NextFunction, Request, Response, Router } from 'express';
import { generateContestPassword, getContestById, getContestIdByName, getHashedPassword, getUserById } from './utils';
import { loadUser } from '../../utils/session-utils';
import { assertPassword } from '../../utils/auth/utils';

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
        user: {
          username: data.items[0].username,
          full_name: data.items[0].full_name,
          school_name: data.items[0].school_name,
          email: data.items[0].email,
          rating: data.items[0].rating,
        },
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
};

const updateMyInfoParamsSchema: JSONSchemaType<UpdateMyInfoParams> = {
  type: 'object',
  required: ['full_name', 'school_name'],
  properties: {
    full_name: { type: 'string' },
    school_name: { type: 'string' },
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
    const { full_name, school_name } = assertWithSchema(req.body, updateMyInfoParamsSchema);

    const updateResponse = await db.users.updateUser({
      where: {
        user_id,
      },
      values: {
        full_name,
        school_name,
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
        user: {
          username: user.username,
          full_name: user.full_name,
          school_name: user.school_name,
          email: user.email,
          rating: user.rating,
        },
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

const router = Router();
router.get('/', getMyInfo);
router.post('/update', updateMyInfo);
router.post('/change-password', updateMyPassword);
router.get('/participations', getMyParticipations);
router.post('/participations/create', createMyParticipations);

export default router;
