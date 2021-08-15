import * as api from '../api';
import LRUCache from 'lru-cache';
import { ERROR_CODE, GeneralError } from '../../common-errors';
import { generateTokenOrThrow } from './tokens';

const cacheContests = new LRUCache<string, { id: number; name: string }>({
  max: 16, // 16 values
  maxAge: 60000, // 1 minute
  stale: false,
  updateAgeOnGet: false,
});

export async function getAllContestsOrThrow() {
  const token = await generateTokenOrThrow();
  const response = await api.contests.getAllContests({ token });

  if (response.error || !response.data) {
    throw new GeneralError({
      error: ERROR_CODE.CMS_MANAGER_ERROR,
      error_msg: 'Received non-zero code from CMS Manager when getting contests',
      data: { response },
    });
  }

  return response.data.contests;
}

export async function getContestOrThrow(
  { contest_name }: { contest_name: string },
  { allowCache = true }: { allowCache?: boolean } = {},
) {
  if (allowCache && cacheContests.has(contest_name)) {
    const contest = cacheContests.get(contest_name);
    if (contest) return contest;
  }
  // since the number of contests is small, it's okay to fetch all contests at once
  const contests = await getAllContestsOrThrow();
  const contest = contests.find((contest) => contest.name === contest_name);
  if (!contest) {
    throw new GeneralError({
      error: ERROR_CODE.CMS_MANAGER_CONTEST_NOT_FOUND,
      error_msg: 'CMS contest not found',
      data: { contest_name },
    });
  }
  cacheContests.set(contest.name, contest);
  return contest;
}
