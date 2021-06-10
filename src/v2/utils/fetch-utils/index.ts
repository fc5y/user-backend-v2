import fetch from 'node-fetch';

type HttpParams = {
  url: string;
  method: 'GET' | 'POST';
  headers?: Record<string, string>;
  body?: any;
};

export async function http(params: HttpParams) {
  console.log(`Fetching ${params.url}`); // TODO: use a proper logger
  const response = await fetch(params.url, {
    method: params.method,
    headers: params.headers || {},
    body: params.body != null ? JSON.stringify(params.body) : undefined,
  });
  return await response.json();
}
