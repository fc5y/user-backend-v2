import db from '../../utils/database-gateway';

export function formatMaterials(materialsRaw: string) {
  const materials = JSON.parse(materialsRaw) as Record<string, string>;
  const result = [];
  for (const key in materials) {
    result.push({ name: key, value: materials[key] });
  }
  return result;
}

export function formatDateTime(dateTimeRaw: string | number) {
  if (typeof dateTimeRaw === 'number') return dateTimeRaw;
  return Math.floor(new Date(dateTimeRaw).getTime() / 1000);
}

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
