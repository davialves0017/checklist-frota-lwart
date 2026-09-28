declare namespace Cloudflare {
  interface Env {
    DB?: D1Database;
    BUCKET?: R2Bucket;
    ADMIN_PIN?: string;
    ADMIN_SESSION_SECRET?: string;
  }
}
