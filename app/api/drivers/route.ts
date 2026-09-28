import { env } from "cloudflare:workers";
import { NextResponse } from "next/server";

export async function GET() {
  if (!env.DB) return NextResponse.json({ drivers: [] });
  try {
    const result = await env.DB.prepare(`SELECT name FROM drivers ORDER BY name`).all<{ name: string }>();
    return NextResponse.json({ drivers: result.results.map((driver) => driver.name) });
  } catch (error) {
    console.error("drivers_load_failed", error);
    return NextResponse.json({ drivers: [] });
  }
}
