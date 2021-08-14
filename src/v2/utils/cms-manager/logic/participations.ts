import * as api from '../api';
import { CMS_MANAGER_ERROR_CODE, ERROR_CODE, GeneralError } from '../../common-errors';
import { generateTokenOrThrow } from './tokens';
import { getContestOrThrow } from './contests';

export async function createParticipationOrThrow(
  {
    contest_name,
    username,
    password,
    first_name,
    last_name,
  }: {
    contest_name: string;
    username: string;
    password: string;
    first_name: string;
    last_name: string;
  },
  {
    skipIfFound,
  }: {
    skipIfFound: boolean;
  },
) {
  const token = await generateTokenOrThrow();
  const cmsContest = await getContestOrThrow({ contest_name }, { allowCache: true });
  const contest_id = cmsContest.id;
  const responseCreateUser = await api.users.createUser({
    token,
    contest_id,
    username,
    password,
    first_name,
    last_name,
  });

  if (responseCreateUser.error && (responseCreateUser.error !== CMS_MANAGER_ERROR_CODE.EXISTED || !skipIfFound)) {
    throw new GeneralError({
      error: ERROR_CODE.CMS_MANAGER_ERROR,
      error_msg: 'Received non-zero code from CMS Manager when creating participations',
      data: { response: responseCreateUser },
    });
  }
}
