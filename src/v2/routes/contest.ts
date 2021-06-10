import { NextFunction, Request, Response, Router } from 'express';
import db from '../utils/database-gateway';
import { assertWithSchema, JSONSchemaType } from '../utils/validation';

const router = Router(); // /api/v2/contests

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

function formatMaterials(materialsRaw: string) {
  const materials = JSON.parse(materialsRaw) as Record<string, string>;
  const result = [];
  for (const key in materials) {
    result.push({ name: key, value: materials[key] });
  }
  return result;
}

function formatDateTime(dateTimeRaw: string | number) {
  if (typeof dateTimeRaw === 'number') return dateTimeRaw;
  return Math.floor(new Date(dateTimeRaw).getTime() / 1000);
}

async function getAllContests(req: Request, res: Response, next: NextFunction) {
  try {
    const { offset, limit } = assertWithSchema(req.query, getAllContestsParamsSchema);
    const response = await db.contests.getContests({ offset, limit });
    const result = {
      error: 0,
      error_msg: 'Contests',
      data: {
        contests: response.data.items.map((contest) => ({
          can_enter: contest.can_enter,
          name: contest.contest_name,
          title: contest.contest_title,
          duration: contest.duration,
          start_time: formatDateTime(contest.start_time),
          total_participations: -1, // TODO: fix this
          materials: formatMaterials(contest.materials),
        })),
      },
    };
    res.json(result);
  } catch (error) {
    next(error);
  }
}

router.get('/', getAllContests);

export default router;
