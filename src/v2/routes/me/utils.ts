import { ERROR_CODE, GeneralError } from '../../utils/common-errors';
import db from '../../utils/database-gateway';
import bcrypt from 'bcryptjs';

export async function getContestById(contest_id: number) {
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
  if (!data.items.length) {
    throw new GeneralError({
      error: ERROR_CODE.CONTEST_NOT_FOUND,
      error_msg: 'Can not find any contest match the given info',
      data: { response: { error, error_msg, data } },
    });
  }
  return {
    contest_name: data.items[0].contest_name,
    contest_title: data.items[0].contest_title,
  };
}

export async function getContestIdByName(contest_name: string) {
  const { error, error_msg, data } = await db.contests.getContests({
    offset: 0,
    limit: 1,
    contest_name,
  });
  if (error || !data) {
    throw new GeneralError({
      error: ERROR_CODE.DATABASE_GATEWAY_ERROR,
      error_msg: 'Received non-zero code from Database Gateway when fetching contests',
      data: { response: { error, error_msg, data } },
    });
  }
  if (!data.items.length) {
    throw new GeneralError({
      error: ERROR_CODE.CONTEST_NOT_FOUND,
      error_msg: 'Can not find any contest match the given info',
      data: { response: { error, error_msg, data } },
    });
  }
  return data.items[0].id;
}

export async function getUserById(user_id: number) {
  const { error, error_msg, data } = await db.users.getUsers({
    offset: 0,
    limit: 1,
    id: user_id,
  });
  if (error || !data) {
    throw new GeneralError({
      error: ERROR_CODE.DATABASE_GATEWAY_ERROR,
      error_msg: 'Received non-zero code from Database Gateway when fetching contests',
      data: { response: { error, error_msg, data } },
    });
  }
  if (!data.items.length) {
    throw new GeneralError({
      error: ERROR_CODE.USER_NOT_FOUND,
      error_msg: 'Can not find any user match the given info',
      data: { response: { error, error_msg, data } },
    });
  }
  return data.items[0];
}

export async function getHashedPassword(password: string) {
  const hashedPassword = await bcrypt.hash(password, await bcrypt.genSalt());
  return hashedPassword;
}

export function generateContestPassword() {
  return 'fc-' + String(Math.floor(Math.random() * 1000000)).padStart(6, '0');
}
