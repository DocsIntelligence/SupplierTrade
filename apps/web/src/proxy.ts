import { NextResponse, type NextRequest } from 'next/server';
import { isPublicRoute } from './lib/auth-routes';

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (isPublicRoute(pathname)) return NextResponse.next();

  // Cookie is set by the API on the shared domain (e.g. .xyz.com)
  // so it's available on all subdomains including this Next.js app
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
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api).*)'],
};
