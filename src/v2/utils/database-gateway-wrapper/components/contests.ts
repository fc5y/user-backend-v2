import db from '../../database-gateway';
import { ERROR_CODE, GeneralError } from '../../common-errors';
import { CreateContestsParams } from '../../database-gateway/contests';

export async function getContestOrThrow({ contest_name }: { contest_name: string }) {
  const { error, error_msg, data } = await db.contests.getContests({
    offset: 0,
    limit: 1,
    has_total: false,
    contest_name,
  });

  if (error || !data) {
    throw new GeneralError({
      error: ERROR_CODE.DATABASE_GATEWAY_ERROR,
      error_msg: 'Received non-zero code from Database Gateway when getting contests',
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

  return contest;
}

export async function createContestOrThrow(params: CreateContestsParams) {
  const createResponse = await db.contests.createContests(params);
  if (createResponse.error) {
    throw new GeneralError({
      error: ERROR_CODE.DATABASE_GATEWAY_ERROR,
      error_msg: 'Received non-zero code from Database Gateway when creating contests',
      data: { response: createResponse },
    });
  }
}
