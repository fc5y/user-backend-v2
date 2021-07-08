import db from '../../utils/database-gateway';
import { assertWithSchema, JSONSchemaType } from '../../utils/validation';
import { DatabaseGatewayError } from '../../utils/common-errors';
import { NextFunction, Request, Response, Router } from 'express';
import { getContestById, getUsernameById } from './utils';

const user_id = 20000; // TODO: fix later

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
      throw new DatabaseGatewayError({ error, error_msg, data });
    }
    const username = await getUsernameById(user_id);
    const result = {
      error: 0,
      error_msg: 'My participations',
      data: {
        total: data.total,
        participations: await Promise.all(
          data.items.map(async (participation) => {
            const contestInfo = await getContestById(participation.contest_id);
            return {
              username,
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

const router = Router();
router.get('/participations', getMyParticipations);

export default router;
