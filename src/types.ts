export interface RawEmployeeRow {
  name: string;
  nameKey: string;
  firstName: string;
  lastName: string;
  userId: string | null;
  assetName: string;
  assetKey: string;
  date: string | null;
  minutes: number;
  type: string;
}

export interface RawEmployerRow {
  assetName: string;
  assetKey: string;
  date: string | null;
  production: string;
  review: string;
  status: string;
  employee?: string;
}

export interface EmployeeInfo {
  firstName: string;
  lastName: string;
  display: string;
}

export type NoteTagType = 'mismatch' | 'missing-employer' | 'missing-employee' | 'unmapped' | 'status-not-done';

export interface FlaggedTask {
  id: string;
  asset: string;
  date: string | null;
  empSide: string;
  erSide: string;
  minutes: number;
  note: string;
  tag: NoteTagType;
}

export interface CleanTask {
  id: string;
  asset: string;
  date: string | null;
  category: string;
  minutes: number;
}

export interface AuditReportData {
  flagged: FlaggedTask[];
  clean: CleanTask[];
  flaggedMinutes: number;
  totalLines: number;
  employeeName: string;
  empFile: string;
  erFile: string;
  trackedRowCount: number;
  totalRowCount: number;
  windowStart: string;
  windowEnd: string;
  runAt: string;
}

export interface NoteTagMeta {
  tag: NoteTagType;
  label: string;
  description: string;
}
