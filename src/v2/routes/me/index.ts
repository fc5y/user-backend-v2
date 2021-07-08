import db from '../../utils/database-gateway';
import { assertWithSchema, JSONSchemaType } from '../../utils/validation';
import { ERROR_CODE, GeneralError } from '../../utils/common-errors';
import { mustBeAdmin } from '../../utils/role-verification';
import { NextFunction, Request, Response, Router } from 'express';
import { getUsernameById } from '../../utils/cached-requests';
import { getContestNameById, getContestTitleById } from './utils';

const user_id = 20000; // TODO: fix later

//#region GET /api/v2/me

//#endregion

//#region  GET /api/v2/users/me/participations

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
    const { offset, limit } = assertWithSchema(req.query, getMyParticipationsParamsSchema);
    const { error, error_msg, data } = await db.participations.getParticipations({
      user_id,
      has_total: true,
      offset,
      limit,
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
      error_msg: 'My participations',
      data: {
        total: data.total,
        participations: await Promise.all(
          data.items.map(async (participation) => ({
            username: await getUsernameById(participation.user_id),
            contest_name: await getContestNameById(participation.contest_id),
            contest_title: await getContestTitleById(participation.contest_id),
            is_hidden: participation.is_hidden,
            rating: participation.rating,
            rating_change: participation.rating_change,
            score: participation.score,
            contest_rank: participation.rank_in_contest,
          })),
        ),
      },
    };
    res.json(result);
  } catch (error) {
    next(error);
  }
}

//#endregion

const router = Router();
router.get('/participations', getMyParticipations);

export default router;
