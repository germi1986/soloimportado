import { NextResponse } from 'next/server';
import { buildAuthCookie, getLoginCredentials } from '@/lib/auth';

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { username?: string; password?: string } | null;
  const { username, password } = getLoginCredentials();

  if (!username || !password) {
    return NextResponse.json({ error: 'Credenciales no configuradas en Vercel.' }, { status: 500 });
  }

  if (body?.username !== username || body?.password !== password) {
    return NextResponse.json({ error: 'Credenciales inválidas.' }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(buildAuthCookie());
  return response;
}
