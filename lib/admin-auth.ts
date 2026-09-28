import { env } from "cloudflare:workers";

export const ADMIN_COOKIE = "fleet_admin";

async function digest(value: string) {
  const bytes = new TextEncoder().encode(value);
  const hash = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(hash), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function expectedAdminToken() {
  if (!env.ADMIN_PIN || !env.ADMIN_SESSION_SECRET) throw new Error("Configuração administrativa indisponível.");
  return digest(`${env.ADMIN_PIN}:${env.ADMIN_SESSION_SECRET}`);
}

export async function validateAdminPin(pin: string) {
  if (!env.ADMIN_PIN) return false;
  return digest(pin) === digest(env.ADMIN_PIN);
}

export async function isAdminRequest(request: Request) {
  const cookie = request.headers.get("cookie") ?? "";
  const token = cookie.split(";").map((part) => part.trim()).find((part) => part.startsWith(`${ADMIN_COOKIE}=`))?.split("=")[1];
  if (!token) return false;
  return token === (await expectedAdminToken());
}
