export const ACCESS_TOKEN_COOKIE = 'access_token';
export const REFRESH_TOKEN_COOKIE = 'refresh_token';

export const AUTH_HEADER = 'authorization';
export const BEARER_PREFIX = 'Bearer ';

export const extractBearer = (header?: string | null) =>
  header?.startsWith(BEARER_PREFIX) ? header.slice(BEARER_PREFIX.length) : null;
