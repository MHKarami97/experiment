import Dexie, { type Table } from 'dexie';

export interface StoredRun {
  id?: number;
  experimentId: string;
  createdAt: number;
  mode: 'ideal' | 'real';
  params: Record<string, number>;
  summary: {
    maxHeight?: number;
    range?: number;
    flightTime?: number;
    impactVelocity?: number;
    errorVsIdealPercent?: number;
    [key: string]: number | undefined;
  };
  series: {
    t: number[];
    x: number[];
    y: number[];
    vx: number[];
    vy: number[];
    v: number[];
  };
  notes?: string;
  thumbnail?: string; // base64 / data URL
}

export interface StoredSlot {
  id?: number;
  experimentId: string;
  slotIndex: number;
  name: string;
  savedAt: number;
  params: Record<string, number>;
  mode: 'ideal' | 'real';
}

export interface StoredNote {
  id?: number;
  experimentId: string;
  updatedAt: number;
  content: string;
}

export interface StoredSetting {
  key: string;
  value: any;
}

export interface StoredReport {
  id?: number;
  experimentId: string;
  title: string;
  createdAt: number;
  runId?: number;
  htmlContent?: string;
}

export class ScienceLabDatabase extends Dexie {
  public runs!: Table<StoredRun, number>;
  public slots!: Table<StoredSlot, number>;
  public notes!: Table<StoredNote, number>;
  public settings!: Table<StoredSetting, string>;
  public reports!: Table<StoredReport, number>;

  constructor() {
    super('VirtualScienceLabDB');
    // Version 1 schema
    this.version(1).stores({
      runs: '++id, experimentId, createdAt, mode',
      slots: '++id, [experimentId+slotIndex], experimentId, savedAt',
      notes: '++id, experimentId, updatedAt',
      settings: 'key',
      reports: '++id, experimentId, createdAt'
    });
  }
}

export const db = new ScienceLabDatabase();

/**
 * Request persistent storage quota from browser
 */
export async function requestPersistentStorage(): Promise<{ persisted: boolean; quota?: number; usage?: number }> {
  let persisted = false;
  if (navigator.storage && navigator.storage.persist) {
    persisted = await navigator.storage.persist();
  }
  let quota: number | undefined;
  let usage: number | undefined;
  if (navigator.storage && navigator.storage.estimate) {
    const est = await navigator.storage.estimate();
    quota = est.quota;
    usage = est.usage;
  }
  return { persisted, quota, usage };
}

/**
 * Full database backup to JSON
 */
export async function exportDatabaseBackup(): Promise<string> {
  const allRuns = await db.runs.toArray();
  const allSlots = await db.slots.toArray();
  const allNotes = await db.notes.toArray();
  const allSettings = await db.settings.toArray();
  const allReports = await db.reports.toArray();

  const backup = {
    schemaVersion: 1,
    exportedAt: new Date().toISOString(),
    runs: allRuns,
    slots: allSlots,
    notes: allNotes,
    settings: allSettings,
    reports: allReports
  };

  return JSON.stringify(backup, null, 2);
}

/**
 * Restore database from JSON backup with validation
 */
export async function importDatabaseBackup(jsonString: string): Promise<boolean> {
  const parsed = JSON.parse(jsonString);
  if (!parsed || parsed.schemaVersion !== 1) {
    throw new Error('Unsupported or corrupted database backup format.');
  }

  await db.transaction('rw', [db.runs, db.slots, db.notes, db.settings, db.reports], async () => {
    if (Array.isArray(parsed.runs)) {
      await db.runs.clear();
      await db.runs.bulkAdd(parsed.runs);
    }
    if (Array.isArray(parsed.slots)) {
      await db.slots.clear();
      await db.slots.bulkAdd(parsed.slots);
    }
    if (Array.isArray(parsed.notes)) {
      await db.notes.clear();
      await db.notes.bulkAdd(parsed.notes);
    }
    if (Array.isArray(parsed.settings)) {
      await db.settings.clear();
      await db.settings.bulkAdd(parsed.settings);
    }
    if (Array.isArray(parsed.reports)) {
      await db.reports.clear();
      await db.reports.bulkAdd(parsed.reports);
    }
  });

  return true;
}
