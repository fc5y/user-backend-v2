import db from '../../utils/database-gateway';
import { ERROR_CODE, GeneralError } from '../../utils/common-errors';

export async function getUserIdByUsername(username: string) {
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
  return { user_id: data.items[0].id };
}

export async function getContestByContestId(contest_id: number) {
  const { error, error_msg, data } = await db.contests.getContests({
    offset: 0,
    limit: 1,
    id: contest_id,
  });
  if (error || !data) {
    throw new GeneralError({
      error: ERROR_CODE.DATABASE_GATEWAY_ERROR,
      error_msg: 'Received non-zero code from Database Gateway when fetching contests',
      data: { response: { error, error_msg, data } },
    });
  }
  if (data.items.length === 0) {
    throw new GeneralError({
      error: ERROR_CODE.CONTEST_NOT_FOUND,
      error_msg: 'Cannot find any contest which matches the given contest id',
      data: { response: { error, error_msg, data } },
    });
  }
  return { contest_name: data.items[0].contest_name, contest_title: data.items[0].contest_title };
}
