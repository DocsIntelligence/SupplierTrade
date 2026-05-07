import { NextResponse, type NextRequest } from 'next/server';
import { isPublicRoute } from './lib/auth-routes';

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (isPublicRoute(pathname)) return NextResponse.next();

  const accessToken = req.cookies.get('access_token')?.value;
  if (!accessToken) {
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('next', pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
