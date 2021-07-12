import { ApiResponse, fetchApi } from '../fetch-utils';
import { assertWithSchema, JSONSchemaType } from '../validation';
import { DATABASE_GATEWAY_ORIGIN } from '../common-config';
import { getUrl } from '../get-url';

// #region GET /db/v2/contests

export type GetContestsParams = {
  offset: number;
  limit: number;
  has_total?: boolean;
  id?: number;
  contest_name?: string;
};

export type GetContestsData = {
  total?: number;
  items: Array<{
    id: number;
    contest_name: string;
    contest_title: string;
    duration: number;
    can_enter: boolean;
    start_time: number;
    materials: string;
    created_at: number;
    updated_at: number;
  }>;
};

const getContestsDataSchema: JSONSchemaType<GetContestsData> = {
  type: 'object',
  required: ['items'],
  properties: {
    total: { type: 'number', nullable: true },
    items: {
      type: 'array',
      items: {
        type: 'object',
        required: ['id', 'contest_name', 'contest_title', 'duration', 'can_enter', 'start_time', 'materials'],
        properties: {
          id: { type: 'number' },
          can_enter: { type: 'boolean' },
          contest_name: { type: 'string' },
          contest_title: { type: 'string' },
          duration: { type: 'number' },
          start_time: { type: 'number' },
          materials: { type: 'string' },
          created_at: { type: 'number' },
          updated_at: { type: 'number' },
        },
      },
    },
  },
};

export async function getContests({ offset, limit, has_total, id, contest_name }: GetContestsParams) {
  const url = getUrl({
    origin: DATABASE_GATEWAY_ORIGIN,
    pathname: '/db/v2/contests/read',
  });
  const { error, error_msg, data } = await fetchApi({
    method: 'POST',
    url,
    body: {
      offset,
      limit,
      where: { id, contest_name },
      has_total,
      order_by: [{ column: 'start_time', order: 'desc' }],
    },
  });
  const validatedData = !error && data != null ? assertWithSchema(data, getContestsDataSchema) : undefined;
  return { error, error_msg, data: validatedData };
}

// #endregion

// #region POST /db/v2/contests/create

export type CreateContestsParams = {
  name: string;
  title: string;
  start_time: number;
  duration: number;
  can_enter: boolean;
};

type CreateContestsData = undefined;

export async function createContests(params: CreateContestsParams): Promise<ApiResponse<CreateContestsData>> {
  const url = getUrl({
    origin: DATABASE_GATEWAY_ORIGIN,
    pathname: '/db/v2/contests/create',
  });
  const { error, error_msg, data } = await fetchApi({
    url,
    method: 'POST',
    body: {
      values: {
        contest_name: params.name,
        contest_title: params.title,
        start_time: params.start_time,
        duration: params.duration,
        can_enter: params.can_enter,
        materials: '{}',
      },
    },
  });
  return { error, error_msg, data };
}

// #endregion

// #region POST /db/v2/contests/update

export type UpdateContestsParams = {
  where: {
    name: string;
  };
  values: {
    name?: string;
    title?: string;
    start_time?: number;
    duration?: number;
    can_enter?: boolean;
    materials?: string;
  };
};

export type UpdateContestsData = undefined;

export async function updateContests(params: UpdateContestsParams): Promise<ApiResponse<UpdateContestsData>> {
  const url = getUrl({
    origin: DATABASE_GATEWAY_ORIGIN,
    pathname: '/db/v2/contests/update',
  });
  const { error, error_msg, data } = await fetchApi({
    url,
    method: 'POST',
    body: {
      where: {
        contest_name: params.where.name,
      },
      values: {
        contest_name: params.values.name,
        contest_title: params.values.title,
        start_time: params.values.start_time,
        duration: params.values.duration,
        can_enter: params.values.can_enter,
        materials: params.values.materials,
      },
    },
  });
  return { error, error_msg, data };
}

// #endregion
