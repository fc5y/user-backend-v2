export function getCurrentTimestamp() {
  return Math.floor(new Date().getTime() / 1000);
}

export * as fetchUtils from './fetch-utils';
