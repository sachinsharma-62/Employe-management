import env from '../config/env.js';

export const ACCESS_COOKIE = 'ems_access';
export const REFRESH_COOKIE = 'ems_refresh';

const baseCookie = {
  httpOnly: true,
  secure: env.cookieSecure,
  sameSite: env.cookieSameSite,
};

export const setAccessCookie = (res, token, maxAgeMs) =>
  res.cookie(ACCESS_COOKIE, token, { ...baseCookie, maxAge: maxAgeMs, path: '/' });

export const setRefreshCookie = (res, token, maxAgeMs) =>
  res.cookie(REFRESH_COOKIE, token, { ...baseCookie, maxAge: maxAgeMs, path: '/api/auth' });

export const setAuthCookies = (res, { accessToken, accessMaxAge, refreshToken, refreshMaxAge }) => {
  setAccessCookie(res, accessToken, accessMaxAge);
  setRefreshCookie(res, refreshToken, refreshMaxAge);
};

export const clearAuthCookies = (res) => {
  res.clearCookie(ACCESS_COOKIE, { ...baseCookie, path: '/' });
  res.clearCookie(REFRESH_COOKIE, { ...baseCookie, path: '/api/auth' });
};
