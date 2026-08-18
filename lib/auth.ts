// Lightweight site gate. The password can be overridden in Vercel with the
// SITE_PASSWORD environment variable; until then it falls back to the default below.
// The cookie stores a server-only token, never the password itself.
export const SITE_PASSWORD = process.env.SITE_PASSWORD || 'medicube2026';
export const AUTH_COOKIE = 'mcos_auth';
export const AUTH_TOKEN = process.env.AUTH_TOKEN || 'mcos-v2-gate-7Q2x9';
