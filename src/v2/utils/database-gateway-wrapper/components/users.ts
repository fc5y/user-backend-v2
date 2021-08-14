import db from '../../database-gateway';
import { ERROR_CODE, GeneralError } from '../../common-errors';

export async function getUserOrThrow({ username }: { username: string }) {
  const { error, error_msg, data } = await db.users.getUsers({ username, offset: 0, limit: 1 });

  if (error || !data) {
    throw new GeneralError({
      error: ERROR_CODE.DATABASE_GATEWAY_ERROR,
      error_msg: 'Received non-zero code from Database Gateway when getting contests',
      data: { response: { error, error_msg, data } },
    });
  }

  const user = data.items[0];

  if (!user) {
    throw new GeneralError({
      error: ERROR_CODE.USER_NOT_FOUND,
      error_msg: 'User not found',
      data: { username },
    });
  }

  return user;
}
