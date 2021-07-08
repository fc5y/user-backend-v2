import db from '../../utils/database-gateway';

const cacheGetTotalAnnouncements: { lastEntry?: { lastUpdate: Date; value: number } } = {};
const CACHE_VALID_DURATION = 10000;

export async function getTotalAnnouncements() {
  // Return cache value if exist
  const now = new Date();
  const lastEntry = cacheGetTotalAnnouncements.lastEntry;
  if (lastEntry && now.getTime() - lastEntry.lastUpdate.getTime() <= CACHE_VALID_DURATION) {
    return lastEntry.value;
  }
  // Fetch all data from database-gateway
  const { error, data } = await db.announcements.getAnnouncements({
    offset: 0,
    limit: 0,
    has_total: true,
  });
  const result = !error && data != null && data.total != null ? data.total : -1;
  // Update cache + return result
  cacheGetTotalAnnouncements.lastEntry = {
    lastUpdate: now,
    value: result,
  };
  return result;
}
