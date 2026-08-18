// The fleet roster — the machines MCOS reads from OurVend. Kept here so the
// reader, the dashboard, and any scheduled sync all use one list.
export interface RosterMachine {
  machineId: string;
  label: string;
  group: string | null;
}

export const OURVEND_ROSTER: RosterMachine[] = [
  { machineId: '2210280082', label: 'UNLV Tonopah Hall', group: 'UNLV' },
  { machineId: '2404260016', label: 'UNLV Dayton Complex', group: 'UNLV' },
  { machineId: '2303220332', label: 'ASU West Glendale', group: 'ASU' },
  { machineId: '2307120156', label: 'ASU Noble Library', group: 'ASU' },
  { machineId: '2307130211', label: 'ASU PolyTech South', group: 'ASU' },
  { machineId: '2307130307', label: 'ASU Breezeway Main Campus', group: 'ASU' },
  { machineId: '2404090021', label: 'ASU Downtown City Center', group: 'ASU' },
  { machineId: '2404090022', label: 'ASU Hayden Library', group: 'ASU' },
  { machineId: '2602080991', label: 'Murad', group: 'Murad' },
  { machineId: '2602080907', label: 'CSUDH Front Hall', group: 'CSUDH' },
  { machineId: '2407100037', label: 'Unassigned (no group)', group: null },
  { machineId: '2407100158', label: 'Unassigned (no group)', group: null },
  { machineId: '2602080924', label: 'Unassigned (no group)', group: null },
  { machineId: '2602080931', label: 'Unassigned (no group)', group: null }
];
