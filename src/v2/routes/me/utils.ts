import { ContestNotFoundError, DatabaseGatewayError } from '../../utils/common-errors';
import db from '../../utils/database-gateway';

export async function getContestById(contest_id: number) {
  const { error, error_msg, data } = await db.contests.getContests({
    offset: 0,
    limit: 1,
    id: contest_id,
  });
  if (!error || !data) {
    throw new DatabaseGatewayError({ error, error_msg, data });
  }
  if (!data.items.length) {
    throw new ContestNotFoundError({ error, error_msg, data });
  }
  return {
    contest_name: data.items[0].contest_name,
    contest_title: data.items[0].contest_title,
  };
}

export async function getUsernameById(user_id: number) {
  const { error, data } = await db.users.getUsers({
    offset: 0,
    limit: 1,
    id: user_id,
  });
  const result = !error && data != null && data.items.length ? data.items[0].username : '';
  return result;
}
