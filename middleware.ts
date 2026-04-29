import { NextRequest, NextResponse } from 'next/server';

const AUTH_COOKIE_NAME = process.env.AUTH_COOKIE_NAME || 'soloimportado_auth';

export function middleware(request: NextRequest) {
  const isCatalogRoute = request.nextUrl.pathname.startsWith('/catalog');
  const isAuthenticated = request.cookies.get(AUTH_COOKIE_NAME)?.value === 'ok';

  if (isCatalogRoute && !isAuthenticated) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  if (request.nextUrl.pathname === '/' && isAuthenticated) {
    return NextResponse.redirect(new URL('/catalog', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/catalog/:path*']
};
