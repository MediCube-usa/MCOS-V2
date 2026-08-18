import seed from './fleet-seed.json';

export interface Slot {
  machineId: string; slot: number; barcode: string; product: string;
  machinePrice: string; userPrice: string; capacity: number; stock: number;
}
export interface Machine {
  machineId: string; label: string; group: string;
  stockedSlots: number; totalStock: number; slots: Slot[];
}
export interface FleetSeed { capturedAt: string; source: string; machines: Machine[]; }

export const FLEET = seed as FleetSeed;

export function getMachine(id: string) {
  return FLEET.machines.find((m) => m.machineId === id);
}
// A slot whose machine price is the uninitialised sentinel has never reported to the cloud.
export function neverSynced(s: Slot) {
  return s.machinePrice === '6553.5' || s.machinePrice === '600';
}
