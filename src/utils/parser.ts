import * as XLSX from 'xlsx';
import { RawEmployeeRow, RawEmployerRow } from '../types';

export const TYPE_MAP: Record<string, { axis: 'production' | 'review'; category: string }> = {
  'full':                   { axis: 'production', category: 'Full' },
  'limited':                { axis: 'production', category: 'Limited' },
  'minimal':                { axis: 'production', category: 'Minimal' },
  'semicurated':            { axis: 'production', category: 'Semi' },
  'updatedfull':            { axis: 'production', category: 'Update (full)' },
  'updatedlimited':         { axis: 'production', category: 'Update (limited)' },
  'conversionlimitedtofull':{ axis: 'production', category: 'Update (LtF)' },
  'partialnews':            { axis: 'production', category: 'In the news' },
  'firstreview':            { axis: 'review', category: 'Full first' },
  'finalreviewfull':        { axis: 'review', category: 'Full final' },
  'finalreviewlimited':     { axis: 'review', category: 'Limited final' },
  'finalreviewsemicurated': { axis: 'review', category: 'Semi final' },
  'updatedreviewfull':      { axis: 'review', category: 'Update R (full)' },
  'updatedreviewlimited':   { axis: 'review', category: 'Update R (limited)' },
  'partialnewsreview':      { axis: 'review', category: 'Mini-update' }
};

export const TRACKED_TYPES = new Set([
  'updatedreviewfull',
  'updatedreviewlimited',
  'updatedfull',
  'updatedlimited',
  'updatereviewfull',
  'updatereviewlimited',
  'updatefull',
  'updatelimited',
  'updaterfull',
  'updaterlimited',
  'updatedrfull',
  'updatedrlimited'
]);

export const TRACKED_CATEGORIES = new Set([
  'Update (full)',
  'Update (limited)',
  'Update R (full)',
  'Update R (limited)'
]);

export function normalizeTrackedCategory(val: unknown): string | null {
  if (!val) return null;
  const s = String(val)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');

  if (!s) return null;

  // Full production
  if (
    s === 'updatefull' ||
    s === 'updatedfull' ||
    s === 'fullupdate' ||
    s === 'updatefullasset'
  ) {
    return 'Update (full)';
  }

  // Limited production
  if (
    s === 'updatelimited' ||
    s === 'updatedlimited' ||
    s === 'limitedupdate' ||
    s === 'updatelimitedasset'
  ) {
    return 'Update (limited)';
  }

  // Full review
  if (
    s === 'updaterfull' ||
    s === 'updatedrfull' ||
    s === 'updatedreviewfull' ||
    s === 'updatereviewfull' ||
    s === 'reviewfull' ||
    s === 'reviewfullupdate'
  ) {
    return 'Update R (full)';
  }

  // Limited review
  if (
    s === 'updaterlimited' ||
    s === 'updatedrlimited' ||
    s === 'updatedreviewlimited' ||
    s === 'updatereviewlimited' ||
    s === 'reviewlimited' ||
    s === 'reviewlimitedupdate'
  ) {
    return 'Update R (limited)';
  }

  return null;
}

export function resolveProductionCategory(productionVal: unknown): string | null {
  const s = String(productionVal || '').trim();
  if (!s || s === '-' || s === '—' || s === 'n/a' || s === 'none' || s === '0') return null;

  const cat = normalizeTrackedCategory(s);
  if (cat === 'Update (full)' || cat === 'Update (limited)') return cat;

  const clean = s.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (clean.includes('upd') || clean.startsWith('u') || clean.includes('update')) {
    if (clean.includes('lim')) return 'Update (limited)';
    if (clean.includes('full')) return 'Update (full)';
  }
  return null;
}

export function resolveReviewCategory(reviewVal: unknown): string | null {
  const s = String(reviewVal || '').trim();
  if (!s || s === '-' || s === '—' || s === 'n/a' || s === 'none' || s === '0') return null;

  const cat = normalizeTrackedCategory(s);
  if (cat === 'Update R (full)' || cat === 'Update R (limited)') return cat;
  if (cat === 'Update (full)') return 'Update R (full)';
  if (cat === 'Update (limited)') return 'Update R (limited)';

  const clean = s.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (clean.includes('upd') || clean.startsWith('u') || clean.includes('rev') || clean.includes('r')) {
    if (clean.includes('lim')) return 'Update R (limited)';
    if (clean.includes('full')) return 'Update R (full)';
  }
  return null;
}

export function resolveEmployerCategory(
  productionVal: unknown,
  reviewVal: unknown
): string | null {
  // Review category check first
  const revCat = resolveReviewCategory(reviewVal);
  if (revCat) return revCat;

  // Production category check
  const prodCat = resolveProductionCategory(productionVal);
  if (prodCat) return prodCat;

  return null;
}

export function normAsset(s: unknown): string {
  return String(s || '')
    .trim()
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const MONTH_NAME_MAP: Record<string, string> = {
  jan: '01',
  january: '01',
  feb: '02',
  february: '02',
  mar: '03',
  march: '03',
  apr: '04',
  april: '04',
  may: '05',
  jun: '06',
  june: '06',
  jul: '07',
  july: '07',
  aug: '08',
  august: '08',
  sep: '09',
  sept: '09',
  september: '09',
  oct: '10',
  october: '10',
  nov: '11',
  november: '11',
  dec: '12',
  december: '12'
};

function normalizeYearNumber(rawYear: string | number): string {
  const y = parseInt(String(rawYear), 10);
  if (isNaN(y)) return '2026';
  if (y < 100) {
    // 2-digit year (e.g. 26 -> 2026, 99 -> 1999)
    return String(y < 70 ? 2000 + y : 1900 + y);
  }
  return String(y);
}

export function normDate(v: unknown): string | null {
  if (v instanceof Date && !isNaN(v.getTime())) {
    // Handle standard XLSX cellDates (typically stored as midnight UTC) without timezone day shift
    const isMidnightUTC = v.getUTCHours() === 0 && v.getUTCMinutes() === 0 && v.getUTCSeconds() === 0;
    const y = isMidnightUTC ? v.getUTCFullYear() : v.getFullYear();
    const m = String((isMidnightUTC ? v.getUTCMonth() : v.getMonth()) + 1).padStart(2, '0');
    const d = String(isMidnightUTC ? v.getUTCDate() : v.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  if (typeof v === 'number' && v > 1000) {
    if (XLSX.SSF && XLSX.SSF.parse_date_code) {
      const d = XLSX.SSF.parse_date_code(v);
      if (d) {
        return `${d.y}-${String(d.m).padStart(2, '0')}-${String(d.d).padStart(2, '0')}`;
      }
    }
  }
  const s = String(v ?? '').trim();
  if (!s) return null;

  // Excel serial number stored as string (e.g. "46238")
  if (/^\d{5}(?:\.\d+)?$/.test(s)) {
    const num = parseFloat(s);
    if (XLSX.SSF && XLSX.SSF.parse_date_code) {
      const d = XLSX.SSF.parse_date_code(num);
      if (d) {
        return `${d.y}-${String(d.m).padStart(2, '0')}-${String(d.d).padStart(2, '0')}`;
      }
    }
  }

  // Strip trailing time portion if present (e.g., " 14:30:00", "T14:30:00.000Z", " 10:00 AM")
  const dateOnlyStr = s.replace(/T\d{2}:\d{2}.*$/, '').replace(/\s+\d{1,2}:\d{2}(?::\d{2})?(?:\s*[AP]M)?.*$/i, '').trim();

  // 1. Format: DD-MMM-YY or DD-MMM-YYYY (e.g., "02-Aug-26", "04-Aug-2026", "03-Oct-26", "2 Aug 26")
  let m = dateOnlyStr.match(/^(\d{1,2})[-\/\.\s]([a-zA-Z]{3,9})[-\/\.\s](\d{2,4})/);
  if (m) {
    const day = String(m[1]).padStart(2, '0');
    const monthKey = m[2].toLowerCase();
    const month = MONTH_NAME_MAP[monthKey];
    const year = normalizeYearNumber(m[3]);
    if (month) {
      return `${year}-${month}-${day}`;
    }
  }

  // 2. Format: MMM-DD-YY or MMM-DD-YYYY (e.g., "Aug-02-26", "Aug 02, 2026", "October 3 2026")
  m = dateOnlyStr.match(/^([a-zA-Z]{3,9})[-\/\.\s](\d{1,2})(?:,?)?[-\/\.\s](\d{2,4})/);
  if (m) {
    const monthKey = m[1].toLowerCase();
    const month = MONTH_NAME_MAP[monthKey];
    const day = String(m[2]).padStart(2, '0');
    const year = normalizeYearNumber(m[3]);
    if (month) {
      return `${year}-${month}-${day}`;
    }
  }

  // 3. Format: YYYY-MM-DD or YYYY/MM/DD (e.g., "2026-08-02", "2026/08/02")
  m = dateOnlyStr.match(/^(\d{4})[-\/\.](\d{1,2})[-\/\.](\d{1,2})/);
  if (m) {
    const year = m[1];
    const month = String(m[2]).padStart(2, '0');
    const day = String(m[3]).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // 4. Format: Numeric dates with separators: A/B/YYYY or A-B-YYYY or A.B.YYYY
  m = dateOnlyStr.match(/^(\d{1,2})([-\/\.])(\d{1,2})[-\/\.](\d{2,4})/);
  if (m) {
    const n1 = parseInt(m[1], 10);
    const sep = m[2];
    const n2 = parseInt(m[3], 10);
    const year = normalizeYearNumber(m[4]);

    let month = '';
    let day = '';

    if (n1 > 12) {
      // Must be DD/MM/YYYY
      day = String(n1).padStart(2, '0');
      month = String(n2).padStart(2, '0');
    } else if (n2 > 12) {
      // Must be MM/DD/YYYY
      month = String(n1).padStart(2, '0');
      day = String(n2).padStart(2, '0');
    } else if (n2 === 8 && n1 <= 31) {
      // e.g. 03/08/2026 or 03-08-2026 -> August 3rd
      month = '08';
      day = String(n1).padStart(2, '0');
    } else if (n1 === 8 && n2 <= 31) {
      // e.g. 08/03/2026 or 08-03-2026 -> August 3rd
      month = '08';
      day = String(n2).padStart(2, '0');
    } else if (sep === '/') {
      // Slashes default to MM/DD/YYYY
      month = String(n1).padStart(2, '0');
      day = String(n2).padStart(2, '0');
    } else {
      // Hyphens default to DD-MM-YYYY
      day = String(n1).padStart(2, '0');
      month = String(n2).padStart(2, '0');
    }

    return `${year}-${month}-${day}`;
  }

  // 5. Fallback Date constructor
  if (!s.startsWith('#') && !/^[^a-zA-Z0-9]+$/.test(s)) {
    const d = new Date(s);
    if (!isNaN(d.getTime()) && s.length >= 6) {
      const y = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${month}-${day}`;
    }
  }
  return null;
}

export function formatDateDDMMYYYY(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  const clean = String(dateStr).trim();
  const m = clean.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (m) {
    return `${m[3]}-${m[2]}-${m[1]}`;
  }
  return clean;
}

export function parseCSV(text: string): (string | number)[][] {
  const rows: (string | number)[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
    } else {
      if (c === '"') {
        inQuotes = true;
      } else if (c === ',') {
        row.push(field);
        field = '';
      } else if (c === '\r') {
        // Skip CR
      } else if (c === '\n') {
        row.push(field);
        rows.push(row);
        row = [];
        field = '';
      } else {
        field += c;
      }
    }
  }
  if (field.length || row.length) {
    row.push(field);
    rows.push(row);
  }
  while (rows.length && rows[rows.length - 1].every((c) => String(c).trim() === '')) {
    rows.pop();
  }
  return rows;
}

export interface SheetReadResult {
  aoa: (string | number)[][];
  sheetName: string;
  availableSheets: string[];
}

export function readSheet(
  file: File,
  preferredSheetNameSubstr: string | null = null
): Promise<SheetReadResult> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: 'array', cellDates: true });
        
        if (!wb.SheetNames || !wb.SheetNames.length) {
          throw new Error('The workbook contains no sheets');
        }

        let sheetName = wb.SheetNames[0];

        if (preferredSheetNameSubstr) {
          const pref = preferredSheetNameSubstr.trim().toLowerCase();
          
          // 1. Exact match (case-insensitive, trimmed)
          const exactHit = wb.SheetNames.find(
            (n) => n.trim().toLowerCase() === pref
          );

          if (exactHit) {
            sheetName = exactHit;
          } else {
            // 2. Substring match (e.g. "Content Tab", "Daily Content")
            const subHit = wb.SheetNames.find((n) =>
              n.toLowerCase().includes(pref)
            );
            if (subHit) {
              sheetName = subHit;
            }
          }
        }

        const sheet = wb.Sheets[sheetName];
        if (!sheet) {
          throw new Error(`Sheet "${sheetName}" could not be loaded`);
        }

        const aoa = XLSX.utils.sheet_to_json<(string | number)[]>(sheet, {
          header: 1,
          defval: '',
          raw: true,
        });

        resolve({
          aoa,
          sheetName,
          availableSheets: wb.SheetNames
        });
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error('File read failed'));
    reader.readAsArrayBuffer(file);
  });
}

export function normalizeEmployeeRows(aoa: (string | number)[][]): RawEmployeeRow[] {
  if (!aoa.length) throw new Error('Data Pull Sheet is empty');

  // Find header row dynamically (within top 10 rows)
  let headerRowIdx = -1;
  let idx = {
    assetName: -1,
    date: -1,
    minutes: -1,
    type: -1,
    userId: -1,
    first: -1,
    last: -1,
    name: -1
  };

  for (let i = 0; i < Math.min(10, aoa.length); i++) {
    const row = aoa[i].map((h) => String(h).trim().toLowerCase().replace(/[\s_-]+/g, ''));
    const rawRow = aoa[i].map((h) => String(h).trim().toLowerCase());

    const assetI = row.findIndex((h) => h.includes('assetname') || h === 'asset' || h.includes('taskname'));
    const dateI = row.findIndex((h) => h === 'date' || h.includes('date') || h === 'day' || h.includes('created') || h.includes('time'));
    const typeI = row.findIndex((h) => h === 'type' || h.includes('tasktype') || h.includes('type') || h.includes('action') || h.includes('nature'));

    if (assetI >= 0 && (dateI >= 0 || typeI >= 0)) {
      headerRowIdx = i;
      idx = {
        assetName: assetI,
        date: dateI,
        type: typeI,
        minutes: row.findIndex((h) => h.includes('minute') || h.includes('duration') || h === 'mins' || h.includes('spent') || h.includes('time')),
        userId: row.findIndex((h) => h.includes('userid') || h === 'uid' || h === 'id'),
        first: row.findIndex((h) => h.includes('userfirstname') || h.includes('firstname') || h === 'first' || h === 'fname'),
        last: row.findIndex((h) => h.includes('userlastname') || h.includes('lastname') || h === 'last' || h === 'lname'),
        name: row.findIndex((h) => h === 'name' || h.includes('username') || h.includes('employeename') || h === 'employee')
      };
      break;
    }
  }

  if (headerRowIdx < 0 || idx.assetName < 0 || idx.type < 0) {
    // Fallback to row 0 if not detected
    const header = aoa[0].map((h) => String(h).trim().toLowerCase().replace(/[\s_-]+/g, ''));
    idx = {
      assetName: header.findIndex((h) => h.includes('asset') || h.includes('task')),
      date: header.findIndex((h) => h === 'date' || h.includes('date') || h === 'day' || h.includes('time')),
      minutes: header.findIndex((h) => h.includes('minute') || h.includes('duration') || h === 'mins'),
      type: header.findIndex((h) => h === 'type' || h.includes('type')),
      userId: header.findIndex((h) => h.includes('userid') || h.includes('user')),
      first: header.findIndex((h) => h.includes('first') || h.includes('fname')),
      last: header.findIndex((h) => h.includes('last') || h.includes('lname')),
      name: header.findIndex((h) => h === 'name' || h.includes('username') || h.includes('employee'))
    };
    headerRowIdx = 0;
  }

  const rows: RawEmployeeRow[] = [];
  for (let i = headerRowIdx + 1; i < aoa.length; i++) {
    const r = aoa[i];
    if (!r || !r.length) continue;
    const first = idx.first >= 0 ? String(r[idx.first] || '').trim() : '';
    const last = idx.last >= 0 ? String(r[idx.last] || '').trim() : '';
    let name = `${first} ${last}`.trim();
    if (!name && idx.name >= 0) {
      name = String(r[idx.name] || '').trim();
    }
    if (!name && idx.userId >= 0) {
      name = String(r[idx.userId] || '').trim();
    }
    if (!name) continue;

    const rawMinutes = idx.minutes >= 0 ? parseFloat(String(r[idx.minutes])) : NaN;
    const minutes = isNaN(rawMinutes) ? 0 : rawMinutes;
    const rawAsset = idx.assetName >= 0 ? String(r[idx.assetName] || '').trim() : '';
    if (!rawAsset) continue;

    const rawDateVal = idx.date >= 0 ? r[idx.date] : null;
    const parsedDate = normDate(rawDateVal);

    rows.push({
      name,
      nameKey: name.toLowerCase(),
      firstName: first,
      lastName: last,
      userId: idx.userId >= 0 ? String(r[idx.userId] || '').trim() : null,
      assetName: rawAsset,
      assetKey: normAsset(rawAsset),
      date: parsedDate,
      minutes,
      type: idx.type >= 0 ? String(r[idx.type] || '').trim() : ''
    });
  }
  return rows;
}

export function normalizeEmployerRows(aoa: (string | number)[][]): RawEmployerRow[] {
  let headerRowIdx = -1;
  let idx = { date: -1, asset: -1, production: -1, review: -1, status: -1, employee: -1 };

  for (let i = 0; i < Math.min(25, aoa.length); i++) {
    const rawRow = aoa[i].map((c) => String(c || '').trim());
    const row = rawRow.map((c) => c.toLowerCase().replace(/[^a-z0-9]/g, ''));

    const dateI = row.findIndex((h) => h === 'date' || h.includes('date') || h === 'day');
    const assetI = row.findIndex((h) => h.includes('asset') || h.includes('task') || h === 'name' || h.includes('assetname') || h.includes('company') || h.includes('client') || h.includes('account') || h.includes('entity') || h.includes('title'));
    const prodI = row.findIndex((h) => h.includes('production') || h === 'prod' || h.includes('update') || h === 'full' || h === 'limited');
    const revI = row.findIndex((h) => h.includes('review') || h === 'rev' || h === 'r');
    const statusI = row.findIndex((h) => h.includes('status') || h.includes('state'));
    const empI = row.findIndex((h) => h.includes('curator') || h.includes('assignee') || h.includes('employee') || h.includes('worker') || h.includes('owner') || h.includes('doneby') || h.includes('person'));

    if (assetI >= 0 && (prodI >= 0 || revI >= 0 || dateI >= 0)) {
      headerRowIdx = i;
      idx = { date: dateI, asset: assetI, production: prodI, review: revI, status: statusI, employee: empI };
      break;
    }
  }

  if (headerRowIdx < 0 || idx.asset < 0) {
    // Fallback search across all rows
    for (let i = 0; i < aoa.length; i++) {
      const row = aoa[i].map((c) => String(c || '').trim().toLowerCase().replace(/[^a-z0-9]/g, ''));
      const assetI = row.findIndex((h) => h.includes('asset') || h.includes('task') || h.includes('company') || h.includes('client') || h.includes('name'));
      if (assetI >= 0) {
        headerRowIdx = i;
        idx = {
          date: row.findIndex((h) => h.includes('date') || h.includes('day')),
          asset: assetI,
          production: row.findIndex((h) => h.includes('production') || h.includes('prod') || h.includes('update')),
          review: row.findIndex((h) => h.includes('review') || h.includes('rev')),
          status: row.findIndex((h) => h.includes('status') || h.includes('state')),
          employee: row.findIndex((h) => h.includes('curator') || h.includes('assignee') || h.includes('employee') || h.includes('worker') || h.includes('owner') || h.includes('doneby') || h.includes('person'))
        };
        break;
      }
    }
  }

  if (headerRowIdx < 0 || idx.asset < 0) {
    throw new Error('Could not find a Date / Asset name / Production / Review header row in the "Content" tab');
  }

  const rows: RawEmployerRow[] = [];
  for (let i = headerRowIdx + 1; i < aoa.length; i++) {
    const r = aoa[i];
    if (!r || !r.length) continue;
    const asset = idx.asset >= 0 ? String(r[idx.asset] || '').trim() : '';
    const dateRaw = idx.date >= 0 ? r[idx.date] : '';
    if (!asset && !dateRaw) continue;
    if (!asset) continue;

    rows.push({
      assetName: asset,
      assetKey: normAsset(asset),
      date: normDate(dateRaw),
      production: idx.production >= 0 ? String(r[idx.production] || '').trim() : '',
      review: idx.review >= 0 ? String(r[idx.review] || '').trim() : '',
      status: idx.status >= 0 ? String(r[idx.status] || '').trim() : '',
      employee: idx.employee >= 0 ? String(r[idx.employee] || '').trim() : undefined
    });
  }
  return rows;
}

export function extractSheetInfo(url: string): { id: string; gid: string } | null {
  const idMatch = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (!idMatch) return null;
  const id = idMatch[1];
  let gid = '0';
  const gidMatch = url.match(/[#?&]gid=(\d+)/);
  if (gidMatch) gid = gidMatch[1];
  return { id, gid };
}

export function lastWeekWindow(today: Date = new Date()): { start: string; end: string } {
  // Sunday - Saturday: Most recent completed calendar week (Sunday through Saturday)
  const currentDay = today.getDay(); // 0 = Sunday, 1 = Monday, ... 6 = Saturday
  const endLocal = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  // Last week Saturday is today - currentDay - 1
  endLocal.setDate(endLocal.getDate() - currentDay - 1);
  const startLocal = new Date(endLocal);
  // Last week Sunday is 6 days before Saturday
  startLocal.setDate(startLocal.getDate() - 6);
  const toIso = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  return { start: toIso(startLocal), end: toIso(endLocal) };
}
