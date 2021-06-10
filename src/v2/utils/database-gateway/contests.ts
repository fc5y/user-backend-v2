import { getUrl } from '../get-url';
import { ApiResponse, fetchApi } from '../fetch-utils';
import { assertWithSchema, JSONSchemaType } from '../validation';

// #region GET /db/v2/contests

export type GetContestsParams = {
  offset: number;
  limit: number;
};

export type GetContestsData = {
  total: number;
  items: Array<{
    id: number;
    contest_name: string;
    contest_title: string;
    duration: number;
    can_enter: boolean;
    start_time: number | string;
    materials: string;
  }>;
};

const getContestsDataSchema: JSONSchemaType<GetContestsData> = {
  type: 'object',
  required: ['total', 'items'],
  properties: {
    total: { type: 'number' },
    items: {
      type: 'array',
      items: {
        type: 'object',
        required: ['id', 'contest_name', 'duration'],
        properties: {
          id: { type: 'number' },
          can_enter: { type: 'boolean' },
          contest_name: { type: 'string' },
          contest_title: { type: 'string' },
          duration: { type: 'number' },
          start_time: { type: ['number', 'string'] },
          materials: { type: 'string' },
          // TODO: complete this
        },
      },
    },
  },
};

export async function getContests(params: GetContestsParams): Promise<ApiResponse<GetContestsData>> {
  const url = getUrl({
    origin: 'https://test.be.freecontest.net', // TODO: read from process.env
    pathname: '/db/v2/contests',
    query: {
      offset: params.offset,
      limit: params.limit,
    },
  });
  const { error, error_msg, data } = await fetchApi({ url, method: 'GET' });
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
    origin: 'https://test.be.freecontest.net', // TODO: read from process.env
    pathname: '/db/v2/contests/create',
  });
  const { error, error_msg } = await fetchApi({
    url,
    method: 'POST',
    body: {
      values: {
        contest_name: params.name,
        contest_title: params.title,
        start_time: params.start_time,
        duration: params.duration,
        can_enter: params.can_enter,
      },
    },
  });
  return { error, error_msg };
}

// #endregion
