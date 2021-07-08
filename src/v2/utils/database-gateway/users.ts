import { getUrl } from '../get-url';
import { ApiResponse, fetchApi } from '../fetch-utils';
import { DATABASE_GATEWAY_ORIGIN } from '../common-config';
import { assertWithSchema, JSONSchemaType } from '../validation';

// #region GET /db/v2/users

export type GetUsersParams = {
  offset: number;
  limit: number;
  username: string;
};

export type GetUsersData = {
  total?: number;
  items: Array<{
    id: number;
    username: string;
    full_name: string;
    school_name: string;
    rating: number;
  }>;
};

const getUsersDataSchema: JSONSchemaType<GetUsersData> = {
  type: 'object',
  required: ['items'],
  properties: {
    total: { type: 'number', nullable: true },
    items: {
      type: 'array',
      items: {
        type: 'object',
        required: ['id', 'username', 'full_name', 'school_name'],
        properties: {
          id: { type: 'number' },
          username: { type: 'string' },
          full_name: { type: 'string' },
          school_name: { type: 'string' },
          rating: { type: 'number', nullable: true },
        },
      },
    },
  },
};

export async function getUsers({ offset, limit, username }: GetUsersParams) {
  const url = getUrl({
    origin: DATABASE_GATEWAY_ORIGIN,
    pathname: '/db/v2/users/read',
  });
  const { error, error_msg, data } = await fetchApi({
    method: 'POST',
    url,
    body: {
      where: {
        username,
      },
      offset,
      limit,
    },
  });
  const validatedData = !error && data != null ? assertWithSchema(data, getUsersDataSchema) : undefined;
  return { error, error_msg, data: validatedData };
}

// #endregion
