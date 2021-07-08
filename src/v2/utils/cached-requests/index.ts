import db from '../database-gateway';

const CACHE_VALID_DURATION = 10000; // 10 seconds
const cacheGetTotalPartitipationsInContest: Record<number, { lastUpdate: Date; value: number }> = {};

export async function getTotalPartitipationsInContest(contest_id: number) {
  // 1. If contest_id is found in cache, return the cached value
  const now = new Date();
  const lastEntry = cacheGetTotalPartitipationsInContest[contest_id];
  if (lastEntry && now.getTime() - lastEntry.lastUpdate.getTime() <= CACHE_VALID_DURATION) {
    return lastEntry.value;
  }
  // 2. Fetch data from database gateway
  const { error, data } = await db.participations.getParticipations({
    contest_id,
    has_total: true,
    offset: 0,
    limit: 0,
  });
  const result = !error && data != null && data.total != null ? data.total : -1;
  // 3. Store the result in cache and return the result
  cacheGetTotalPartitipationsInContest[contest_id] = { lastUpdate: now, value: result };
  return result;
}

const cacheGetTotalContests: { lastEntry?: { lastUpdate: Date; value: number } } = {};

export async function getTotalContests() {
  // 1. If contest_id is found in cache, return the cached value
  const now = new Date();
  const lastEntry = cacheGetTotalContests.lastEntry;
  if (lastEntry && now.getTime() - lastEntry.lastUpdate.getTime() <= CACHE_VALID_DURATION) {
    return lastEntry.value;
  }
  // 2. Fetch data from database gateway
  const { error, data } = await db.contests.getContests({
    offset: 0,
    limit: 0,
    has_total: true,
  });
  const result = !error && data != null && data.total != null ? data.total : -1;
  // 3. Store the result in cache and return the result
  cacheGetTotalContests.lastEntry = {
    lastUpdate: now,
    value: result,
  };
  return result;
}

//#region Get username by id
const cachedGetUsernameById: Record<number, { lastUpdate: Date; value: string }> = {};

export async function getUsernameById(user_id: number) {
  // 1. If user_id is found in cache, return the cached value
  const now = new Date();
  const lastEntry = cachedGetUsernameById[user_id];
  if (lastEntry && now.getTime() - lastEntry.lastUpdate.getTime() <= CACHE_VALID_DURATION) {
    return lastEntry.value;
  }
  // 2. Fetch data from database gateway
  const { error, data } = await db.users.getUsers({
    offset: 0,
    limit: 1,
    id: user_id,
  });
  const result = !error && data != null && data.items.length ? data.items[0].username : '';
  // 3. Store result in cache and return
  cachedGetUsernameById[user_id] = {
    lastUpdate: now,
    value: result,
  };
  return result;
}

//#endregion

//#region get contest name and title by id

const cacheGetContestNameAndTitleById: Record<
  number,
  { lastUpdate: Date; contest_name: string; contest_title: string }
> = {};

export async function getContestNameAndTitleById(contest_id: number) {
  // 1. If user_id is found in cache, return the cached value
  const now = new Date();
  const lastEntry = cacheGetContestNameAndTitleById[contest_id];
  if (lastEntry && now.getTime() - lastEntry.lastUpdate.getTime() <= CACHE_VALID_DURATION) {
    return lastEntry;
  }
  // 2. Fetch data from database gateway
  const { error, data } = await db.contests.getContests({
    offset: 0,
    limit: 1,
    id: contest_id,
  });
  const result =
    !error && data != null && data.items.length
      ? { contest_name: data.items[0].contest_name, contest_title: data.items[0].contest_title }
      : { contest_name: '', contest_title: '' };
  // 3. Store result in cache and return
  cacheGetContestNameAndTitleById[contest_id] = {
    lastUpdate: now,
    contest_name: result.contest_name,
    contest_title: result.contest_title,
  };
  return result;
}
