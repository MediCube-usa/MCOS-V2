import { NextResponse } from 'next/server';
import { SITE_PASSWORD, AUTH_COOKIE, AUTH_TOKEN } from '@/lib/auth';

export async function POST(req: Request) {
  const { password } = await req.json().catch(() => ({ password: '' }));
  if (password === SITE_PASSWORD) {
    const res = NextResponse.json({ ok: true });
    res.cookies.set(AUTH_COOKIE, AUTH_TOKEN, {
      httpOnly: true, sameSite: 'lax', secure: true, path: '/', maxAge: 60 * 60 * 24 * 30
    });
    return res;
  }
  return NextResponse.json({ ok: false }, { status: 401 });
}
