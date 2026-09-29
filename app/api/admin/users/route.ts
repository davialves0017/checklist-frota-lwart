import { env } from "cloudflare:workers";
import { NextResponse } from "next/server";
import { getAdminSession, hashPassword } from "@/lib/admin-auth";

export async function GET(request: Request) {
  const session = await getAdminSession(request);
  if (!session?.canManageUsers) return NextResponse.json({ error: "Sem permissão." }, { status: 403 });
  if (!env.DB) return NextResponse.json({ error: "Banco indisponível." }, { status: 503 });
  const result = await env.DB.prepare(`SELECT username, role, can_manage_users AS canManageUsers, active, created_by AS createdBy, created_at AS createdAt FROM admin_users ORDER BY username`).all();
  const master = { username: env.ADMIN_USERNAME ?? "goiania", role: "admin", canManageUsers: 1, active: 1, createdBy: "sistema", createdAt: "" };
  return NextResponse.json({ users: [master, ...result.results.filter((user) => String(user.username).toLowerCase() !== master.username.toLowerCase())] });
}

export async function POST(request: Request) {
  const session = await getAdminSession(request);
  if (!session?.canManageUsers) return NextResponse.json({ error: "Sem permissão." }, { status: 403 });
  if (!env.DB) return NextResponse.json({ error: "Banco indisponível." }, { status: 503 });
  const body = (await request.json()) as { username?: string; password?: string; canManageUsers?: boolean };
  const username = body.username?.trim().toLowerCase() ?? "";
  if (!/^[a-z0-9._-]{3,30}$/.test(username)) return NextResponse.json({ error: "Use de 3 a 30 caracteres, sem espaços." }, { status: 400 });
  if (!body.password || body.password.length < 6) return NextResponse.json({ error: "A senha precisa ter pelo menos 6 caracteres." }, { status: 400 });
  if (username === (env.ADMIN_USERNAME ?? "goiania").toLowerCase()) return NextResponse.json({ error: "Este usuário já existe." }, { status: 409 });
  const password = await hashPassword(body.password);
  try {
    await env.DB.prepare(`INSERT INTO admin_users (username, password_hash, password_salt, role, can_manage_users, active, created_by, created_at) VALUES (?, ?, ?, 'user', ?, 1, ?, ?)`).bind(username, password.hash, password.salt, body.canManageUsers ? 1 : 0, session.username, new Date().toISOString()).run();
    return NextResponse.json({ ok: true });
  } catch { return NextResponse.json({ error: "Este usuário já existe." }, { status: 409 }); }
}
