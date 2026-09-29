import { NextResponse } from "next/server";
import { ADMIN_COOKIE, authenticateUser, createAdminToken } from "@/lib/admin-auth";

export async function POST(request: Request) {
  const { username, password } = (await request.json()) as { username?: string; password?: string };
  const user = username && password ? await authenticateUser(username, password) : null;
  if (!user) return NextResponse.json({ error: "Login ou senha incorretos." }, { status: 401 });
  const response = NextResponse.json({ ok: true, user });
  response.cookies.set(ADMIN_COOKIE, await createAdminToken(user), { httpOnly: true, secure: true, sameSite: "strict", path: "/", maxAge: 60 * 60 * 12 });
  return response;
}
