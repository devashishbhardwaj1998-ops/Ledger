import React from 'react';
import { Calendar, AlertCircle } from 'lucide-react';
import { lastWeekWindow, formatDateDDMMYYYY } from '../utils/parser';

interface DateRangePickerProps {
  rangeStart: string;
  rangeEnd: string;
  onRangeStartChange: (val: string) => void;
  onRangeEndChange: (val: string) => void;
  onApplyPreset: (start: string, end: string) => void;
}

export const DateRangePicker: React.FC<DateRangePickerProps> = ({
  rangeStart,
  rangeEnd,
  onRangeStartChange,
  onRangeEndChange,
  onApplyPreset
}) => {
  const isInvalid = rangeStart && rangeEnd && rangeStart > rangeEnd;

  const handleLastWeek = () => {
    const w = lastWeekWindow();
    onApplyPreset(w.start, w.end);
  };

  const handleThisWeek = () => {
    const today = new Date();
    const currentDay = today.getDay(); // 0 = Sunday
    const start = new Date(today);
    start.setDate(today.getDate() - currentDay);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);

    const toIso = (d: Date) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    onApplyPreset(toIso(start), toIso(end));
  };

  const handlePast14Days = () => {
    const today = new Date();
    const start = new Date(today);
    start.setDate(today.getDate() - 14);

    const toIso = (d: Date) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    onApplyPreset(toIso(start), toIso(today));
  };

  const handleFullMonth = () => {
    const today = new Date();
    const start = new Date(today.getFullYear(), today.getMonth(), 1);
    const end = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    const toIso = (d: Date) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    onApplyPreset(toIso(start), toIso(end));
  };

  return (
    <div className="border border-[var(--card-border)] p-5 sm:p-6 mb-6 bg-[var(--card-bg)]">
      <div className="flex items-center justify-between gap-2 mb-1">
        <span className="font-mono text-[10px] tracking-[2px] uppercase text-[var(--brass)] font-bold">
          Reporting Window &bull; Format DD-MM-YYYY
        </span>
        <div className="flex items-center gap-1 font-mono text-[11px] text-[var(--text-muted)]">
          <Calendar className="w-3.5 h-3.5" />
          <span>DD-MM-YYYY Standard</span>
        </div>
      </div>

      <h3 className="font-serif font-bold text-xl text-[var(--ink)] mb-1">
        Pick the date range to audit
      </h3>
      <p className="font-mono text-[11.5px] text-[var(--text-muted)] mb-3.5 leading-relaxed">
        Date range defines the Daily Planning Sheet reporting scope. Tasks in the Data Pull Sheet are reconciled for the employee without requiring date matching.
      </p>

      {/* Inputs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-3">
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label
              htmlFor="rangeStartInput"
              className="block font-mono text-[11px] uppercase tracking-wider text-[var(--text-muted)] font-semibold"
            >
              From Date
            </label>
            {rangeStart && (
              <span className="font-mono text-[11.5px] text-[var(--brass)] font-bold bg-[var(--brass-light)] border border-[var(--brass-border)] px-2 py-0.5 rounded-xs">
                {formatDateDDMMYYYY(rangeStart)}
              </span>
            )}
          </div>
          <input
            id="rangeStartInput"
            type="date"
            value={rangeStart}
            onChange={(e) => onRangeStartChange(e.target.value)}
            className="w-full font-mono text-[13px] px-3 py-2 border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--input-text)] focus:outline-none focus:border-[var(--brass)] cursor-pointer"
          />
        </div>
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label
              htmlFor="rangeEndInput"
              className="block font-mono text-[11px] uppercase tracking-wider text-[var(--text-muted)] font-semibold"
            >
              To Date
            </label>
            {rangeEnd && (
              <span className="font-mono text-[11.5px] text-[var(--brass)] font-bold bg-[var(--brass-light)] border border-[var(--brass-border)] px-2 py-0.5 rounded-xs">
                {formatDateDDMMYYYY(rangeEnd)}
              </span>
            )}
          </div>
          <input
            id="rangeEndInput"
            type="date"
            value={rangeEnd}
            onChange={(e) => onRangeEndChange(e.target.value)}
            className="w-full font-mono text-[13px] px-3 py-2 border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--input-text)] focus:outline-none focus:border-[var(--brass)] cursor-pointer"
          />
        </div>
      </div>

      {isInvalid && (
        <div className="flex items-center gap-1.5 font-mono text-[11.5px] text-[var(--flag)] mb-2.5 font-semibold">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>The &ldquo;From&rdquo; date must be on or before the &ldquo;To&rdquo; date.</span>
        </div>
      )}

      {/* Quick Presets */}
      <div className="pt-3 border-t border-[var(--rule)] flex flex-wrap items-center gap-2">
        <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--text-subtle)] font-semibold">
          Quick Presets:
        </span>
        <button
          type="button"
          onClick={handleLastWeek}
          className="font-mono text-[11px] px-2.5 py-1 border border-[var(--btn-secondary-border)] bg-[var(--btn-secondary-bg)] hover:border-[var(--brass)] hover:bg-[var(--brass-light)] text-[var(--btn-secondary-text)] transition-colors cursor-pointer shadow-2xs font-medium"
        >
          Last Week (Sunday–Saturday)
        </button>
        <button
          type="button"
          onClick={handleThisWeek}
          className="font-mono text-[11px] px-2.5 py-1 border border-[var(--btn-secondary-border)] bg-[var(--btn-secondary-bg)] hover:border-[var(--brass)] hover:bg-[var(--brass-light)] text-[var(--btn-secondary-text)] transition-colors cursor-pointer shadow-2xs font-medium"
        >
          This Week
        </button>
        <button
          type="button"
          onClick={handlePast14Days}
          className="font-mono text-[11px] px-2.5 py-1 border border-[var(--btn-secondary-border)] bg-[var(--btn-secondary-bg)] hover:border-[var(--brass)] hover:bg-[var(--brass-light)] text-[var(--btn-secondary-text)] transition-colors cursor-pointer shadow-2xs font-medium"
        >
          Past 14 Days
        </button>
        <button
          type="button"
          onClick={handleFullMonth}
          className="font-mono text-[11px] px-2.5 py-1 border border-[var(--btn-secondary-border)] bg-[var(--btn-secondary-bg)] hover:border-[var(--brass)] hover:bg-[var(--brass-light)] text-[var(--btn-secondary-text)] transition-colors cursor-pointer shadow-2xs font-medium"
        >
          Current Month
        </button>
      </div>
    </div>
  );
};
