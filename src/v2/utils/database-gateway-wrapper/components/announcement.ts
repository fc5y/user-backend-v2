import db from '../../database-gateway';
import { ERROR_CODE, GeneralError } from '../../common-errors';
import { GetAnnouncementsData } from '../../database-gateway/announcements';

export async function getAnnouncementOrUndefined(announcement_name: string) {
  const { error, error_msg, data } = await db.announcements.getAnnouncements({
    offset: 0,
    limit: 1,
    announcement_name: announcement_name,
  });
  if (error || !data) {
    throw new GeneralError({
      error: ERROR_CODE.DATABASE_GATEWAY_ERROR,
      error_msg: 'Received non-zero code from Database Gateway when getting contests',
      data: { response: { error, error_msg, data } },
    });
  }
  return data.items[0] || undefined;
}
