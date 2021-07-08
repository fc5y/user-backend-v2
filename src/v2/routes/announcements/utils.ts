import db from '../../utils/database-gateway';

export async function getTotalAnnouncements() {
  const { error, error_msg, data } = await db.announcements.getAnnouncements({
    offset: 0,
    limit: 99999,
  });
  let result = -1;
  if (data && !error) {
    result = data.items.length;
  }
  return result;
}
