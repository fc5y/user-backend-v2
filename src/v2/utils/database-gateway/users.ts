import { getUrl } from '../get-url';
import { ApiResponse, fetchApi } from '../fetch-utils';
import { DATABASE_GATEWAY_ORIGIN } from '../common-config';
import { assertWithSchema, JSONSchemaType } from '../validation';

// #region POST /db/v2/users/read

export type GetUsersParams = {
  offset: number;
  limit: number;
  username?: string;
  id?: number;
};

export type GetUsersData = {
  total?: number;
  items: Array<{
    id: number;
    username: string;
    full_name: string;
    school_name: string;
    password: string;
    email: string;
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
        required: ['id', 'username', 'full_name', 'school_name', 'email', 'password'],
        properties: {
          id: { type: 'number' },
          username: { type: 'string' },
          full_name: { type: 'string' },
          school_name: { type: 'string' },
          email: { type: 'string' },
          password: { type: 'string' },
          rating: { type: 'number', nullable: true },
        },
      },
    },
  },
};

export async function getUsers({ offset, limit, username, id }: GetUsersParams) {
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
        id,
      },
      offset,
      limit,
    },
  });
  const validatedData = !error && data != null ? assertWithSchema(data, getUsersDataSchema) : undefined;
  return { error, error_msg, data: validatedData };
}

// #endregion

//#region POST /db/v2/users/update

export type UpdateUserParams = {
  user_id: number;
  username?: string;
  full_name?: string;
  email?: string;
  school_name?: string;
  password?: string;
  avatar?: string;
};

export async function updateUser(params: UpdateUserParams) {
  const url = getUrl({
    origin: DATABASE_GATEWAY_ORIGIN,
    pathname: '/db/v2/users/update',
  });
  const { error, error_msg, data } = await fetchApi({
    url,
    method: 'POST',
    body: {
      where: { id: params.user_id },
      values: {
        username: params.username,
        full_name: params.full_name,
        email: params.email,
        school_name: params.school_name,
        password: params.password,
        avatar: params.avatar,
      },
    },
  });
  return { error, error_msg, data };
}

//#endregion

//#region POST /db/v2/users/create

export type CreateUserParams = {
  username: string;
  full_name: string;
  email: string;
  school_name: string;
  password: string;
};

export async function createUser(params: CreateUserParams) {
  const url = getUrl({
    origin: DATABASE_GATEWAY_ORIGIN,
    pathname: '/db/v2/users/create',
  });

  const { error, error_msg, data } = await fetchApi({
    url,
    method: 'POST',
    body: {
      values: {
        username: params.username,
        full_name: params.full_name,
        email: params.email,
        school_name: params.school_name,
        password: params.password,
      },
    },
  });
  return { error, error_msg, data };
}

//#endregion
