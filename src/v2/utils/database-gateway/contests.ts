import { getUrl } from '../get-url';
import { http } from '../fetch-utils';
import { ApiResponse } from './types';
import { assertWithSchema, JSONSchemaType } from '../validation';

// #region GET /db/v2/contests

type GetContestsParams = {
  offset: number;
  limit: number;
};

type GetContestsResponse = ApiResponse<{
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
}>;

const getContestsResponseSchema: JSONSchemaType<GetContestsResponse> = {
  type: 'object',
  required: ['error', 'error_msg', 'data'],
  properties: {
    error: { type: 'number' },
    error_msg: { type: 'string' },
    data: {
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
    },
  },
};

export async function getContests(params: GetContestsParams): Promise<GetContestsResponse> {
  const url = getUrl({
    origin: 'https://test.be.freecontest.net',
    pathname: '/db/v2/contests',
    query: {
      offset: params.offset,
      limit: params.limit,
    },
  });
  const response = await http({ url, method: 'GET' });
  return assertWithSchema(response, getContestsResponseSchema);
}

// #endregion
