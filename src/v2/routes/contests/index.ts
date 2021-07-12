import db from '../../utils/database-gateway';
import { assertWithSchema, JSONSchemaType } from '../../utils/validation';
import { ERROR_CODE, GeneralError } from '../../utils/common-errors';
import { formatDateTime, formatMaterials } from './utils';
import { getTotalContests, getTotalPartitipationsInContest } from '../../utils/cached-requests';
import { mustBeAdmin } from '../../utils/role-verification';
import { NextFunction, Request, Response, Router } from 'express';

// #region GET /api/v2/contests

type GetAllContestsParams = {
  offset: number;
  limit: number;
};

const getAllContestsParamsSchema: JSONSchemaType<GetAllContestsParams> = {
  type: 'object',
  required: ['offset', 'limit'],
  properties: {
    offset: { type: 'integer' },
    limit: { type: 'integer' },
  },
};

async function getAllContests(req: Request, res: Response, next: NextFunction) {
  try {
    const { offset, limit } = assertWithSchema(req.query, getAllContestsParamsSchema);
    const { error, error_msg, data } = await db.contests.getContests({ offset, limit });
    if (error || !data) {
      throw new GeneralError({
        error: ERROR_CODE.DATABASE_GATEWAY_ERROR,
        error_msg: 'Received non-zero code from Database Gateway when fetching contests',
        data: { response: { error, error_msg, data } },
      });
    }
    const result = {
      error: 0,
      error_msg: 'Contests',
      data: {
        total: await getTotalContests(),
        contests: await Promise.all(
          data.items.map(async (contest) => ({
            can_enter: contest.can_enter,
            name: contest.contest_name,
            title: contest.contest_title,
            duration: contest.duration,
            start_time: formatDateTime(contest.start_time),
            total_participations: await getTotalPartitipationsInContest(contest.id),
            materials: formatMaterials(contest.materials),
          })),
        ),
      },
    };
    res.json(result);
  } catch (error) {
    next(error);
  }
}

// #endregion

// #region POST /api/v2/contests

type CreateContestParams = {
  name: string;
  title: string;
  start_time: number;
  duration: number;
  can_enter: boolean;
};

const createContestParamsSchema: JSONSchemaType<CreateContestParams> = {
  type: 'object',
  required: ['name', 'title', 'start_time', 'duration', 'can_enter'],
  properties: {
    name: { type: 'string' },
    title: { type: 'string' },
    start_time: { type: 'integer' },
    duration: { type: 'integer' },
    can_enter: { type: 'boolean' },
  },
};

async function createContest(req: Request, res: Response, next: NextFunction) {
  try {
    const { name, title, start_time, duration, can_enter } = assertWithSchema(req.body, createContestParamsSchema);
    const { error, error_msg, data } = await db.contests.createContests({
      name,
      title,
      start_time,
      duration,
      can_enter,
    });
    if (error) {
      throw new GeneralError({
        error: ERROR_CODE.DATABASE_GATEWAY_ERROR,
        error_msg: 'Received non-zero code from Database Gateway when creating contest',
        data: { response: { error, error_msg, data } },
      });
    }
    res.json({
      error: 0,
      error_msg: 'Contest created',
    });
  } catch (error) {
    next(error);
  }
}

// #endregion

// #region GET /api/v2/contests/:contest_name

type GetContestParams = {
  contest_name: string;
};

const getContestParamsSchema: JSONSchemaType<GetContestParams> = {
  type: 'object',
  required: ['contest_name'],
  properties: {
    contest_name: { type: 'string' },
  },
};

async function getContest(req: Request, res: Response, next: NextFunction) {
  try {
    const { contest_name } = assertWithSchema(req.params, getContestParamsSchema);
    const { error, error_msg, data } = await db.contests.getContests({
      offset: 0,
      limit: 1,
      has_total: false,
      contest_name,
    });

    if (error || !data) {
      throw new GeneralError({
        error: ERROR_CODE.DATABASE_GATEWAY_ERROR,
        error_msg: 'Received non-zero code from Database Gateway when getting contest',
        data: { response: { error, error_msg, data } },
      });
    }

    const contest = data.items[0];

    if (!contest) {
      throw new GeneralError({
        error: ERROR_CODE.CONTEST_NOT_FOUND,
        error_msg: 'Contest not found',
        data: { contest_name },
      });
    }

    res.json({
      error: 0,
      error_msg: 'Contest',
      data: {
        contest: {
          name: contest.contest_name,
          title: contest.contest_title,
          start_time: contest.start_time,
          duration: contest.duration,
          total_participations: await getTotalPartitipationsInContest(contest.id),
          can_enter: contest.can_enter,
          materials: formatMaterials(contest.materials),
        },
      },
    });
  } catch (err) {
    next(err);
  }
}

// #endregion

const router = Router(); // /api/v2/contests
router.get('/', getAllContests);
router.post('/create', mustBeAdmin, createContest);
router.get('/:contest_name', getContest);

export default router;
