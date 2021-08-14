import * as api from '../api';
import LRUCache from 'lru-cache';
import { ERROR_CODE, GeneralError } from '../../common-errors';

const cacheTokens = new LRUCache<'', string>({
  max: 1, // 1 value
  maxAge: 60000, // 1 minute
  stale: false,
  updateAgeOnGet: false,
});

export async function generateTokenOrThrow({ allowCache = true }: { allowCache?: boolean } = {}) {
  if (allowCache) {
    const cachedValue = cacheTokens.get('');
    if (cachedValue) return cachedValue;
  }
  const { error, error_msg, data } = await api.tokens.generateToken();
  if (error || !data) {
    throw new GeneralError({
      error: ERROR_CODE.CMS_MANAGER_ERROR,
      error_msg: 'Received non-zero code from CMS Manager when generating token',
      data: { response: { error, error_msg, data } },
    });
  }
  cacheTokens.set('', data.token);
  return data.token;
}
