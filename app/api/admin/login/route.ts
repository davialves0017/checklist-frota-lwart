import { NextResponse } from "next/server";
import { ADMIN_COOKIE, expectedAdminToken, validateAdminPin } from "@/lib/admin-auth";

export async function POST(request: Request) {
  const { pin } = (await request.json()) as { pin?: string };
  if (!pin || !(await validateAdminPin(pin))) return NextResponse.json({ error: "Código incorreto." }, { status: 401 });
  const response = NextResponse.json({ ok: true });
  response.cookies.set(ADMIN_COOKIE, await expectedAdminToken(), { httpOnly: true, secure: true, sameSite: "strict", path: "/", maxAge: 60 * 60 * 12 });
  return response;
}
