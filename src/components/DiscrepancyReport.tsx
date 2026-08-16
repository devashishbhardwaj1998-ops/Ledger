import React, { useState, useMemo } from 'react';
import {
  FileSpreadsheet,
  Download,
  CheckCircle,
  AlertOctagon,
  Clock,
  Filter,
  Layers,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { AuditReportData, NoteTagType } from '../types';
import { NOTE_TAGS, exportReportAsCsv, exportReportAsXlsx } from '../utils/audit';
import { formatDateDDMMYYYY } from '../utils/parser';

interface DiscrepancyReportProps {
  report: AuditReportData;
}

export const DiscrepancyReport: React.FC<DiscrepancyReportProps> = ({ report }) => {
  const [activeFilters, setActiveFilters] = useState<Set<NoteTagType>>(
    () => new Set(NOTE_TAGS.map((t) => t.tag))
  );
  const [showAllClean, setShowAllClean] = useState(false);

  // Dynamic counts for each note tag
  const tagCounts = useMemo(() => {
    const counts: Record<NoteTagType, number> = {
      mismatch: 0,
      'status-not-done': 0,
      'missing-employer': 0,
      'missing-employee': 0,
      unmapped: 0
    };
    report.flagged.forEach((f) => {
      counts[f.tag] = (counts[f.tag] || 0) + 1;
    });
    return counts;
  }, [report.flagged]);

  const toggleFilter = (tag: NoteTagType) => {
    setActiveFilters((prev) => {
      const next = new Set(prev);
      if (next.has(tag)) {
        next.delete(tag);
      } else {
        next.add(tag);
      }
      return next;
    });
  };

  const selectAllFilters = () => {
    setActiveFilters(new Set(NOTE_TAGS.map((t) => t.tag)));
  };

  const clearAllFilters = () => {
    setActiveFilters(new Set());
  };

  // Filtered flagged items
  const filteredFlagged = useMemo(() => {
    return report.flagged.filter((f) => activeFilters.has(f.tag));
  }, [report.flagged, activeFilters]);

  const filteredMinutes = useMemo(() => {
    const sum = filteredFlagged.reduce((acc, f) => acc + (f.minutes || 0), 0);
    return Math.round(sum * 10) / 10;
  }, [filteredFlagged]);

  const displayedClean = showAllClean ? report.clean : report.clean.slice(0, 25);

  return (
    <div id="report" className="mt-12 pt-8 border-t-[3px] border-double border-[var(--card-border)]">
      {/* Report Header */}
      <div className="mb-6">
        <div className="font-mono text-[10.5px] tracking-[2px] uppercase text-[var(--brass)] font-bold mb-1">
          Findings
        </div>
        <h2 className="font-serif font-bold text-3xl sm:text-4xl text-[var(--ink)] mb-2">
          Discrepancy Report
        </h2>
        <div className="font-mono text-[11.5px] text-[var(--text-muted)] leading-relaxed space-y-0.5">
          <div>
            Employee:&nbsp;
            <strong className="text-[var(--ink)] font-bold">{report.employeeName}</strong>
          </div>
          <div>
            Data Pull Sheet: <span className="font-semibold text-[var(--ink)]">{report.empFile}</span> &mdash; Daily Planning Sheet: <span className="font-semibold text-[var(--ink)]">{report.erFile}</span>
          </div>
          <div>
            Scope: UpdatedReviewFull / UpdatedReviewLimited / UpdatedFull / UpdatedLimited only ({report.trackedRowCount} of {report.totalRowCount} rows for this worker)
          </div>
          <div>
            Date range: <strong className="text-[var(--ink)]">{formatDateDDMMYYYY(report.windowStart)}</strong> through <strong className="text-[var(--ink)]">{formatDateDDMMYYYY(report.windowEnd)}</strong>
          </div>
          <div className="text-[10.5px] text-[var(--text-subtle)] pt-0.5">
            Executed: {report.runAt}
          </div>
        </div>
      </div>

      {/* Metric Stats Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 border border-[var(--card-border)] my-6 bg-[var(--card-bg)] shadow-xs">
        <div className="p-4 sm:p-5 border-r border-b lg:border-b-0 border-[var(--card-border)]">
          <div className="font-serif font-bold text-3xl sm:text-4xl text-[var(--ink)] leading-none">
            {report.totalLines}
          </div>
          <div className="font-mono text-[10px] sm:text-[10.5px] uppercase tracking-wider text-[var(--text-muted)] mt-1.5 flex items-center gap-1 font-semibold">
            <Layers className="w-3 h-3 text-[var(--brass)]" />
            <span>Tasks compared</span>
          </div>
        </div>

        <div className="p-4 sm:p-5 border-b lg:border-b-0 lg:border-r border-[var(--card-border)]">
          <div className="font-serif font-bold text-3xl sm:text-4xl text-[var(--ok)] leading-none">
            {report.clean.length}
          </div>
          <div className="font-mono text-[10px] sm:text-[10.5px] uppercase tracking-wider text-[var(--text-muted)] mt-1.5 flex items-center gap-1 font-semibold">
            <CheckCircle className="w-3 h-3 text-[var(--ok)]" />
            <span>Matched clean</span>
          </div>
        </div>

        <div className="p-4 sm:p-5 border-r border-[var(--card-border)] bg-[var(--flag-bg)]/40">
          <div className="font-serif font-bold text-3xl sm:text-4xl text-[var(--flag)] leading-none flex items-baseline gap-2">
            <span>{report.flagged.length}</span>
            {tagCounts.mismatch > 0 && (
              <span className="font-mono text-[11px] font-semibold text-[var(--flag)] bg-[var(--flag-bg)] px-1.5 py-0.5 border border-[var(--flag-border)]">
                {tagCounts.mismatch} Category Mismatch{tagCounts.mismatch > 1 ? 'es' : ''}
              </span>
            )}
          </div>
          <div className="font-mono text-[10px] sm:text-[10.5px] uppercase tracking-wider text-[var(--text-muted)] mt-1.5 flex items-center gap-1 font-semibold">
            <AlertOctagon className="w-3 h-3 text-[var(--flag)]" />
            <span>Flagged discrepancies</span>
          </div>
        </div>

        <div className="p-4 sm:p-5">
          <div className="font-serif font-bold text-3xl sm:text-4xl text-[var(--ink)] leading-none">
            {report.flaggedMinutes}
          </div>
          <div className="font-mono text-[10px] sm:text-[10.5px] uppercase tracking-wider text-[var(--text-muted)] mt-1.5 flex items-center gap-1 font-semibold">
            <Clock className="w-3 h-3 text-[var(--brass)]" />
            <span>Mins on flagged tasks ({Math.round(report.flaggedMinutes / 60 * 10) / 10} hrs)</span>
          </div>
        </div>
      </div>

      {report.totalLines === 0 && (
        <div className="p-5 mb-6 border-2 border-dashed border-[var(--brass)] bg-[var(--brass-light)]">
          <div className="font-serif font-bold text-lg text-[var(--ink)] mb-1">
            0 Tasks Compared in Selected Date Window
          </div>
          <div className="font-mono text-[12px] text-[var(--text-muted)] leading-relaxed">
            The worker <strong>{report.employeeName}</strong> has {report.totalRowCount} total logged rows in the Data Pull Sheet, but none fell within the active date window (<strong>{formatDateDDMMYYYY(report.windowStart)}</strong> to <strong>{formatDateDDMMYYYY(report.windowEnd)}</strong>).
          </div>
          <div className="mt-2 font-mono text-[11px] text-[var(--brass)] font-semibold">
            Tip: Adjust or expand the &ldquo;Audit Date Window&rdquo; above to match the dates when the work occurred.
          </div>
        </div>
      )}

      {/* Note Type Filter Bar */}
      <div className="mb-6 p-4 bg-[var(--card-bg)] border border-[var(--card-border)]">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
          <div className="font-mono text-[10px] tracking-[2px] uppercase text-[var(--brass)] font-bold flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5" />
            <span>Filter by note type</span>
          </div>
          <div className="flex items-center gap-2 font-mono text-[10.5px]">
            <button
              type="button"
              onClick={selectAllFilters}
              className="text-[var(--brass)] hover:underline cursor-pointer font-semibold"
            >
              Select all
            </button>
            <span className="text-[var(--text-subtle)]">&bull;</span>
            <button
              type="button"
              onClick={clearAllFilters}
              className="text-[var(--brass)] hover:underline cursor-pointer font-semibold"
            >
              Clear
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {NOTE_TAGS.map((t) => {
            const count = tagCounts[t.tag];
            const isChecked = activeFilters.has(t.tag);
            return (
              <label
                key={t.tag}
                className={`inline-flex items-center gap-2 font-mono text-[11.5px] px-3 py-1.5 border cursor-pointer select-none transition-all ${
                  isChecked
                    ? 'border-[var(--brass)] bg-[var(--paper-card)] text-[var(--ink)] font-semibold shadow-xs'
                    : 'border-[var(--rule)] bg-transparent text-[var(--text-muted)] opacity-60 hover:opacity-100'
                } ${count === 0 ? 'opacity-40' : ''}`}
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => toggleFilter(t.tag)}
                  className="accent-[var(--brass)] cursor-pointer"
                />
                <span>{t.label}</span>
                <span className="text-[var(--text-subtle)] font-bold">({count})</span>
              </label>
            );
          })}
        </div>
      </div>

      {/* Flagged Tasks Table */}
      <div className="mb-10">
        <div className="flex items-center gap-3 font-mono text-[11.5px] tracking-[1.5px] uppercase text-[var(--brass)] font-bold mb-2">
          <span>Flagged Tasks</span>
          <div className="flex-1 h-[1px] bg-[var(--rule)]" />
        </div>

        <div className="font-mono text-[11px] text-[var(--text-muted)] mb-2.5">
          {filteredFlagged.length === report.flagged.length ? (
            <span>
              <strong>{report.flagged.length}</strong> flagged task
              {report.flagged.length === 1 ? '' : 's'} (showing all types)
            </span>
          ) : (
            <span>
              Showing <strong>{filteredFlagged.length}</strong> of{' '}
              <strong>{report.flagged.length}</strong> flagged tasks ({filteredMinutes} minutes in active filter)
            </span>
          )}
        </div>

        <div className="overflow-x-auto custom-scrollbar border border-[var(--card-border)] bg-[var(--table-row-bg)]">
          <table className="w-full border-collapse text-left font-mono text-[12px]">
            <thead>
              <tr className="border-b border-[var(--card-border)] bg-[var(--table-header-bg)] text-[10.5px] uppercase tracking-wider text-[var(--text-muted)]">
                <th className="p-3 font-bold">Asset</th>
                <th className="p-3 font-bold">Date</th>
                <th className="p-3 font-bold">Daily Planning Sheet (Content)</th>
                <th className="p-3 font-bold">Data Pull Sheet (Backend)</th>
                <th className="p-3 font-bold text-right">Minutes</th>
                <th className="p-3 font-bold">Audit Discrepancy Note</th>
              </tr>
            </thead>
            <tbody>
              {filteredFlagged.map((f) => {
                const isMismatch = f.tag === 'mismatch';
                return (
                  <tr
                    key={f.id}
                    className={`border-b border-[var(--rule)] transition-colors ${
                      isMismatch ? 'bg-[var(--flag-bg)]/40 hover:bg-[var(--flag-bg)]/70' : 'hover:bg-[var(--table-row-hover)]'
                    }`}
                  >
                    <td className="p-3 font-sans font-semibold text-[13px] text-[var(--ink)] max-w-xs">
                      {f.asset}
                    </td>
                    <td className="p-3 text-[var(--text-muted)] whitespace-nowrap font-medium">
                      {formatDateDDMMYYYY(f.date)}
                    </td>
                    <td className={`p-3 font-mono ${isMismatch ? 'bg-[var(--flag-bg)] text-[var(--flag)] font-bold px-2 py-0.5 rounded-xs border border-[var(--flag-border)] inline-block m-1' : 'text-[var(--ink)]'}`}>
                      {f.empSide}
                    </td>
                    <td className={`p-3 font-mono ${isMismatch ? 'bg-[var(--flag-bg)] text-[var(--flag)] font-bold px-2 py-0.5 rounded-xs border border-[var(--flag-border)] inline-block m-1' : 'text-[var(--ink)]'}`}>
                      {f.erSide}
                    </td>
                    <td className="p-3 text-right font-mono font-semibold tabular-nums text-[var(--ink)]">
                      {f.minutes || 0}
                    </td>
                    <td className="p-3">
                      <span className={`tagpill ${f.tag} shadow-2xs font-semibold`}>
                        {f.note}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {filteredFlagged.length === 0 && (
            <div className="p-8 text-center font-serif italic text-[var(--text-muted)]">
              {report.flagged.length === 0
                ? 'No discrepancies found — every task matches cleanly.'
                : 'No flagged tasks match the selected note filters.'}
            </div>
          )}
        </div>
      </div>

      {/* Matched Clean Table */}
      <div className="mb-8">
        <div className="flex items-center gap-3 font-mono text-[11.5px] tracking-[1.5px] uppercase text-[var(--brass)] font-bold mb-2">
          <span>
            Matched Clean {report.clean.length > 0 && `(${report.clean.length} Total)`}
          </span>
          <div className="flex-1 h-[1px] bg-[var(--rule)]" />
        </div>

        <div className="overflow-x-auto custom-scrollbar border border-[var(--card-border)] bg-[var(--table-row-bg)]">
          <table className="w-full border-collapse text-left font-mono text-[12px]">
            <thead>
              <tr className="border-b border-[var(--card-border)] bg-[var(--table-header-bg)] text-[10.5px] uppercase tracking-wider text-[var(--text-muted)]">
                <th className="p-3 font-bold">Asset</th>
                <th className="p-3 font-bold">Date</th>
                <th className="p-3 font-bold">Reconciled Category</th>
                <th className="p-3 font-bold text-right">Minutes</th>
              </tr>
            </thead>
            <tbody>
              {displayedClean.map((c) => (
                <tr
                  key={c.id}
                  className="border-b border-[var(--rule)] hover:bg-[var(--ok-bg)]/40 transition-colors"
                >
                  <td className="p-3 font-sans font-semibold text-[13px] text-[var(--ink)]">
                    {c.asset}
                  </td>
                  <td className="p-3 text-[var(--text-muted)] whitespace-nowrap font-medium">
                    {formatDateDDMMYYYY(c.date)}
                  </td>
                  <td className="p-3 text-[var(--ok)] font-semibold">
                    {c.category}
                  </td>
                  <td className="p-3 text-right font-mono tabular-nums text-[var(--ink)] font-semibold">
                    {c.minutes}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {report.clean.length === 0 && (
            <div className="p-6 text-center font-serif italic text-[var(--text-muted)]">
              Nothing matched cleanly in this date window.
            </div>
          )}

          {report.clean.length > 25 && (
            <div className="p-3 border-t border-[var(--rule)] bg-[var(--table-header-bg)] flex items-center justify-between text-xs font-mono text-[var(--text-muted)]">
              <span>
                {showAllClean
                  ? `Showing all ${report.clean.length} cleanly matched tasks`
                  : `Showing first 25 of ${report.clean.length} cleanly matched tasks (all included in export)`}
              </span>
              <button
                type="button"
                onClick={() => setShowAllClean(!showAllClean)}
                className="inline-flex items-center gap-1 text-[var(--brass)] hover:text-[var(--ink)] font-semibold uppercase tracking-wider text-[11px] cursor-pointer"
              >
                {showAllClean ? (
                  <>
                    <span>Show sample (25)</span>
                    <ChevronUp className="w-3.5 h-3.5" />
                  </>
                ) : (
                  <>
                    <span>View all ({report.clean.length})</span>
                    <ChevronDown className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Download Row */}
      <div className="pt-6 border-t border-[var(--rule)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => exportReportAsCsv(report, filteredFlagged)}
            className="inline-flex items-center gap-2 font-mono text-[12px] uppercase tracking-wider border border-[var(--btn-secondary-border)] bg-[var(--btn-secondary-bg)] text-[var(--btn-secondary-text)] hover:border-[var(--brass)] hover:bg-[var(--brass-light)] px-5 py-3 transition-all cursor-pointer shadow-2xs font-semibold"
          >
            <Download className="w-4 h-4 text-[var(--brass)]" />
            <span>Download Report &mdash; CSV</span>
          </button>
          <button
            type="button"
            onClick={() => exportReportAsXlsx(report, filteredFlagged)}
            className="inline-flex items-center gap-2 font-mono text-[12px] uppercase tracking-wider bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] hover:bg-[var(--btn-primary-hover)] px-5 py-3 transition-all cursor-pointer shadow-xs font-semibold"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Download Report &mdash; XLSX</span>
          </button>
        </div>

        <div className="font-mono text-[11px] text-[var(--text-muted)]">
          Includes every flagged and matched task, plus the executive audit summary.
        </div>
      </div>
    </div>
  );
};
