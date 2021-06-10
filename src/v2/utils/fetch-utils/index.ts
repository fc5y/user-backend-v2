import fetch from 'node-fetch';
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

/**
 * @deprecated Use fetchApi instead
 * TODO: remove this export
 */
export async function http(params: Params) {
  console.log(`Fetching ${params.url}`); // TODO: use a proper logger
  if (params.body != null) console.log(params.body); // TODO: use a proper logger
  const response = await fetch(params.url, {
    method: params.method,
    headers: { ...DEFAULT_HEADERS, ...(params.headers || {}) },
    body: params.body != null ? JSON.stringify(params.body) : undefined,
  });
  return await response.json();
}

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
  console.log(`Fetching ${params.url}`); // TODO: use a proper logger
  if (params.body != null) console.log(params.body); // TODO: use a proper logger
  const response = await fetch(params.url, {
    method: params.method,
    headers: { ...DEFAULT_HEADERS, ...(params.headers || {}) },
    body: params.body != null ? JSON.stringify(params.body) : undefined,
  });
  return assertWithSchema(await response.json(), apiResponseSchema);
}
