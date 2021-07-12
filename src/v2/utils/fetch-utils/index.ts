import fetch from 'node-fetch';
import logger from '../logger';
import { assertWithSchema, JSONSchemaType } from '../validation';

export type ApiResponse<T = any> = {
  error: number;
  error_msg: string;
  data?: T;
};

type Params = {
  url: string;
  method: 'GET' | 'POST';
  headers?: Record<string, string>;
  body?: any;
};

const DEFAULT_HEADERS = {
  'Content-Type': 'application/json',
};

const apiResponseSchema: JSONSchemaType<ApiResponse> = {
  type: 'object',
  required: ['error', 'error_msg'],
  properties: {
    error: { type: 'integer' },
    error_msg: { type: 'string' },
    data: { type: 'object', nullable: true },
  },
};

export async function fetchApi(params: Params): Promise<ApiResponse> {
  logger.info(`Fetching ${params.url}`);
  if (params.body != null) logger.info(JSON.stringify(params.body));
  const response = await fetch(params.url, {
    method: params.method,
    headers: { ...DEFAULT_HEADERS, ...(params.headers || {}) },
    body: params.body != null ? JSON.stringify(params.body) : undefined,
  });
  return assertWithSchema(await response.json(), apiResponseSchema);
}
