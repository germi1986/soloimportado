import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const isCatalog = request.nextUrl.pathname.startsWith('/catalog');

  if (!isCatalog) {
    return NextResponse.next();
  }

  const token = request.cookies.get('soloimportado_auth')?.value;

  if (!token) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/catalog/:path*']
};
