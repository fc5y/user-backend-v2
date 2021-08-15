import { assertWithSchema, JSONSchemaType } from '../../validation';
import { CMS_MANAGER_ORIGIN } from '../../common-config';
import { fetchApi } from '../../fetch-utils';
import { getUrl } from '../../get-url';

type GetAllContestsData = {
  contests: Array<{
    id: number;
    name: string;
    description?: string;
    start?: number;
    stop?: number;
  }>;
};

const getAllContestsDataSchema: JSONSchemaType<GetAllContestsData> = {
  type: 'object',
  required: ['contests'],
  properties: {
    contests: {
      type: 'array',
      items: {
        type: 'object',
        required: ['id', 'name'],
        properties: {
          id: {
            type: 'number',
          },
          name: {
            type: 'string',
          },
          description: {
            type: 'string',
            nullable: true,
          },
          start: {
            type: 'number',
            nullable: true,
          },
          stop: {
            type: 'number',
            nullable: true,
          },
        },
      },
    },
  },
};

export async function getAllContests({ token }: { token: string; contest_name?: string }) {
  const url = getUrl({ origin: CMS_MANAGER_ORIGIN, pathname: '/api/contests' });
  const headers = { Authorization: token };
  const { error, error_msg, data } = await fetchApi({ method: 'GET', url, headers });
  const validatedData = !error && data != null ? assertWithSchema(data, getAllContestsDataSchema) : undefined;
  return { error, error_msg, data: validatedData };
}
