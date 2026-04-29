import { cookies } from 'next/headers';

export const AUTH_COOKIE_NAME = process.env.AUTH_COOKIE_NAME || 'soloimportado_auth';
const AUTH_COOKIE_VALUE = 'ok';

export function isAuthenticated(): boolean {
  return cookies().get(AUTH_COOKIE_NAME)?.value === AUTH_COOKIE_VALUE;
}

export function buildAuthCookie() {
  return {
    name: AUTH_COOKIE_NAME,
    value: AUTH_COOKIE_VALUE,
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 7
  };
}

export function getLoginCredentials() {
  return {
    username: process.env.WHOLESALE_USER || '',
    password: process.env.WHOLESALE_PASSWORD || ''
  };
}
