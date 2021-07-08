import { assertWithSchema, JSONSchemaType } from '../validation';
import { DATABASE_GATEWAY_ORIGIN } from '../common-config';
import { fetchApi } from '../fetch-utils';
import { getUrl } from '../get-url';

export type GetParticipationsParams = {
  contest_id?: number;
  user_id?: number;
  limit: number;
  offset: number;
  has_total: boolean;
};

export type GetParticipationsData = {
  total?: number;
  items: Array<{
    contest_id: number;
    rank_in_contest: number;
    rating: number;
    rating_change: number;
    score: number;
    is_hidden: boolean;
  }>;
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
        required: ['contest_id', 'rank_in_contest', 'rating', 'rating_change', 'score', 'is_hidden'],
        properties: {
          contest_id: { type: 'number' },
          rank_in_contest: { type: 'number' },
          rating: { type: 'number' },
          rating_change: { type: 'number' },
          score: { type: 'number' },
          is_hidden: { type: 'boolean' },
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
