import { assertWithSchema } from '../validation';
import { fetchApi } from '../fetch-utils';
import { getUrl } from '../get-url';
import { JSONSchemaType } from 'ajv';

export type GetParticipationsParams = {
  contest_id: number;
  limit: number;
  offset: number;
  has_total: boolean;
};

export type GetParticipationsData = {
  total?: number;
  items: Array<Object>; // TODO: make the type more specific
};

const getParticipationsDataSchema: JSONSchemaType<GetParticipationsData> = {
  type: 'object',
  required: ['items'],
  properties: {
    total: { type: 'number', nullable: true },
    items: { type: 'array', items: { type: 'object', required: [] } },
  },
};

export async function getParticipations({ contest_id, offset, limit, has_total }: GetParticipationsParams) {
  const url = getUrl({
    origin: 'https://test.be.freecontest.net', // TODO: read from process.env
    pathname: '/db/v2/participations/read',
  });
  const { error, error_msg, data } = await fetchApi({
    url,
    method: 'POST',
    body: { where: { contest_id }, offset, limit, has_total },
  });
  const validatedData = !error && data != null ? assertWithSchema(data, getParticipationsDataSchema) : undefined;
  return { error, error_msg, data: validatedData };
}
