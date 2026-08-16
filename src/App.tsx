import React, { useState, useEffect, useRef } from 'react';
import { Play, AlertTriangle, ArrowRight } from 'lucide-react';
import { RawEmployeeRow, RawEmployerRow, AuditReportData } from './types';
import { lastWeekWindow } from './utils/parser';
import { runInvestigation } from './utils/audit';
import { Masthead } from './components/Masthead';
import { IntakeSlots } from './components/IntakeSlots';
import { EmployeePicker } from './components/EmployeePicker';
import { DateRangePicker } from './components/DateRangePicker';
import { DiscrepancyReport } from './components/DiscrepancyReport';
import { MappingLegendModal } from './components/MappingLegendModal';

export default function App() {
  const [employeeFile, setEmployeeFile] = useState<{ name: string; sizeText?: string } | null>(null);
  const [employerFile, setEmployerFile] = useState<{ name: string; sizeText?: string } | null>(null);
  const [employeeRows, setEmployeeRows] = useState<RawEmployeeRow[] | null>(null);
  const [employerRows, setEmployerRows] = useState<RawEmployerRow[] | null>(null);

  const [selectedNameKey, setSelectedNameKey] = useState<string>('');
  const [selectedDisplayName, setSelectedDisplayName] = useState<string>('');
  const [typedName, setTypedName] = useState<string>('');

  const [rangeStart, setRangeStart] = useState<string>('');
  const [rangeEnd, setRangeEnd] = useState<string>('');

  const [report, setReport] = useState<AuditReportData | null>(null);
  const [errorNote, setErrorNote] = useState<string | null>(null);
  const [isLegendOpen, setIsLegendOpen] = useState(false);

  const [isDark, setIsDark] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('ledger_theme');
      if (saved) return saved === 'dark';
      return typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    } catch {
      return false;
    }
  });

  const reportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      if (isDark) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('ledger_theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('ledger_theme', 'light');
      }
    } catch {
      // ignore
    }
  }, [isDark]);

  const handleToggleDark = () => {
    setIsDark((prev) => !prev);
  };

  // Initialize date range with sensible default (last week)
  useEffect(() => {
    const w = lastWeekWindow();
    setRangeStart(w.start);
    setRangeEnd(w.end);
  }, []);

  const syncDateRangeForEmployee = (nameKey: string, rows: RawEmployeeRow[]) => {
    const empRows = rows.filter(
      (r) => r.nameKey === nameKey || r.name.toLowerCase() === nameKey
    );
    const validDates = empRows.map((r) => r.date).filter(Boolean).sort() as string[];
    if (validDates.length > 0) {
      setRangeStart(validDates[0]);
      setRangeEnd(validDates[validDates.length - 1]);
    }
  };

  // Update selectedNameKey whenever typedName resolves directly or user picks from list
  const handleTypedNameChange = (val: string) => {
    setTypedName(val);
    if (!employeeRows || !employeeRows.length) return;

    const clean = val.trim().replace(/\s+/g, ' ');
    const lower = clean.toLowerCase();

    // Check exact nameKey match
    const hit = employeeRows.find((r) => r.nameKey === lower);
    if (hit) {
      setSelectedNameKey(hit.nameKey);
      setSelectedDisplayName(hit.name);
      syncDateRangeForEmployee(hit.nameKey, employeeRows);
      return;
    }

    // Check split first / last
    const words = clean.split(' ');
    if (words.length >= 2) {
      const typedLast = words[words.length - 1].toLowerCase();
      const typedFirst = words.slice(0, -1).join(' ').toLowerCase();
      const splitHit = employeeRows.find(
        (r) =>
          r.firstName.toLowerCase() === typedFirst &&
          r.lastName.toLowerCase() === typedLast
      );
      if (splitHit) {
        setSelectedNameKey(splitHit.nameKey);
        setSelectedDisplayName(splitHit.name);
        syncDateRangeForEmployee(splitHit.nameKey, employeeRows);
        return;
      }
    }

    setSelectedNameKey('');
    setSelectedDisplayName('');
  };

  const handleSelectEmployee = (nameKey: string, displayName: string) => {
    setSelectedNameKey(nameKey);
    setSelectedDisplayName(displayName);
    setTypedName(displayName);
    setErrorNote(null);
    if (employeeRows) {
      syncDateRangeForEmployee(nameKey, employeeRows);
    }
  };

  // Readiness calculations
  const filesReady = Boolean(employeeFile && employerFile && employeeRows && employerRows);
  const nameChosen = Boolean(selectedNameKey);
  const rangeChosen = Boolean(rangeStart && rangeEnd);
  const rangeValid = rangeChosen && rangeStart <= rangeEnd;
  const isReadyToInvestigate = filesReady && nameChosen && rangeValid;

  let statusMessage = 'Awaiting both files';
  if (!employeeFile && !employerFile) {
    statusMessage = 'Awaiting the Data Pull Sheet (Exhibit A) and the Daily Planning Sheet (Exhibit B).';
  } else if (!employeeFile) {
    statusMessage = 'Waiting on Exhibit A (Data Pull Sheet).';
  } else if (!employerFile) {
    statusMessage = 'Waiting on Exhibit B (Daily Planning Sheet or Google Sheet).';
  } else if (!nameChosen) {
    statusMessage = 'Type or select which employee to audit.';
  } else if (!rangeChosen) {
    statusMessage = 'Pick a date range to audit.';
  } else if (!rangeValid) {
    statusMessage = 'The "From" date must be on or before the "To" date.';
  } else {
    statusMessage = 'Ready to investigate.';
  }

  const handleInvestigate = () => {
    setErrorNote(null);
    if (!employeeRows || !employerRows || !selectedNameKey) return;

    try {
      const auditResult = runInvestigation(
        employeeRows,
        employerRows,
        selectedNameKey,
        selectedDisplayName,
        rangeStart,
        rangeEnd,
        employeeFile?.name || 'Exhibit A',
        employerFile?.name || 'Exhibit B'
      );
      setReport(auditResult);

      setTimeout(() => {
        const el = document.getElementById('report');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    } catch (err: any) {
      setErrorNote(err.message || 'Audit investigation failed.');
    }
  };

  return (
    <div className="min-h-screen text-[var(--ink)]">
      <div className="max-w-[1060px] mx-auto px-4 sm:px-7 py-8 sm:py-12 pb-28">
        {/* Masthead */}
        <Masthead
          onOpenLegend={() => setIsLegendOpen(true)}
          isDark={isDark}
          onToggleDark={handleToggleDark}
        />

        {/* Lede Explainer */}
        <div className="font-serif text-[15px] sm:text-[16.5px] leading-relaxed text-[var(--text-muted)] max-w-3xl mb-8 border-l-2 border-[var(--brass)] pl-4 sm:pl-5">
          Upload the Data Pull Sheet and upload the Daily Planning Sheet in their respective sections. Ledger audits the selected employee&apos;s logged tasks on the Data Pull Sheet against the Daily Planning Sheet so that your Sundays are actually Sundays.
        </div>

        {/* Intake File Zones */}
        <IntakeSlots
          employeeFile={employeeFile}
          employerFile={employerFile}
          onEmployeeLoaded={(info, rows) => {
            setEmployeeFile(info);
            setEmployeeRows(rows);
            setErrorNote(null);

            // Auto-detect date window from rows if available
            const validDates = rows.map((r) => r.date).filter(Boolean).sort() as string[];
            if (validDates.length > 0) {
              setRangeStart(validDates[0]);
              setRangeEnd(validDates[validDates.length - 1]);
            }

            // If previous selected name is in new rows, keep it; else clear
            if (selectedNameKey && !rows.some((r) => r.nameKey === selectedNameKey)) {
              setSelectedNameKey('');
              setSelectedDisplayName('');
              setTypedName('');
            }
          }}
          onEmployerLoaded={(info, rows) => {
            setEmployerFile(info);
            setEmployerRows(rows);
            setErrorNote(null);

            // The Data Pull Sheet (time sheet) is the source of truth for the audit
            // window — it alone drives the default date range (see onEmployeeLoaded
            // above). We intentionally do NOT widen the range to cover Daily Planning
            // Sheet dates here: a date that only exists in the planning sheet is out
            // of scope even if it's outside the timesheet's own range.
          }}
          onClearEmployee={() => {
            setEmployeeFile(null);
            setEmployeeRows(null);
            setSelectedNameKey('');
            setSelectedDisplayName('');
            setTypedName('');
            setReport(null);
          }}
          onClearEmployer={() => {
            setEmployerFile(null);
            setEmployerRows(null);
            setReport(null);
          }}
          onError={(msg) => setErrorNote(msg)}
        />

        {/* Employee Picker */}
        {employeeRows && employeeRows.length > 0 && (
          <EmployeePicker
            employeeRows={employeeRows}
            selectedNameKey={selectedNameKey}
            typedName={typedName}
            onTypedNameChange={handleTypedNameChange}
            onSelectEmployee={handleSelectEmployee}
          />
        )}

        {/* Date Range Picker */}
        <DateRangePicker
          rangeStart={rangeStart}
          rangeEnd={rangeEnd}
          onRangeStartChange={(val) => {
            setRangeStart(val);
            setErrorNote(null);
          }}
          onRangeEndChange={(val) => {
            setRangeEnd(val);
            setErrorNote(null);
          }}
          onApplyPreset={(start, end) => {
            setRangeStart(start);
            setRangeEnd(end);
            setErrorNote(null);
          }}
        />

        {/* Action Trigger Row */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-5 border border-[var(--card-border)] bg-[var(--card-bg)] shadow-xs">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[var(--brass)] shrink-0 animate-pulse" />
            <span className="font-mono text-[12.5px] text-[var(--text-muted)] font-medium">
              {statusMessage}
            </span>
          </div>

          <button
            type="button"
            disabled={!isReadyToInvestigate}
            onClick={handleInvestigate}
            className="font-mono text-[13px] font-bold tracking-[1.5px] uppercase bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] px-8 py-3.5 hover:bg-[var(--btn-primary-hover)] active:translate-y-[1px] disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Investigate</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Error Note Banner */}
        {errorNote && (
          <div className="mt-4 p-4 bg-[var(--flag-bg)] border border-[var(--flag-border)] text-[var(--flag)] font-mono text-[12.5px] flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
            <div className="whitespace-pre-wrap leading-relaxed">{errorNote}</div>
          </div>
        )}

        {/* Discrepancy Findings Report */}
        {report && (
          <div ref={reportRef}>
            <DiscrepancyReport report={report} />
          </div>
        )}

        {/* Footer */}
        <footer className="mt-20 pt-5 border-t border-[var(--rule)] font-mono text-[11px] text-[var(--text-subtle)] text-center leading-relaxed">
          Ledger runs entirely in this browser tab. Uploaded files are never sent anywhere; a linked Google Sheet is fetched directly from your browser to Google.
        </footer>
      </div>

      {/* Translation Table Specification Modal */}
      <MappingLegendModal
        isOpen={isLegendOpen}
        onClose={() => setIsLegendOpen(false)}
      />
    </div>
  );
}
