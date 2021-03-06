import db from '../../database-gateway';
import { ERROR_CODE, GeneralError } from '../../common-errors';
import { GetUsersData } from '../../database-gateway/users';

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

export async function createUserOrThrow(params: {
  username: string;
  full_name: string;
  email: string;
  school_name: string;
  password: string;
}) {
  const createResponse = await db.users.createUser(params);
  if (createResponse.error) {
    throw new GeneralError({
      error: ERROR_CODE.DATABASE_GATEWAY_ERROR,
      error_msg: 'Received non-zero code from Database Gateway when creating users',
      data: { response: createResponse },
    });
  }
}

export async function updateUserEmailOrThrow(user_id: number, new_email: string) {
  const updateResponse = await db.users.updateUser({
    where: {
      user_id: user_id,
    },
    values: {
      email: new_email,
    },
  });
  if (updateResponse.error) {
    throw new GeneralError({
      error: ERROR_CODE.DATABASE_GATEWAY_ERROR,
      error_msg: 'Received non-zero code from Database Gateway when updating user email',
      data: { response: updateResponse },
    });
  }
}

export async function updateUserPasswordOrThrow(user_id: number, new_password: string) {
  const updateResponse = await db.users.updateUser({
    where: {
      user_id: user_id,
    },
    values: {
      password: new_password,
    },
  });
  if (updateResponse.error) {
    throw new GeneralError({
      error: ERROR_CODE.DATABASE_GATEWAY_ERROR,
      error_msg: 'Received non-zero code from Database Gateway when updating user password',
      data: { response: updateResponse },
    });
  }
}

export async function getUserWithEmail(email: string) {
  const { error, error_msg, data } = await db.users.getUsers({ email, offset: 0, limit: 1 });
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
      data: { email },
    });
  }
  return user;
}

export async function getUserOrUndefined({
  username,
  email,
  id,
}: {
  username?: string;
  email?: string;
  id?: number;
}): Promise<GetUsersData['items'][number] | undefined> {
  const { error, error_msg, data } = await db.users.getUsers({
    username,
    email,
    id,
    offset: 0,
    limit: 1,
  });

  if (error || !data) {
    throw new GeneralError({
      error: ERROR_CODE.DATABASE_GATEWAY_ERROR,
      error_msg: 'Received non-zero code from Database Gateway when getting users',
      data: { response: { error, error_msg, data } },
    });
  }

  return data.items[0] || undefined;
}
