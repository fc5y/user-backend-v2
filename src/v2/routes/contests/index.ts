import db from '../../utils/database-gateway';
import { assertWithSchema, JSONSchemaType } from '../../utils/validation';
import { ERROR_CODE, GeneralError } from '../../utils/common-errors';
import { formatContest, formatDateTime, formatMaterials } from './utils';
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
          data.items.map(async (contest) => {
            const total_participations = await getTotalPartitipationsInContest(contest.id);
            return formatContest(contest, { total_participations });
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
    const body = assertWithSchema(req.body, createContestParamsSchema);

    // 1. Create contest
    const createResponse = await db.contests.createContests({
      name: body.name,
      title: body.title,
      start_time: body.start_time,
      duration: body.duration,
      can_enter: body.can_enter,
    });

    if (createResponse.error) {
      throw new GeneralError({
        error: ERROR_CODE.DATABASE_GATEWAY_ERROR,
        error_msg: 'Received non-zero code from Database Gateway when creating contest',
        data: { response: createResponse },
      });
    }

    // 2. Get contest
    const getResponse = await db.contests.getContests({
      offset: 0,
      limit: 1,
      has_total: false,
      contest_name: body.name,
    });

    if (getResponse.error || !getResponse.data) {
      throw new GeneralError({
        error: ERROR_CODE.DATABASE_GATEWAY_ERROR,
        error_msg: 'Received non-zero code from Database Gateway when getting contest',
        data: { response: getResponse },
      });
    }

    const contest = getResponse.data.items[0];

    if (!contest) {
      throw new GeneralError({
        error: ERROR_CODE.CONTEST_NOT_FOUND,
        error_msg: 'Contest not found',
        data: { contest_name: body.name },
      });
    }

    // 3. Reply
    const total_participations = await getTotalPartitipationsInContest(contest.id);
    res.json({
      error: 0,
      error_msg: 'Contest created',
      data: {
        contest: formatContest(contest, { total_participations }),
      },
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
    const params = assertWithSchema(req.params, getContestParamsSchema);

    const { error, error_msg, data } = await db.contests.getContests({
      offset: 0,
      limit: 1,
      has_total: false,
      contest_name: params.contest_name,
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
        data: { contest_name: params.contest_name },
      });
    }

    const total_participations = await getTotalPartitipationsInContest(contest.id);

    res.json({
      error: 0,
      error_msg: 'Contest',
      data: { contest: formatContest(contest, { total_participations }) },
    });
  } catch (err) {
    next(err);
  }
}

// #endregion

// #region POST /api/v2/contests/:contest_name/update

type UpdateContestBody = {
  name?: string;
  title?: string;
  start_time?: number;
  duration?: number;
  can_enter?: boolean;
  materials?: Array<{ name: string; value: string }>;
};

const updateContestBodySchema: JSONSchemaType<UpdateContestBody> = {
  type: 'object',
  required: [],
  properties: {
    name: { type: 'string', nullable: true },
    title: { type: 'string', nullable: true },
    start_time: { type: 'number', nullable: true },
    duration: { type: 'number', nullable: true },
    can_enter: { type: 'boolean', nullable: true },
    materials: {
      type: 'array',
      nullable: true,
      items: {
        type: 'object',
        required: ['name', 'value'],
        properties: {
          name: { type: 'string' },
          value: { type: 'string' },
        },
      },
    },
  },
};

type UpdateContestParams = {
  contest_name: string;
};

const updateContestParamsSchema: JSONSchemaType<UpdateContestParams> = {
  type: 'object',
  required: ['contest_name'],
  properties: {
    contest_name: { type: 'string' },
  },
};

async function updateContest(req: Request, res: Response, next: NextFunction) {
  try {
    // 1. Send update request
    const params = assertWithSchema(req.params, updateContestParamsSchema);
    const body = assertWithSchema(req.body, updateContestBodySchema);

    const updateResponse = await db.contests.updateContests({
      where: {
        name: params.contest_name,
      },
      values: {
        name: body.name,
        title: body.title,
        start_time: body.start_time,
        duration: body.duration,
        can_enter: body.can_enter,
        materials: JSON.stringify(body.materials),
      },
    });

    if (updateResponse.error) {
      throw new GeneralError({
        error: ERROR_CODE.DATABASE_GATEWAY_ERROR,
        error_msg: 'Received non-zero code from Database Gateway when updating contest',
        data: { response: updateResponse },
      });
    }

    // 2. Send get request
    const newContestName = body.name || params.contest_name;
    // note that contest name might be changed after the update request

    const getResponse = await db.contests.getContests({
      offset: 0,
      limit: 1,
      has_total: false,
      contest_name: newContestName,
    });

    if (getResponse.error || !getResponse.data) {
      throw new GeneralError({
        error: ERROR_CODE.DATABASE_GATEWAY_ERROR,
        error_msg: 'Received non-zero code from Database Gateway when updating contest',
        data: { response: getResponse },
      });
    }

    const contest = getResponse.data.items[0];

    if (!contest) {
      throw new GeneralError({
        error: ERROR_CODE.CONTEST_NOT_FOUND,
        error_msg: 'Contest not found',
        data: { contest_name: newContestName },
      });
    }

    // 3. Reply
    const total_participations = await getTotalPartitipationsInContest(contest.id);

    res.json({
      error: 0,
      error_msg: 'Contest updated',
      data: { contest: formatContest(contest, { total_participations }) },
    });
  } catch (err) {
    next(err);
  }
}

// #endregion

// #region POST /api/v2/contests/:contest_name/delete

type DeleteContestParams = {
  contest_name: string;
};

const deleteContestParamsSchema: JSONSchemaType<DeleteContestParams> = {
  type: 'object',
  required: ['contest_name'],
  properties: {
    contest_name: { type: 'string' },
  },
};

export async function deleteContest(req: Request, res: Response, next: NextFunction) {
  try {
    const params = assertWithSchema(req.params, deleteContestParamsSchema);

    // 1. Send get request
    const getResponse = await db.contests.getContests({
      offset: 0,
      limit: 1,
      has_total: false,
      contest_name: params.contest_name,
    });

    if (getResponse.error || !getResponse.data) {
      throw new GeneralError({
        error: ERROR_CODE.DATABASE_GATEWAY_ERROR,
        error_msg: 'Received non-zero code from Database Gateway when getting contest',
        data: { response: getResponse },
      });
    }

    const contest = getResponse.data.items[0];

    if (!contest) {
      throw new GeneralError({
        error: ERROR_CODE.CONTEST_NOT_FOUND,
        error_msg: 'Contest not found',
        data: { contest_name: params.contest_name },
      });
    }

    // 2. Send delete request
    const deleteResponse = await db.contests.deleteContests({
      where: { contest_name: params.contest_name },
    });

    if (deleteResponse.error) {
      throw new GeneralError({
        error: ERROR_CODE.DATABASE_GATEWAY_ERROR,
        error_msg: 'Received non-zero code from Database Gateway when deleting contest',
        data: { response: deleteResponse },
      });
    }

    // 3. Reply
    res.json({
      error: 0,
      error_msg: 'Contest deleted',
      data: {
        name: params.contest_name,
      },
    });
  } catch (error) {
    next(error);
  }
}

// #endregion

const router = Router(); // /api/v2/contests
router.get('/', getAllContests);
router.post('/create', mustBeAdmin, createContest);
router.get('/:contest_name', getContest);
router.post('/:contest_name/update', mustBeAdmin, updateContest);
router.post('/:contest_name/delete', mustBeAdmin, deleteContest);

export default router;
