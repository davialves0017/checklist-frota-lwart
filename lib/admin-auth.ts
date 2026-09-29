import { env } from "cloudflare:workers";

export const ADMIN_COOKIE = "fleet_admin";
export type AdminSession = { username: string; role: "admin" | "user"; canManageUsers: boolean; exp: number };

function bytesToBase64Url(bytes: Uint8Array) { return btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, ""); }
function base64UrlToBytes(value: string) { const normalized = value.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(value.length / 4) * 4, "="); return Uint8Array.from(atob(normalized), (character) => character.charCodeAt(0)); }
async function digest(value: string) { return new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value))); }
function equalBytes(first: Uint8Array, second: Uint8Array) { if (first.length !== second.length) return false; let difference = 0; for (let index = 0; index < first.length; index += 1) difference |= first[index] ^ second[index]; return difference === 0; }

async function sessionSignature(payload: string) {
  if (!env.ADMIN_SESSION_SECRET) throw new Error("Configuração administrativa indisponível.");
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(env.ADMIN_SESSION_SECRET), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return bytesToBase64Url(new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload))));
}

export async function createAdminToken(user: Omit<AdminSession, "exp">) {
  const payload = bytesToBase64Url(new TextEncoder().encode(JSON.stringify({ ...user, exp: Date.now() + 12 * 60 * 60 * 1000 })));
  return `${payload}.${await sessionSignature(payload)}`;
}

export async function getAdminSession(request: Request): Promise<AdminSession | null> {
  const cookie = request.headers.get("cookie") ?? "";
  const token = cookie.split(";").map((part) => part.trim()).find((part) => part.startsWith(`${ADMIN_COOKIE}=`))?.slice(ADMIN_COOKIE.length + 1);
  if (!token) return null;
  const [payload, signature] = token.split(".");
  if (!payload || !signature || !equalBytes(new TextEncoder().encode(signature), new TextEncoder().encode(await sessionSignature(payload)))) return null;
  try { const session = JSON.parse(new TextDecoder().decode(base64UrlToBytes(payload))) as AdminSession; return session.exp > Date.now() ? session : null; } catch { return null; }
}

export async function isAdminRequest(request: Request) { return Boolean(await getAdminSession(request)); }

export async function hashPassword(password: string, salt = bytesToBase64Url(crypto.getRandomValues(new Uint8Array(16)))) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
  const hash = new Uint8Array(await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt: base64UrlToBytes(salt), iterations: 120_000 }, key, 256));
  return { salt, hash: bytesToBase64Url(hash) };
}

export async function verifyPassword(password: string, salt: string, expectedHash: string) { const result = await hashPassword(password, salt); return equalBytes(new TextEncoder().encode(result.hash), new TextEncoder().encode(expectedHash)); }

export async function authenticateUser(username: string, password: string): Promise<Omit<AdminSession, "exp"> | null> {
  const normalized = username.trim().toLowerCase();
  if (env.ADMIN_USERNAME && env.ADMIN_PASSWORD) {
    const [submittedUser, expectedUser, submittedPassword, expectedPassword] = await Promise.all([digest(normalized), digest(env.ADMIN_USERNAME.trim().toLowerCase()), digest(password), digest(env.ADMIN_PASSWORD)]);
    if (equalBytes(submittedUser, expectedUser) && equalBytes(submittedPassword, expectedPassword)) return { username: env.ADMIN_USERNAME.trim(), role: "admin", canManageUsers: true };
  }
  if (!env.DB) return null;
  const user = await env.DB.prepare(`SELECT username, password_hash AS passwordHash, password_salt AS passwordSalt, role, can_manage_users AS canManageUsers, active FROM admin_users WHERE username = ? COLLATE NOCASE`).bind(normalized).first<{ username: string; passwordHash: string; passwordSalt: string; role: "admin" | "user"; canManageUsers: number; active: number }>();
  if (!user?.active || !(await verifyPassword(password, user.passwordSalt, user.passwordHash))) return null;
  return { username: user.username, role: user.role, canManageUsers: Boolean(user.canManageUsers) };
}
