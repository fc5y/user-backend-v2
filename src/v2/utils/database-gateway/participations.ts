import { assertWithSchema, JSONSchemaType } from '../validation';
import { DATABASE_GATEWAY_ORIGIN } from '../common-config';
import { fetchApi } from '../fetch-utils';
import { getUrl } from '../get-url';

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
