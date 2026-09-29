import { env } from "cloudflare:workers";
import { NextResponse } from "next/server";
import { getAdminSession, hashPassword } from "@/lib/admin-auth";

async function authorize(request: Request, username: string) {
  const session = await getAdminSession(request);
  if (!session?.canManageUsers) return { error: NextResponse.json({ error: "Sem permissão." }, { status: 403 }) };
  if (!env.DB) return { error: NextResponse.json({ error: "Banco indisponível." }, { status: 503 }) };
  if (username.toLowerCase() === (env.ADMIN_USERNAME ?? "goiania").toLowerCase()) return { error: NextResponse.json({ error: "A conta administradora principal não pode ser alterada." }, { status: 400 }) };
  return { session };
}

export async function PATCH(request: Request, { params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const authorization = await authorize(request, username);
  if (authorization.error) return authorization.error;
  const body = (await request.json()) as { active?: boolean; canManageUsers?: boolean; password?: string };
  if (body.password && body.password.length < 6) return NextResponse.json({ error: "A senha precisa ter pelo menos 6 caracteres." }, { status: 400 });
  if (body.password) {
    const password = await hashPassword(body.password);
    await env.DB!.prepare(`UPDATE admin_users SET active = ?, can_manage_users = ?, password_hash = ?, password_salt = ? WHERE username = ? COLLATE NOCASE`).bind(body.active === false ? 0 : 1, body.canManageUsers ? 1 : 0, password.hash, password.salt, username).run();
  } else {
    await env.DB!.prepare(`UPDATE admin_users SET active = ?, can_manage_users = ? WHERE username = ? COLLATE NOCASE`).bind(body.active === false ? 0 : 1, body.canManageUsers ? 1 : 0, username).run();
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request, { params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const authorization = await authorize(request, username);
  if (authorization.error) return authorization.error;
  await env.DB!.prepare(`DELETE FROM admin_users WHERE username = ? COLLATE NOCASE`).bind(username).run();
  return NextResponse.json({ ok: true });
}
