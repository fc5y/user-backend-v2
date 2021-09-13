import { ApiResponse, fetchApi } from '../fetch-utils';
import { assertWithSchema, JSONSchemaType } from '../validation';
import { DATABASE_GATEWAY_ORIGIN } from '../common-config';
import { getUrl } from '../get-url';

// #region POST /db/v2/participations/read

export type GetParticipationsParams = {
  user_id?: number;
  contest_id?: number;
  limit: number;
  offset: number;
  has_total: boolean;
};

export type GetParticipationsData = {
  total?: number;
  items: Array<{
    user_id: number;
    contest_id: number;
    rank_in_contest: number;
    rating: number;
    rating_change: number;
    score: number;
    is_hidden: boolean;
    contest_password: string;
    synced: boolean;
  }>; // TODO: make the type more specific
};

const getParticipationsDataSchema: JSONSchemaType<GetParticipationsData> = {
  type: 'object',
  required: ['items'],
  properties: {
    total: { type: 'number', nullable: true },
    items: {
      type: 'array',
      items: {
        type: 'object',
        required: [
          'user_id',
          'contest_id',
          'rank_in_contest',
          'rating',
          'rating_change',
          'score',
          'is_hidden',
          'contest_password',
          'synced',
        ],
        properties: {
          user_id: { type: 'integer' },
          contest_id: { type: 'integer' },
          rank_in_contest: { type: 'integer' },
          rating: { type: 'integer' },
          rating_change: { type: 'integer' },
          score: { type: 'integer' },
          is_hidden: { type: 'boolean' },
          contest_password: { type: 'string' },
          synced: { type: 'boolean' },
        },
      },
    },
  },
};

export async function getParticipations({ contest_id, user_id, offset, limit, has_total }: GetParticipationsParams) {
  const url = getUrl({
    origin: DATABASE_GATEWAY_ORIGIN,
    pathname: '/db/v2/participations/read',
  });
  const { error, error_msg, data } = await fetchApi({
    url,
    method: 'POST',
    body: { where: { contest_id, user_id }, offset, limit, has_total },
  });
  const validatedData = !error && data != null ? assertWithSchema(data, getParticipationsDataSchema) : undefined;
  return { error, error_msg, data: validatedData };
}

// #endregion

// #region POST /db/v2/participations/create

export type CreateMyParticipationsParams = {
  user_id: number;
  contest_id: number;
  rank_in_contest: number;
  rating: number;
  rating_change: number;
  score: number;
  is_hidden: boolean;
  contest_password: string;
  synced: boolean;
};

export async function createMyParticipations(params: CreateMyParticipationsParams) {
  const url = getUrl({
    origin: DATABASE_GATEWAY_ORIGIN,
    pathname: '/db/v2/participations/create',
  });
  const { error, error_msg, data } = await fetchApi({
    url,
    method: 'POST',
    body: {
      values: {
        user_id: params.user_id,
        contest_id: params.contest_id,
        rank_in_contest: params.rank_in_contest,
        rating: params.rating,
        rating_change: params.rating_change,
        score: params.score,
        is_hidden: params.is_hidden,
        contest_password: params.contest_password,
        synced: params.synced,
      },
    },
  });
  return { error, error_msg, data };
}

// #endregion

// #region POST /db/v2/participations/update

export type UpdateParticipationsParams = {
  where: {
    user_id: number;
    contest_id: number;
  };
  values: {
    user_id?: number;
    contest_id?: number;
    rank_in_contest?: number;
    rating?: number;
    rating_change?: number;
    score?: number;
    is_hidden?: boolean;
    contest_password?: string;
    synced?: boolean;
  };
};

export type UpdateParticipationsData = undefined;

export async function updateParticipations(
  params: UpdateParticipationsParams,
): Promise<ApiResponse<UpdateParticipationsData>> {
  const url = getUrl({
    origin: DATABASE_GATEWAY_ORIGIN,
    pathname: '/db/v2/participations/update',
  });
  const { error, error_msg, data } = await fetchApi({
    url,
    method: 'POST',
    body: {
      where: {
        user_id: params.where.user_id,
        contest_id: params.where.contest_id,
      },
      values: {
        user_id: params.values.user_id,
        contest_id: params.values.contest_id,
        rank_in_contest: params.values.rank_in_contest,
        rating: params.values.rating,
        rating_change: params.values.rating_change,
        score: params.values.score,
        is_hidden: params.values.is_hidden,
        contest_password: params.values.contest_password,
        synced: params.values.synced,
      },
    },
  });
  return { error, error_msg, data };
}

// #endregion
