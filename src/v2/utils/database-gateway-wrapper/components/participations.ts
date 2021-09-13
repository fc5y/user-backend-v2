import db from '../../database-gateway';
import { ERROR_CODE, GeneralError } from '../../common-errors';
import { GetParticipationsData } from '../../database-gateway/participations';

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

export async function getParticipationOrUndefined({
  contest_id,
  user_id,
}: {
  contest_id: number;
  user_id: number;
}): Promise<GetParticipationsData['items'][number] | undefined> {
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

  return data.items[0] || undefined;
}

export async function markParticipationAsSyncedOrThrow({
  contest_id,
  user_id,
}: {
  contest_id: number;
  user_id: number;
}): Promise<void> {
  const { error, error_msg, data } = await db.participations.updateParticipations({
    where: {
      contest_id,
      user_id,
    },
    values: {
      synced: true,
    },
  });

  if (error || !data) {
    throw new GeneralError({
      error: ERROR_CODE.DATABASE_GATEWAY_ERROR,
      error_msg: 'Received non-zero code from Database Gateway when getting users',
      data: { response: { error, error_msg } },
    });
  }
}
