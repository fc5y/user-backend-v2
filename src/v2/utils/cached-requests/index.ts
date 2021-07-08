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
