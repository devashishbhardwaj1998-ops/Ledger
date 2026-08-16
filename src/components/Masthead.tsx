import React, { useState } from 'react';
import { FileSpreadsheet, Info, Moon, Sun } from 'lucide-react';

interface MastheadProps {
  onOpenLegend: () => void;
  isDark: boolean;
  onToggleDark: () => void;
}

export const Masthead: React.FC<MastheadProps> = ({ onOpenLegend, isDark, onToggleDark }) => {
  const [refNum] = useState(() => String(Math.floor(1000 + Math.random() * 8999)).slice(0, 3));

  return (
    <header className="border-b-[3px] border-double border-[var(--card-border)] pb-4 mb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-5">
      <div>
        <div className="font-mono text-[11px] font-medium tracking-[2.5px] uppercase text-[var(--brass)] mb-1 flex items-center gap-2">
          <FileSpreadsheet className="w-3.5 h-3.5 text-[var(--brass)]" />
          <span>Timesheet Audit Desk</span>
        </div>
        <h1 className="font-serif font-bold text-4xl sm:text-5xl tracking-tight text-[var(--ink)] leading-none">
          Ledger
        </h1>
      </div>

      <div className="flex flex-col sm:flex-row md:flex-col items-start md:items-end gap-3 w-full sm:w-auto">
        <div className="font-mono text-[11px] text-left md:text-right text-[var(--text-muted)] leading-relaxed">
          <span className="font-bold text-[var(--ink)]">No. {refNum}</span>
          <br />
          One employee, task by task
          <br />
          self-logged vs. employer record
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={onToggleDark}
            className="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider text-[var(--ink)] hover:text-[var(--brass)] border border-[var(--btn-secondary-border)] hover:border-[var(--brass)] px-3 py-1.5 transition-colors bg-[var(--btn-secondary-bg)] cursor-pointer shadow-2xs font-semibold"
            title={isDark ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
          >
            {isDark ? (
              <>
                <Sun className="w-3.5 h-3.5 text-[var(--brass)]" />
                <span>Light Theme</span>
              </>
            ) : (
              <>
                <Moon className="w-3.5 h-3.5 text-[var(--text-subtle)]" />
                <span>Dark Theme</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onOpenLegend}
            className="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider text-[var(--brass)] hover:text-[var(--ink)] border border-[var(--btn-secondary-border)] hover:border-[var(--brass)] px-3 py-1.5 transition-colors bg-[var(--btn-secondary-bg)] cursor-pointer shadow-2xs font-semibold"
          >
            <Info className="w-3.5 h-3.5 text-[var(--brass)]" />
            <span>Category Translation Matrix</span>
          </button>
        </div>
      </div>
    </header>
  );
};

