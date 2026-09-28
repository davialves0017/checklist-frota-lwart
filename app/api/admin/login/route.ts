import { NextResponse } from "next/server";
import { ADMIN_COOKIE, expectedAdminToken, validateAdminCredentials } from "@/lib/admin-auth";

export async function POST(request: Request) {
  const { username, password } = (await request.json()) as { username?: string; password?: string };
  if (!username || !password || !(await validateAdminCredentials(username, password))) return NextResponse.json({ error: "Login ou senha incorretos." }, { status: 401 });
  const response = NextResponse.json({ ok: true });
  response.cookies.set(ADMIN_COOKIE, await expectedAdminToken(), { httpOnly: true, secure: true, sameSite: "strict", path: "/", maxAge: 60 * 60 * 12 });
  return response;
}
