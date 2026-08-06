const fs = require('fs');
const path = require('path');

const DATA_FILE = process.env.DATA_FILE || path.join(__dirname, '..', 'data', 'store.json');

// NOTE: this is a flat JSON file, not a real database. That's intentional for now —
// the immediate goal is proving the protocol works end-to-end on one test machine,
// not building the production data layer. Before connecting the real fleet, swap
// this module for Postgres/Supabase and keep the same function signatures; nothing
// else in the gateway needs to change.

function load() {
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  } catch {
    return { slots: {}, events: [], pendingCommands: [], redeemCodes: {} };
  }
}

function save(data) {
  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

function logEvent(machineId, funCode, direction, payload) {
  const data = load();
  data.events.push({
    machineId: machineId || 'unknown',
    funCode,
    direction, // 'in' = machine -> gateway, 'out' = gateway -> machine, 'record' = internal note
    payload,
    at: new Date().toISOString(),
  });
  if (data.events.length > 2000) data.events = data.events.slice(-2000);
  save(data);
}

function getEvents(machineId, limit) {
  const data = load();
  let events = data.events;
  if (machineId) events = events.filter((e) => e.machineId === machineId);
  return events.slice(-(limit || 50)).reverse();
}

function upsertSlot(machineId, slotNo, fields) {
  const data = load();
  const key = `${machineId}:${slotNo}`;
  data.slots[key] = {
    ...(data.slots[key] || {}),
    ...fields,
    machineId,
    slotNo,
    updatedAt: new Date().toISOString(),
  };
  save(data);
  return data.slots[key];
}

function getSlots(machineId) {
  const data = load();
  return Object.values(data.slots).filter((s) => !machineId || s.machineId === machineId);
}

function queueCommand(cmd) {
  const data = load();
  const record = {
    id: Date.now() + '-' + Math.random().toString(36).slice(2, 8),
    machineId: cmd.machineId,
    msgType: cmd.msgType, // 0 = remote dispense, 1 = update product/slot info (price, image, etc.)
    slotNo: cmd.slotNo,
    productId: cmd.productId,
    name: cmd.name,
    price: cmd.price,
    type: cmd.type,
    introduction: cmd.introduction,
    capacity: cmd.capacity,
    quantity: cmd.quantity,
    imageUrl: cmd.imageUrl,
    imageDetailUrl: cmd.imageDetailUrl,
    goodsAdUrl: cmd.goodsAdUrl,
    tradeNo: cmd.tradeNo || `MCOS${Date.now()}`,
    createdAt: new Date().toISOString(),
    consumedAt: null,
  };
  data.pendingCommands.push(record);
  save(data);
  return record;
}

function nextCommandFor(machineId) {
  const data = load();
  const cmd = data.pendingCommands.find((c) => c.machineId === machineId && !c.consumedAt);
  if (cmd) {
    cmd.consumedAt = new Date().toISOString();
    save(data);
  }
  return cmd || null;
}

function createRedeemCode(entry) {
  const data = load();
  data.redeemCodes[entry.code] = {
    code: entry.code,
    machineId: entry.machineId,
    slotNo: entry.slotNo,
    productId: entry.productId,
    maxUses: entry.maxUses || 1,
    uses: 0,
    active: true,
    createdAt: new Date().toISOString(),
  };
  save(data);
  return data.redeemCodes[entry.code];
}

function redeemCode(code) {
  const data = load();
  const entry = data.redeemCodes[code];
  if (!entry || !entry.active || entry.uses >= entry.maxUses) return null;
  entry.uses += 1;
  if (entry.uses >= entry.maxUses) entry.active = false;
  save(data);
  return entry;
}

module.exports = {
  logEvent,
  getEvents,
  upsertSlot,
  getSlots,
  queueCommand,
  nextCommandFor,
  createRedeemCode,
  redeemCode,
};
