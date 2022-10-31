import db from '../../utils/database-gateway';
import dbw from '../../utils/database-gateway-wrapper';
import { assertWithSchema, JSONSchemaType } from '../../utils/validation';
import { cmsManagerLogic } from '../../utils/cms-manager';
import { ERROR_CODE, GeneralError } from '../../utils/common-errors';
import { formatContest, formatParticipation, materialsToDatabaseFormat, zip } from './utils';
import { getTotalContests, getTotalParticipationsInContest } from '../../utils/cached-requests';
import { GetParticipationsData } from '../../utils/database-gateway/participations';
import { loadUser, loadUserOrThrow } from '../../utils/session-utils';
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
    // 1. Get contests
    const { offset, limit } = assertWithSchema(req.query, getAllContestsParamsSchema);
    const { error, error_msg, data } = await db.contests.getContests({ offset, limit });
    if (error || !data) {
      throw new GeneralError({
        error: ERROR_CODE.DATABASE_GATEWAY_ERROR,
        error_msg: 'Received non-zero code from Database Gateway when getting contests',
        data: { response: { error, error_msg, data } },
      });
    }

    // 2. Get my participations
    const currentUser = loadUser(req);

    const getMyParticipations = async (
      contestIds: number[],
      userId: number,
    ): Promise<Record<number, GetParticipationsData['items'][number]>> => {
      const myParticipationList = await Promise.all(
        contestIds.map(
          async (contestId) =>
            await dbw.participations.getParticipationOrUndefined({ contest_id: contestId, user_id: userId }),
        ),
      );
      return Object.fromEntries(
        zip(contestIds, myParticipationList).flatMap(([key, value]) => [value ? [key, value] : []]),
      );
    };

    const myParticipations = currentUser
      ? await getMyParticipations(
          data.items.map((contest) => contest.id),
          currentUser.user_id,
        )
      : null;

    // 3. Reply
    const result = {
      error: 0,
      error_msg: 'Contests',
      data: {
        total: await getTotalContests(),
        contests: await Promise.all(
          data.items.map(async (contest) => {
            const total_participations = await getTotalParticipationsInContest(contest.id);
            const myParticipation = myParticipations ? myParticipations[contest.id] : undefined;
            return formatContest(contest, {
              total_participations,
              my_participation: myParticipation ? formatParticipation(myParticipation) : undefined,
            });
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

// #region POST /api/v2/contests/create

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

    await dbw.contests.createContestOrThrow({
      name: body.name,
      title: body.title,
      start_time: body.start_time,
      duration: body.duration,
      can_enter: body.can_enter,
    });

    const contest = await dbw.contests.getContestOrThrow({ contest_name: body.name });

    const total_participations = await getTotalParticipationsInContest(contest.id);

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
    const contest = await dbw.contests.getContestOrThrow({ contest_name: params.contest_name });
    const currentUser = loadUser(req);
    const myParticipation = currentUser
      ? await dbw.participations.getParticipationOrUndefined({ contest_id: contest.id, user_id: currentUser.user_id })
      : undefined;
    const totalParticipations = await getTotalParticipationsInContest(contest.id);

    res.json({
      error: 0,
      error_msg: 'Contest',
      data: {
        contest: formatContest(contest, {
          total_participations: totalParticipations,
          my_participation: myParticipation ? formatParticipation(myParticipation) : undefined,
        }),
      },
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
        materials: body.materials && materialsToDatabaseFormat(body.materials),
      },
    });

    if (updateResponse.error) {
      throw new GeneralError({
        error: ERROR_CODE.DATABASE_GATEWAY_ERROR,
        error_msg: 'Received non-zero code from Database Gateway when updating contests',
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
        error_msg: 'Received non-zero code from Database Gateway when getting contests',
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
    const total_participations = await getTotalParticipationsInContest(contest.id);

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
        error_msg: 'Received non-zero code from Database Gateway when getting contests',
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
        error_msg: 'Received non-zero code from Database Gateway when deleting contests',
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

// #region POST /api/v2/contests/:contest_name/enter

type EnterContestParams = {
  contest_name: string;
};

const enterContestParamsSchema: JSONSchemaType<EnterContestParams> = {
  type: 'object',
  required: ['contest_name'],
  properties: {
    contest_name: { type: 'string' },
  },
};

export async function enterContest(req: Request, res: Response, next: NextFunction) {
  try {
    const params = assertWithSchema(req.params, enterContestParamsSchema);
    const currentUser = loadUserOrThrow(req);
    const user = await dbw.users.getUserOrThrow({ username: currentUser.username });
    const contest = await dbw.contests.getContestOrThrow({ contest_name: params.contest_name });
    const participation = await dbw.participations.getParticipationOrThrow({
      contest_id: contest.id,
      user_id: currentUser.user_id,
    });

    // 1. Ensure can_enter is true
    if (!contest.can_enter) {
      throw new GeneralError({
        error: ERROR_CODE.CONTEST_CANNOT_ENTER,
        error_msg: 'Unable to enter contest because can_enter is false',
        data: {
          contest_name: params.contest_name,
          username: currentUser.username,
        },
      });
    }

    // 2. Check if user has already been synced to CMS
    // If not, request CMS Manager to sync user
    if (!participation.synced) {
      await cmsManagerLogic.participations.createParticipationOrThrow(
        {
          contest_name: contest.contest_name,
          username: currentUser.username,
          password: participation.contest_password,
          first_name: user.full_name,
          last_name: user.school_name,
        },
        { skipIfFound: true },
      );

      // Mark user as synced in database
      await dbw.participations.markParticipationAsSyncedOrThrow({
        contest_id: contest.id,
        user_id: currentUser.user_id,
      });
    }

    // 3. Reply
    res.json({
      error: 0,
      error_msg: 'Entered',
      data: {
        contest_username: currentUser.username,
        contest_password: participation.contest_password,
        can_enter: null,
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
router.post('/:contest_name/enter', enterContest);

export default router;
