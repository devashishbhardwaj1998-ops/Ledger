import * as XLSX from 'xlsx';
import {
  RawEmployeeRow,
  RawEmployerRow,
  FlaggedTask,
  CleanTask,
  AuditReportData,
  NoteTagMeta
} from '../types';
import {
  TYPE_MAP,
  TRACKED_TYPES,
  TRACKED_CATEGORIES,
  normalizeTrackedCategory,
  resolveProductionCategory,
  resolveReviewCategory,
  resolveEmployerCategory,
  normAsset,
  formatDateDDMMYYYY
} from './parser';

export const NOTE_TAGS: NoteTagMeta[] = [
  {
    tag: 'mismatch',
    label: 'Category mismatch',
    description: 'Data Pull Sheet and Daily Planning Sheet disagree on production / review category'
  },
  {
    tag: 'status-not-done',
    label: 'Status not "Done"',
    description: 'Asset and type match, but status in Daily Planning Sheet is not marked "Done"'
  },
  {
    tag: 'missing-employer',
    label: 'Missing in Daily Planning Sheet',
    description: 'Logged in backend Data Pull Sheet, but missing in Daily Planning Sheet'
  },
  {
    tag: 'missing-employee',
    label: 'Missing in Data Pull Sheet',
    description: 'Logged in Daily Planning Sheet, but missing in backend Data Pull Sheet'
  },
  {
    tag: 'unmapped',
    label: 'Unrecognized type code',
    description: 'Data Pull Sheet contains an unrecognized or unmapped task type code'
  }
];

interface PreparedPullItem {
  id: string;
  assetName: string;
  assetKey: string;
  date: string | null;
  minutes: number;
  rawType: string;
  category: string | null;
  axis?: 'production' | 'review';
}

interface PreparedPlanItem {
  id: string;
  assetName: string;
  assetKey: string;
  date: string | null;
  category: string;
  axis: 'production' | 'review';
  status: string;
  isDone: boolean;
  employee?: string;
}

export function runInvestigation(
  employeeRows: RawEmployeeRow[],
  employerRows: RawEmployerRow[],
  chosenNameKey: string,
  employeeDisplayName: string,
  windowStart: string,
  windowEnd: string,
  empFileName: string,
  erFileName: string
): AuditReportData {
  const empRowsAll = employeeRows.filter((r) => r.nameKey === chosenNameKey);
  if (!empRowsAll.length) {
    throw new Error('No rows found in the Data Pull Sheet for this employee');
  }

  if (!windowStart || !windowEnd) {
    throw new Error('Please select a valid date range before investigating');
  }
  if (windowStart > windowEnd) {
    throw new Error('The "From" date must be on or before the "To" date');
  }

  const empNameKey = employeeDisplayName.trim().toLowerCase();
  const nameParts = empNameKey.split(/\s+/).filter(Boolean);

  const isAssignedToThisEmployee = (assignee?: string): boolean => {
    if (!assignee) return false;
    const a = assignee.toLowerCase().trim();
    if (!a) return false;
    if (a === empNameKey) return true;
    if (nameParts.length >= 2 && a.includes(nameParts[0]) && a.includes(nameParts[nameParts.length - 1])) {
      return true;
    }
    return false;
  };

  const inWindow = (d: string | null) => {
    if (!d) return true; // If row has no explicit date or date is unparsed, keep in scope for audit
    return d >= windowStart && d <= windowEnd;
  };

  // In Data Pull Sheet, date matching is not required - all tracked rows for this employee are audited directly
  const empRowsInScope = empRowsAll.filter(
    (r) =>
      normalizeTrackedCategory(r.type) !== null ||
      TRACKED_TYPES.has(r.type.replace(/[^a-z0-9]/gi, '').toLowerCase())
  );

  // Prepared Daily Planning Sheet items within the audit window with tracked category
  const planItems: PreparedPlanItem[] = [];
  const allPlanItems: PreparedPlanItem[] = [];

  employerRows.forEach((r, idx) => {
    const statusRaw = String(r.status || '').trim();
    const isDone = statusRaw.toLowerCase() === 'done';
    const prodCat = resolveProductionCategory(r.production);
    const revCat = resolveReviewCategory(r.review);

    // If row has a Production classification (e.g., Update (full) or Update (limited))
    if (prodCat) {
      const item: PreparedPlanItem = {
        id: `plan-prod-${idx + 1}`,
        assetName: r.assetName,
        assetKey: r.assetKey || normAsset(r.assetName),
        date: r.date,
        category: prodCat,
        axis: 'production',
        status: statusRaw,
        isDone,
        employee: r.employee
      };
      allPlanItems.push(item);
      if (inWindow(r.date) || !r.date) {
        planItems.push(item);
      }
    }

    // If row has a Review classification (e.g., Update R (full) or Update R (limited))
    if (revCat) {
      const item: PreparedPlanItem = {
        id: `plan-rev-${idx + 1}`,
        assetName: r.assetName,
        assetKey: r.assetKey || normAsset(r.assetName),
        date: r.date,
        category: revCat,
        axis: 'review',
        status: statusRaw,
        isDone,
        employee: r.employee
      };
      allPlanItems.push(item);
      if (inWindow(r.date) || !r.date) {
        planItems.push(item);
      }
    }
  });

  if (!empRowsInScope.length && !planItems.length && !allPlanItems.length) {
    const pullDates = empRowsAll
      .map((r) => r.date)
      .filter(Boolean)
      .sort() as string[];
    const minPull = pullDates.length ? formatDateDDMMYYYY(pullDates[0]) : 'None';
    const maxPull = pullDates.length ? formatDateDDMMYYYY(pullDates[pullDates.length - 1]) : 'None';

    const planDates = employerRows
      .map((r) => r.date)
      .filter(Boolean)
      .sort() as string[];
    const minPlan = planDates.length ? formatDateDDMMYYYY(planDates[0]) : 'None';
    const maxPlan = planDates.length ? formatDateDDMMYYYY(planDates[planDates.length - 1]) : 'None';

    throw new Error(
      `No tracked tasks found for ${employeeDisplayName} within ${formatDateDDMMYYYY(windowStart)} to ${formatDateDDMMYYYY(windowEnd)}.\n\n` +
      `• Data Pull Sheet dates found for ${employeeDisplayName}: ${minPull === maxPull ? minPull : `${minPull} to ${maxPull}`} (${empRowsAll.length} total rows)\n` +
      `• Daily Planning Sheet ("Content" tab) dates found: ${minPlan === maxPlan ? minPlan : `${minPlan} to ${maxPlan}`} (${employerRows.length} total rows)\n\n` +
      `Please adjust the "Pick the date range to audit" dates above to match the week in your sheets.`
    );
  }

  // Prepared Data Pull items
  const pullItems: PreparedPullItem[] = empRowsInScope.map((r, idx) => {
    const rawTypeKey = r.type.replace(/[^a-z0-9]/gi, '').toLowerCase();
    const typeInfo = TYPE_MAP[rawTypeKey];
    const category = normalizeTrackedCategory(rawTypeKey) || (typeInfo ? typeInfo.category : null);
    const axis = typeInfo?.axis || (category?.includes(' R ') ? 'review' : 'production');

    return {
      id: `pull-${idx + 1}`,
      assetName: r.assetName,
      assetKey: r.assetKey || normAsset(r.assetName),
      date: r.date,
      minutes: r.minutes,
      rawType: r.type,
      category,
      axis
    };
  });

  const flagged: FlaggedTask[] = [];
  const clean: CleanTask[] = [];
  let flaggedMinutes = 0;
  let taskCounter = 1;

  // Track matched plan items to avoid double counting
  const matchedPlanItemIds = new Set<string>();

  // Reconcile each item from Data Pull Sheet across the week
  for (const pull of pullItems) {
    if (!pull.category) {
      flagged.push({
        id: `flagged-${taskCounter++}`,
        asset: pull.assetName,
        date: pull.date,
        empSide: '—',
        erSide: pull.rawType,
        minutes: pull.minutes,
        note: `Unrecognized task type code in Data Pull Sheet: "${pull.rawType}"`,
        tag: 'unmapped'
      });
      flaggedMinutes += pull.minutes;
      continue;
    }

    // 1. Exact Clean match (same asset + same category + same axis in Daily Planning Sheet)
    const cleanPlanMatch =
      planItems.find(
        (p) =>
          !matchedPlanItemIds.has(p.id) &&
          p.assetKey === pull.assetKey &&
          p.category === pull.category
      ) ||
      allPlanItems.find(
        (p) =>
          !matchedPlanItemIds.has(p.id) &&
          p.assetKey === pull.assetKey &&
          p.category === pull.category
      );

    if (cleanPlanMatch) {
      matchedPlanItemIds.add(cleanPlanMatch.id);
      if (!cleanPlanMatch.isDone) {
        flagged.push({
          id: `flagged-${taskCounter++}`,
          asset: pull.assetName,
          date: pull.date || cleanPlanMatch.date,
          empSide: cleanPlanMatch.category,
          erSide: pull.rawType,
          minutes: pull.minutes,
          note: `Category matches (${pull.category}), but status in Daily Planning Sheet is "${cleanPlanMatch.status || 'blank'}" (expected "Done")`,
          tag: 'status-not-done'
        });
        flaggedMinutes += pull.minutes;
      } else {
        clean.push({
          id: `clean-${taskCounter++}`,
          asset: pull.assetName,
          date: pull.date || cleanPlanMatch.date,
          category: pull.category,
          minutes: pull.minutes
        });
      }
      continue;
    }

    // 2. Category mismatch on SAME AXIS (e.g. production updatedLimited vs production Update (full))
    const sameAxisMismatch =
      planItems.find(
        (p) => !matchedPlanItemIds.has(p.id) && p.assetKey === pull.assetKey && p.axis === pull.axis
      ) ||
      allPlanItems.find(
        (p) => !matchedPlanItemIds.has(p.id) && p.assetKey === pull.assetKey && p.axis === pull.axis
      );

    if (sameAxisMismatch) {
      matchedPlanItemIds.add(sameAxisMismatch.id);
      flagged.push({
        id: `flagged-${taskCounter++}`,
        asset: pull.assetName,
        date: pull.date || sameAxisMismatch.date,
        empSide: sameAxisMismatch.category,
        erSide: pull.rawType,
        minutes: pull.minutes,
        note: `Category mismatch: Daily Planning Sheet has "${sameAxisMismatch.category}" but Data Pull Sheet has "${pull.rawType}"`,
        tag: 'mismatch'
      });
      flaggedMinutes += pull.minutes;
      continue;
    }

    // 3. Fallback Category mismatch across any available unmatched plan item for this asset
    const generalMismatch =
      planItems.find(
        (p) => !matchedPlanItemIds.has(p.id) && p.assetKey === pull.assetKey
      ) ||
      allPlanItems.find(
        (p) => !matchedPlanItemIds.has(p.id) && p.assetKey === pull.assetKey
      );

    if (generalMismatch) {
      matchedPlanItemIds.add(generalMismatch.id);
      flagged.push({
        id: `flagged-${taskCounter++}`,
        asset: pull.assetName,
        date: pull.date || generalMismatch.date,
        empSide: generalMismatch.category,
        erSide: pull.rawType,
        minutes: pull.minutes,
        note: `Category mismatch: Daily Planning Sheet has "${generalMismatch.category}" but Data Pull Sheet has "${pull.rawType}"`,
        tag: 'mismatch'
      });
      flaggedMinutes += pull.minutes;
      continue;
    }

    // 4. Missing in Daily Planning Sheet
    flagged.push({
      id: `flagged-${taskCounter++}`,
      asset: pull.assetName,
      date: pull.date,
      empSide: '—',
      erSide: pull.rawType,
      minutes: pull.minutes,
      note: 'Logged in Data Pull Sheet; no matching entry in Daily Planning Sheet for this week',
      tag: 'missing-employer'
    });
    flaggedMinutes += pull.minutes;
  }

  // 4. Any remaining unmatched items in Daily Planning Sheet (missing in Data Pull Sheet)
  // Check if the Daily Planning Sheet workbook has explicit employee/assignee columns
  const hasExplicitAssigneesInPlan = employerRows.some((r) => Boolean(r.employee && r.employee.trim()));

  for (const plan of planItems) {
    if (!matchedPlanItemIds.has(plan.id)) {
      // If the sheet has an explicit assignee column, only flag if assigned to this worker;
      // If the sheet is a personal/per-employee planning sheet (no employee column), flag as missing in Data Pull Sheet
      const belongsToThisWorker = hasExplicitAssigneesInPlan
        ? Boolean(plan.employee && isAssignedToThisEmployee(plan.employee))
        : true;

      if (belongsToThisWorker) {
        flagged.push({
          id: `flagged-${taskCounter++}`,
          asset: plan.assetName,
          date: plan.date,
          empSide: plan.category,
          erSide: '—',
          minutes: 0,
          note: `Selected "${plan.category}" in Daily Planning Sheet; no matching entry in Data Pull Sheet for this employee`,
          tag: 'missing-employee'
        });
      }
    }
  }

  flagged.sort((a, b) => (a.date || '').localeCompare(b.date || '') || a.asset.localeCompare(b.asset));
  clean.sort((a, b) => (a.date || '').localeCompare(b.date || '') || a.asset.localeCompare(b.asset));

  return {
    flagged,
    clean,
    flaggedMinutes: Math.round(flaggedMinutes * 10) / 10,
    totalLines: flagged.length + clean.length,
    employeeName: employeeDisplayName,
    empFile: empFileName,
    erFile: erFileName,
    trackedRowCount: empRowsInScope.length,
    totalRowCount: empRowsAll.length,
    windowStart,
    windowEnd,
    runAt: new Date().toLocaleString()
  };
}

export function buildReportMatrix(
  rep: AuditReportData,
  flaggedList: FlaggedTask[]
): (string | number)[][] {
  const rows: (string | number)[][] = [
    ['Section', 'Asset', 'Date (DD-MM-YYYY)', 'Daily Planning Sheet (Content Tab)', 'Data Pull Sheet (Backend Log)', 'Minutes', 'Note']
  ];

  flaggedList.forEach((f) => {
    rows.push(['Flagged', f.asset, formatDateDDMMYYYY(f.date), f.empSide, f.erSide, f.minutes, f.note]);
  });

  rep.clean.forEach((c) => {
    rows.push(['Matched clean', c.asset, formatDateDDMMYYYY(c.date), c.category, c.category, c.minutes, 'Matches (Status: Done)']);
  });

  rows.push([]);
  rows.push(['Summary Information']);
  rows.push(['Employee', rep.employeeName]);
  rows.push(['Data Pull Sheet', rep.empFile]);
  rows.push(['Daily Planning Sheet', rep.erFile]);
  rows.push(['Audit Date Window', `${formatDateDDMMYYYY(rep.windowStart)} to ${formatDateDDMMYYYY(rep.windowEnd)}`]);
  rows.push(['Total Tasks Compared', rep.clean.length + flaggedList.length]);
  rows.push(['Clean Matched Tasks', rep.clean.length]);
  rows.push(['Flagged Tasks (Current View)', flaggedList.length]);
  rows.push(['Flagged Tasks (All)', rep.flagged.length]);
  rows.push([
    'Flagged Minutes (Current View)',
    Math.round(flaggedList.reduce((sum, f) => sum + (f.minutes || 0), 0) * 10) / 10
  ]);
  rows.push(['Run Timestamp', rep.runAt]);

  return rows;
}

export function exportReportAsCsv(rep: AuditReportData, flaggedList: FlaggedTask[]): void {
  const rows = buildReportMatrix(rep, flaggedList);
  const csv = rows
    .map((r) =>
      r
        .map((cell) => {
          const s = String(cell ?? '');
          return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
        })
        .join(',')
    )
    .join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  triggerFileDownload(
    blob,
    `ledger-audit-${normAsset(rep.employeeName)}-${formatDateDDMMYYYY(rep.windowStart)}-to-${formatDateDDMMYYYY(rep.windowEnd)}.csv`
  );
}

export function exportReportAsXlsx(rep: AuditReportData, flaggedList: FlaggedTask[]): void {
  const rows = buildReportMatrix(rep, flaggedList);
  const ws = XLSX.utils.aoa_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Discrepancy Report');
  XLSX.writeFile(
    wb,
    `ledger-audit-${normAsset(rep.employeeName)}-${formatDateDDMMYYYY(rep.windowStart)}-to-${formatDateDDMMYYYY(rep.windowEnd)}.xlsx`
  );
}

function triggerFileDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
