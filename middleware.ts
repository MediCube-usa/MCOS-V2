import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { AUTH_COOKIE, AUTH_TOKEN } from '@/lib/auth';

export function middleware(req: NextRequest) {
  const token = req.cookies.get(AUTH_COOKIE)?.value;
  if (token === AUTH_TOKEN) return NextResponse.next();
  const url = req.nextUrl.clone();
  url.pathname = '/login';
  return NextResponse.redirect(url);
}

// Gate everything except the login page, the login API, and static assets.
export const config = {
  matcher: ['/((?!login|api/login|_next/static|_next/image|favicon.ico).*)']
};
