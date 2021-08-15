import { assertWithSchema, JSONSchemaType } from '../../validation';
import { CMS_MANAGER_ORIGIN } from '../../common-config';
import { fetchApi } from '../../fetch-utils';
import { getUrl } from '../../get-url';

export async function createUser({
  token,
  contest_id,
  username,
  password,
  first_name,
  last_name,
}: {
  token: string;
  contest_id: number;
  username: string;
  password: string;
  first_name: string;
  last_name: string;
}) {
  const url = getUrl({ origin: CMS_MANAGER_ORIGIN, pathname: '/api/users' });
  const headers = { Authorization: token };
  const { error, error_msg, data } = await fetchApi({
    method: 'POST',
    url,
    headers,
    body: {
      contest_id,
      users: [{ username, password, first_name, last_name }],
    },
  });
  return { error, error_msg, data };
}

type GetUsersData = {
  users: Array<{
    username: string;
  }>;
};

const getUsersDataSchema: JSONSchemaType<GetUsersData> = {
  type: 'object',
  required: ['users'],
  properties: {
    users: {
      type: 'array',
      items: {
        type: 'object',
        required: ['username'],
        properties: {
          username: {
            type: 'string',
          },
        },
      },
    },
  },
};

export async function getUsers({ token, contest_name }: { token: string; contest_name?: string }) {
  const url = getUrl({ origin: CMS_MANAGER_ORIGIN, pathname: '/api/users', query: { contest_name } });
  const headers = { Authorization: token };
  const { error, error_msg, data } = await fetchApi({ method: 'GET', url, headers });
  const validatedData = !error && data != null ? assertWithSchema(data, getUsersDataSchema) : undefined;
  return { error, error_msg, data: validatedData };
}
