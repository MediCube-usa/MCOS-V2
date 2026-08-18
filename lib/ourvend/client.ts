// The MCOS ↔ OurVend connection, permanent and in the repo.
//
// This is the same internal API we reverse-engineered and proved live:
//   POST /Selection/SoltInfo  → every slot on a machine (read)
// It rides an authenticated OurVend session (the cookie). Runs server-side,
// from a runtime that can reach os.ourvend.com. READ-ONLY — no writes here.

export interface LiveSlot {
  machineId: string;
  coil: number;
  barcode: string;
  product: string;
  machinePrice: string;
  cloudPrice: string;
  capacity: number;
  stock: number;
  imgUrl: string;
  workStatus: string;
}

const BASE = 'https://os.ourvend.com';
// 6553.5 / 600 are uninitialised hardware registers, not prices. 255 = empty slot.
const SENTINEL_PRICES = new Set(['6553.5', '600']);

function headers(cookie: string) {
  return {
    accept: 'application/json, text/plain, */*',
    'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
    'x-requested-with': 'XMLHttpRequest',
    origin: BASE,
    referer: `${BASE}/Selection/Index`,
    cookie,
    'user-agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36'
  };
}

// Read every stocked slot on one machine. Throws with a clear reason on session
// expiry or a bot-wall block so the caller can surface it.
export async function readMachine(machineId: string, cookie: string): Promise<LiveSlot[]> {
  const r = await fetch(`${BASE}/Selection/SoltInfo`, {
    method: 'POST',
    headers: headers(cookie),
    body: new URLSearchParams({ MachineID: machineId, boxId: '' }).toString(),
    redirect: 'manual',
    signal: AbortSignal.timeout(20000)
  });
  const text = await r.text();
  if (r.status >= 300 && r.status < 400) throw new Error('session expired — re-capture the OurVend login');
  if (!r.ok) throw new Error(`OurVend HTTP ${r.status} for ${machineId}: ${text.slice(0, 120)}`);
  let parsed: unknown;
  try { parsed = JSON.parse(text); } catch { throw new Error(`non-JSON for ${machineId} (likely a login page — session expired)`); }
  const rows = Array.isArray(parsed) ? (parsed as unknown[])[1] : null;
  if (!Array.isArray(rows)) throw new Error(`unexpected SoltInfo shape for ${machineId}`);

  const out: LiveSlot[] = [];
  for (const raw of rows as Record<string, string>[]) {
    if (raw.SiWorkStatus === '255') continue;
    if (!raw.SiBarCode) continue;
    if (SENTINEL_PRICES.has(raw.SiPrice)) continue;
    out.push({
      machineId: raw.SiMachineId,
      coil: Number(raw.SiCoilId),
      barcode: raw.SiBarCode,
      product: (raw.PrName || '').trim(),
      machinePrice: raw.SiPrice,
      cloudPrice: raw.SiCustomPrice,
      capacity: Number(raw.SiCapacity),
      stock: Number(raw.SiExtantQuantity),
      imgUrl: raw.PrImgUrl || '',
      workStatus: raw.SiWorkStatus
    });
  }
  return out;
}
