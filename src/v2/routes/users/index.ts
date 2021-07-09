import db from '../../utils/database-gateway';
import { assertWithSchema, JSONSchemaType } from '../../utils/validation';
import { NextFunction, Request, Response, Router } from 'express';
import { ERROR_CODE, GeneralError } from '../../utils/common-errors';
import { getUserIdByUsername, getContestByContestId } from './utils';
import { getTotalPartitipationsInContest } from '../../utils/cached-requests';

// #region GET /api/v2/users/{username}

type GetUserParams = {
  username: string;
};

const getUserParamsSchema: JSONSchemaType<GetUserParams> = {
  type: 'object',
  required: ['username'],
  properties: {
    username: { type: 'string' },
  },
};

async function getUserByUsername(req: Request, res: Response, next: NextFunction) {
  try {
    const { username } = assertWithSchema(req.params, getUserParamsSchema);
    const { error, error_msg, data } = await db.users.getUsers({
      offset: 0,
      limit: 1,
      username,
    });
    if (error || !data) {
      throw new GeneralError({
        error: ERROR_CODE.DATABASE_GATEWAY_ERROR,
        error_msg: 'Received non-zero code from Database Gateway when fetching users',
        data: { response: { error, error_msg, data } },
      });
    }
    if (data.items.length === 0) {
      throw new GeneralError({
        error: ERROR_CODE.USER_NOT_FOUND,
        error_msg: 'Cannot find any user who matches the given username',
        data: { response: { error, error_msg, data } },
      });
    }
    const result = {
      error: 0,
      error_msg: 'User',
      data: {
        user: {
          username: data.items[0].username,
          full_name: data.items[0].full_name,
          school_name: data.items[0].school_name,
          rating: data.items[0].rating === undefined ? null : data.items[0].rating,
        },
      },
    };
    res.json(result);
  } catch (error) {
    next(error);
  }
}

// #endregion

// #region GET /api/v2/users/{username}/participations

type getParticipationsByUsernameParams = {
  username: string;
};

const getParticipationsByUsernameParamsSchema: JSONSchemaType<getParticipationsByUsernameParams> = {
  type: 'object',
  required: ['username'],
  properties: {
    username: { type: 'string' },
  },
};

type getParticipationsByUsernameQuery = {
  offset: number;
  limit: number;
};

const getParticipationsByUsernameQuerySchema: JSONSchemaType<getParticipationsByUsernameQuery> = {
  type: 'object',
  required: ['offset', 'limit'],
  properties: {
    offset: { type: 'number' },
    limit: { type: 'number' },
  },
};

async function getParticipationsByUsername(req: Request, res: Response, next: NextFunction) {
  try {
    const { username } = assertWithSchema(req.params, getParticipationsByUsernameParamsSchema);
    const { user_id } = await getUserIdByUsername(username);
    const { offset, limit } = assertWithSchema(req.query, getParticipationsByUsernameQuerySchema);
    const { error, error_msg, data } = await db.participations.getParticipations({
      user_id,
      offset,
      limit,
      has_total: true,
    });
    if (error || !data) {
      throw new GeneralError({
        error: ERROR_CODE.DATABASE_GATEWAY_ERROR,
        error_msg: 'Received non-zero code from Database Gateway when fetching participations',
        data: { response: { error, error_msg, data } },
      });
    }
    const result = {
      error: 0,
      error_msg: 'User participations',
      data: {
        total: data.items.length,
        participations: await Promise.all(
          data.items.map(async (participation) => {
            const { contest } = await getContestByContestId(participation.contest_id);
            return {
              username,
              contest_name: contest.contest_name,
              contest_title: contest.contest_title,
              contest_total_participations: await getTotalPartitipationsInContest(participation.contest_id),
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

// #endregion

const router = Router(); // /api/v2/users
router.get('/:username', getUserByUsername);
router.get('/:username/participations', getParticipationsByUsername);

export default router;
