// MCOS → machine AD SCREEN. The half that does not depend on anyone.
//
// WHAT THE MACHINE ACTUALLY READS (partner showed the live file, 2026-08-22):
//   advert.txt in the ES folder on the machine's Android — a JSON array, one entry
//   per ad slot. Two slots exist: AdSite 2 and AdSite 6.
//     [{"AdSite":2,"AdType":2,"DefaultAds":"true","IsDefault":"0","PlayTime":"0-24",
//       "EndTime":"2099-12-30T00:00:00","AdContent1":"<file>.png"}, …]
//   The media files sit beside advert.txt and are referenced BY NAME. Checked: the
//   ad files are NOT in OurVend's catalog, so the ad screen is not gated by the
//   catalog or the 1-2 day product audit. It is just files in a folder.
//
// WHAT IS STILL UNKNOWN (needs someone at a machine, or TeamViewer):
//   - the folder's full path            → secrets.machine_ad_folder
//   - an RMS Personal Access Token      → secrets.rms_token
//   - the on-device FTP login, if used  → secrets.machine_ftp_user / _password
// Everything else is built, so those are paste-a-value steps, not a build.
//
// ACTIONS
//   advertTxt {machineId}  → the exact advert.txt for that machine, from screen_media
//   status                 → what is configured and what is still missing
//   rmsDevices             → list the routers on MediCube's RMS company
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const RMS = "https://rms.teltonika-networks.com/api";
const sb = { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` };

async function secret(key: string): Promise<string> {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/secrets?key=eq.${key}&select=value`, { headers: sb });
  const rows = await r.json().catch(() => []);
  return rows?.[0]?.value ?? "";
}

interface MediaRow { id: string; title: string; url: string; kind: string; ad_site: number | null; sort: number | null }

async function playlist(machineId: string): Promise<MediaRow[]> {
  const r = await fetch(
    `${SUPABASE_URL}/rest/v1/screen_media?select=id,title,url,kind,ad_site,sort&active=eq.true&machine_id=eq.${encodeURIComponent(machineId)}&order=sort.asc`,
    { headers: sb });
  return (await r.json().catch(() => [])) as MediaRow[];
}

// The machine references media BY FILENAME, not by URL — so the name we write into
// advert.txt has to be the name of the file that lands in the folder beside it.
function fileNameFor(m: MediaRow): string {
  const fromUrl = decodeURIComponent(m.url.split("?")[0].split("/").pop() || "");
  if (/\.[a-z0-9]{2,4}$/i.test(fromUrl)) return fromUrl;
  const ext = m.kind === "video" ? "mp4" : "png";
  return `${m.title.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 40)}.${ext}`;
}

// AdType 2 is what the live file uses for a still. Videos are the other type; we
// keep the machine's own value rather than inventing one.
function advertEntry(m: MediaRow, adSite: number) {
  return {
    AdSite: adSite,
    AdType: m.kind === "video" ? 1 : 2,
    DefaultAds: "true",
    IsDefault: "0",
    PlayTime: "0-24",
    EndTime: "2099-12-30T00:00:00",
    AdContent1: fileNameFor(m),
  };
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") return Response.json({ ok: false, error: "POST only" });
  let input: Record<string, unknown> = {};
  try { input = await req.json(); } catch { /* status takes no body */ }
  const action = String(input.action || "status");

  if (action === "status") {
    const [token, folder, ftpUser] = await Promise.all([
      secret("rms_token"), secret("machine_ad_folder"), secret("machine_ftp_user"),
    ]);
    return Response.json({
      ok: true,
      ready: Boolean(token && folder),
      have: {
        advertTxtFormat: true,
        playlistTable: true,
        rmsToken: Boolean(token),
        adFolderPath: Boolean(folder),
        ftpLogin: Boolean(ftpUser),
      },
      needed: [
        token ? null : "secrets.rms_token — an RMS Personal Access Token (rms.teltonika-networks.com → generate once, it is shown only once)",
        folder ? null : "secrets.machine_ad_folder — the full path of the folder holding advert.txt on the machine's Android",
        ftpUser ? null : "secrets.machine_ftp_user / machine_ftp_password — only if the drop goes over ES File Explorer's Remote Manager (FTP)",
      ].filter(Boolean),
      note: "advert.txt can be generated now; pushing it to a machine needs the two values above.",
    });
  }

  if (action === "advertTxt") {
    const machineId = String(input.machineId || "").trim();
    if (!machineId) return Response.json({ ok: false, error: "machineId required" });
    const rows = await playlist(machineId);
    if (!rows.length) {
      return Response.json({
        ok: false,
        error: `no active media for machine ${machineId} — add some with the screen_media tool first`,
      });
    }
    // Two physical slots on the screen. Honour an explicit ad_site; otherwise fill
    // 2 then 6, which is the order the live machine uses.
    const SLOTS = [2, 6];
    const entries = rows.slice(0, SLOTS.length).map((m, i) => advertEntry(m, m.ad_site ?? SLOTS[i]));
    return Response.json({
      ok: true,
      machineId,
      advertTxt: JSON.stringify(entries),
      files: rows.slice(0, SLOTS.length).map((m) => ({ name: fileNameFor(m), from: m.url, title: m.title })),
      instructions: [
        "Drop each file in `files` into the machine's ad folder, keeping the exact name.",
        "Replace advert.txt with the `advertTxt` string — there must be only ONE advert.txt in that folder.",
        "Reboot the screen.",
      ],
      skipped: rows.length > SLOTS.length ? rows.slice(SLOTS.length).map((m) => m.title) : [],
    });
  }

  if (action === "rmsDevices") {
    const token = await secret("rms_token");
    if (!token) return Response.json({ ok: false, error: "secrets.rms_token is empty — create MediCube's RMS company and paste a Personal Access Token" });
    const r = await fetch(`${RMS}/devices`, { headers: { Authorization: `Bearer ${token}`, accept: "application/json" } });
    const text = await r.text();
    let data: unknown; try { data = JSON.parse(text); } catch { data = text.slice(0, 400); }
    return Response.json({ ok: r.ok, status: r.status, data });
  }

  return Response.json({ ok: false, error: `unknown action ${action}` });
});
