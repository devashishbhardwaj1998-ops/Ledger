import React, { useMemo } from 'react';
import { UserCheck, UserX, Search, Users } from 'lucide-react';
import { RawEmployeeRow, EmployeeInfo } from '../types';

interface EmployeePickerProps {
  employeeRows: RawEmployeeRow[] | null;
  selectedNameKey: string;
  typedName: string;
  onTypedNameChange: (val: string) => void;
  onSelectEmployee: (nameKey: string, displayName: string) => void;
}

export const EmployeePicker: React.FC<EmployeePickerProps> = ({
  employeeRows,
  selectedNameKey,
  typedName,
  onTypedNameChange,
  onSelectEmployee
}) => {
  // Build employee registry from Exhibit A rows
  const employeeRegistry = useMemo(() => {
    if (!employeeRows || !employeeRows.length) {
      return new Map<string, EmployeeInfo>();
    }
    const registry = new Map<string, EmployeeInfo>();
    employeeRows.forEach((r) => {
      if (!registry.has(r.nameKey)) {
        registry.set(r.nameKey, {
          firstName: r.firstName,
          lastName: r.lastName,
          display: r.name
        });
      }
    });
    return registry;
  }, [employeeRows]);

  const employeeList = useMemo<EmployeeInfo[]>(() => {
    return Array.from(employeeRegistry.values()).sort((a: EmployeeInfo, b: EmployeeInfo) =>
      a.display.localeCompare(b.display)
    );
  }, [employeeRegistry]);

  // Name resolution logic matching original script
  const resolved = useMemo(() => {
    const clean = typedName.trim().replace(/\s+/g, ' ');
    if (!clean) return { key: null, display: null, partials: [] };

    const lower = clean.toLowerCase();
    if (employeeRegistry.has(lower)) {
      return {
        key: lower,
        display: employeeRegistry.get(lower)!.display,
        partials: []
      };
    }

    // Split check: last word = last name, rest = first name
    const words = clean.split(' ');
    if (words.length >= 2) {
      const typedLast = words[words.length - 1].toLowerCase();
      const typedFirst = words.slice(0, -1).join(' ').toLowerCase();

      for (const [k, v] of employeeRegistry.entries()) {
        if (
          v.firstName.toLowerCase() === typedFirst &&
          v.lastName.toLowerCase() === typedLast
        ) {
          return { key: k, display: v.display, partials: [] };
        }
      }
    }

    // Partial matches
    const partials = employeeList.filter((n) =>
      n.display.toLowerCase().includes(clean.toLowerCase())
    );

    return { key: null, display: null, partials };
  }, [typedName, employeeRegistry, employeeList]);

  if (!employeeRows || employeeRows.length === 0) {
    return null;
  }

  return (
    <div className="border border-[var(--card-border)] p-5 sm:p-6 mb-5 bg-[var(--card-bg)]">
      <div className="flex items-center justify-between gap-2 mb-1">
        <span className="font-mono text-[10px] tracking-[2px] uppercase text-[var(--brass)] font-bold">
          Which Employee
        </span>
        <div className="flex items-center gap-1.5 font-mono text-[11px] text-[var(--text-muted)]">
          <Users className="w-3.5 h-3.5" />
          <span>{employeeList.length} workers in Data Pull</span>
        </div>
      </div>

      <h3 className="font-serif font-bold text-xl text-[var(--ink)] mb-1">
        Select target employee from Data Pull Sheet
      </h3>
      <p className="font-mono text-[11.5px] text-[var(--text-muted)] mb-3 leading-relaxed">
        Type an employee name to filter, or pick from the list below &mdash; this is the worker Exhibit B will be audited against.
      </p>

      <div className="relative mb-2">
        <input
          type="text"
          list="nameOptionsList"
          value={typedName}
          onChange={(e) => onTypedNameChange(e.target.value)}
          placeholder="Type an employee name (e.g. Devashish Bhardwaj)..."
          className="w-full font-mono text-[12.5px] px-3.5 py-2.5 border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--input-text)] focus:outline-none focus:border-[var(--brass)] pr-9 placeholder:text-[var(--text-dim)]"
          autoComplete="off"
        />
        <Search className="w-4 h-4 text-[var(--text-subtle)] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        <datalist id="nameOptionsList">
          {employeeList.map((emp) => (
            <option key={emp.display} value={emp.display} />
          ))}
        </datalist>
      </div>

      {/* Match status feedback */}
      <div className="min-h-[20px] font-mono text-[11.5px] mb-3">
        {typedName.trim() === '' ? (
          <span className="text-[var(--text-subtle)]">Enter or select an employee name above</span>
        ) : resolved.key ? (
          <span className="inline-flex items-center gap-1.5 text-[var(--ok)] font-medium">
            <UserCheck className="w-3.5 h-3.5" />
            Matched verified worker: <strong>{resolved.display}</strong>
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 text-[var(--flag)] font-medium">
            <UserX className="w-3.5 h-3.5" />
            {resolved.partials.length > 0
              ? `${resolved.partials.length} name${
                  resolved.partials.length === 1 ? '' : 's'
                } match — pick one from the chips below`
              : `No employee in Data Pull Sheet matches "${typedName}"`}
          </span>
        )}
      </div>

      {/* Quick Click Employee Chips */}
      {employeeList.length > 0 && (
        <div>
          <div className="font-mono text-[10px] uppercase tracking-wider text-[var(--text-subtle)] mb-1.5 font-semibold">
            Quick selection from roster:
          </div>
          <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto custom-scrollbar p-1.5 bg-[var(--paper-card)] border border-[var(--rule)]">
            {employeeList.map((emp) => {
              const isSelected = selectedNameKey === emp.display.toLowerCase();
              return (
                <button
                  key={emp.display}
                  type="button"
                  onClick={() => {
                    onSelectEmployee(emp.display.toLowerCase(), emp.display);
                  }}
                  className={`font-mono text-[11px] px-2.5 py-1 border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] border-[var(--btn-primary-bg)] font-bold shadow-2xs'
                      : 'bg-[var(--btn-secondary-bg)] text-[var(--btn-secondary-text)] border-[var(--btn-secondary-border)] hover:border-[var(--brass)] hover:bg-[var(--brass-light)]'
                  }`}
                >
                  {emp.display}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
