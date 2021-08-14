import db from '../../database-gateway';
import { ERROR_CODE, GeneralError } from '../../common-errors';

export async function getParticipationOrThrow({ contest_id, user_id }: { contest_id: number; user_id: number }) {
  const { error, error_msg, data } = await db.participations.getParticipations({
    contest_id,
    user_id,
    offset: 0,
    limit: 1,
    has_total: false,
  });

  if (error || !data) {
    throw new GeneralError({
      error: ERROR_CODE.DATABASE_GATEWAY_ERROR,
      error_msg: 'Received non-zero code from Database Gateway when getting participations',
      data: { response: { error, error_msg, data } },
    });
  }

  const participation = data.items[0];

  if (!participation) {
    throw new GeneralError({
      error: ERROR_CODE.PARTICIPATION_NOT_FOUND,
      error_msg: 'Participation not found',
      data: { contest_id, user_id },
    });
  }

  return participation;
}
