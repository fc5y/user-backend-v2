export type UrlData = {
  origin: string;
  pathname?: string;
  query?: string | Record<string, string | number | boolean | undefined>;
};

function originToString(origin: UrlData['origin']): string {
  return origin.endsWith('/') ? origin.slice(0, -1) : origin;
}

function pathnameToString(pathname: UrlData['pathname']) {
  if (pathname == null) return '/';
  return pathname.startsWith('/') ? pathname : '/' + pathname;
}

function queryToString(query: UrlData['query']): string {
  switch (typeof query) {
    case 'undefined':
      return '';
    case 'string':
      return query.startsWith('?') ? query : '?' + query;
    case 'object': {
      const results = [];
      for (const key in query) {
        const value = query[key];
        if (value == null) continue;
        results.push(`${key}=${encodeURIComponent(value)}`);
      }
      return results.length === 0 ? '' : '?' + results.join('&');
    }
    default:
      throw new TypeError('query: Invalid param');
  }
}

export function getUrl(url: string | UrlData) {
  if (typeof url === 'string') return url;
  const origin = originToString(url.origin);
  const pathname = pathnameToString(url.pathname);
  const query = queryToString(url.query);
  return origin + pathname + query;
}
