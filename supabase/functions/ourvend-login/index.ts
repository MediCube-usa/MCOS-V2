// MCOS ↔ OurVend AUTO-LOGIN — renews the session cookie by itself.
//
// This is the piece that makes the OurVend connection self-sustaining. When the
// stored session finally expires, this logs in fresh (with the credentials in the
// RLS-locked `secrets` table) and writes a new cookie back into `secrets`, so the
// slot sync and catalog import keep working with no cookie ever pasted by hand.
//
// It replicates exactly what the OurVend login page does in the browser:
//   1. POST /Account/GetPubKey            → RSA public key (base64 DER)
//   2. RSA/PKCS#1-v1.5 encrypt the password (same as the page's JSEncrypt)
//   3. POST /Account/Login  userAccount=<user>&userPwd=<enc>&LoginUrl=
//   4. collect the Set-Cookie jar (WAF tokens + ASP.NET_SessionId) → store it
//
// Credentials live ONLY in `secrets` (ourvend_username / ourvend_password); they
// are never in this file, the repo, logs, or the response.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import forge from "npm:node-forge@1.3.1";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const OURVEND = "https://os.ourvend.com";
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";
const sb = { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` };

async function getSecret(key: string): Promise<string> {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/secrets?key=eq.${key}&select=value`, { headers: sb });
  const rows = await r.json();
  return rows?.[0]?.value ?? "";
}

async function putCookie(value: string) {
  await fetch(`${SUPABASE_URL}/rest/v1/secrets?key=eq.ourvend_cookie`, {
    method: "PATCH",
    headers: { ...sb, "content-type": "application/json", Prefer: "return=minimal" },
    body: JSON.stringify({ value }),
  });
}

function collect(jar: Map<string, string>, resp: Response) {
  // Deno exposes multiple Set-Cookie headers via getSetCookie().
  const list: string[] = (resp.headers as unknown as { getSetCookie?: () => string[] }).getSetCookie?.() ?? [];
  for (const c of list) {
    const first = c.split(";")[0];
    const eq = first.indexOf("=");
    if (eq > 0) jar.set(first.slice(0, eq).trim(), first.slice(eq + 1).trim());
  }
}
const jarStr = (jar: Map<string, string>) => [...jar.entries()].map(([k, v]) => `${k}=${v}`).join("; ");

function pemFromBase64(b64: string): string {
  const clean = b64.replace(/[^A-Za-z0-9+/=]/g, "");
  const lines = clean.match(/.{1,64}/g)!.join("\n");
  return `-----BEGIN PUBLIC KEY-----\n${lines}\n-----END PUBLIC KEY-----`;
}

Deno.serve(async () => {
  const username = await getSecret("ourvend_username");
  const password = await getSecret("ourvend_password");
  if (!username || !password) return Response.json({ ok: false, error: "missing ourvend_username / ourvend_password in secrets" });

  const jar = new Map<string, string>();
  jar.set("PreferredLanguage", "en-us");

  // 1. Public key (this first hit also seeds the WAF + session cookies).
  const kResp = await fetch(`${OURVEND}/Account/GetPubKey`, {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
      "x-requested-with": "XMLHttpRequest", origin: OURVEND,
      referer: `${OURVEND}/Account/Login`, cookie: jarStr(jar), "user-agent": UA,
    },
    body: "",
  });
  collect(jar, kResp);
  const pubkey = (await kResp.text()).trim();
  if (!pubkey || pubkey.length < 100) return Response.json({ ok: false, error: "no public key", got: pubkey.slice(0, 60) });

  // 2. Encrypt the password exactly like the page's JSEncrypt (RSA PKCS#1 v1.5).
  let encPwd: string;
  try {
    const key = forge.pki.publicKeyFromPem(pemFromBase64(pubkey));
    const enc = forge.util.encode64(key.encrypt(forge.util.encodeUtf8(password), "RSAES-PKCS1-V1_5"));
    encPwd = encodeURIComponent(enc);
  } catch (e) {
    return Response.json({ ok: false, error: `encrypt failed: ${e instanceof Error ? e.message : e}` });
  }

  // 3. Log in.
  const lResp = await fetch(`${OURVEND}/Account/Login`, {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
      "x-requested-with": "XMLHttpRequest", origin: OURVEND,
      referer: `${OURVEND}/Account/Login`, cookie: jarStr(jar), "user-agent": UA,
    },
    body: `userAccount=${encodeURIComponent(username)}&userPwd=${encPwd}&LoginUrl=`,
    redirect: "manual",
  });
  collect(jar, lResp);
  const lText = (await lResp.text()).trim();
  const ok = lText.slice(0, 2).toLowerCase() === "ok";
  const gotSession = jar.has("ASP.NET_SessionId");

  // 4. Store the fresh cookie if login succeeded.
  const cookie = jarStr(jar);
  let stored = false;
  if (ok && gotSession) { await putCookie(cookie); stored = true; }

  return Response.json({
    ok, stored, gotSession,
    loginResp: lText.slice(0, 40),
    cookieKeys: [...jar.keys()],
    at: new Date().toISOString(),
  });
});
