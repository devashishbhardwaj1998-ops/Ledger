import React from 'react';
import { X, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';
import { TYPE_MAP, TRACKED_TYPES } from '../utils/parser';

interface MappingLegendModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MappingLegendModal: React.FC<MappingLegendModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-[var(--card-bg)] border-2 border-[var(--card-border)] w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl">
        <div className="p-4 sm:p-5 border-b border-[var(--card-border)] flex items-center justify-between bg-[var(--table-header-bg)]">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-widest text-[var(--brass)] font-semibold">
              Specification Matrix
            </div>
            <h2 className="font-serif font-bold text-2xl text-[var(--ink)]">
              Category Translation Matrix & Audit Scope
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[var(--text-muted)] hover:text-[var(--ink)] hover:bg-[var(--brass-light)] transition-colors cursor-pointer rounded-xs"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 custom-scrollbar text-[13px] leading-relaxed">
          {/* Active Scope Note */}
          <div className="border border-[var(--ok-border)] bg-[var(--ok-bg)] p-4 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-[var(--ok)] shrink-0 mt-0.5" />
            <div>
              <div className="font-mono text-[11px] font-bold uppercase tracking-wider text-[var(--ok)]">
                Active Audit Scope (4 Tracked Types)
              </div>
              <div className="font-sans text-[12.5px] text-[var(--ok-text)] mt-1 leading-relaxed">
                Ledger focuses strictly on updating and review update rows:
                <code className="bg-[var(--card-bg)] border border-[var(--ok-border)] px-1 py-0.5 mx-1 font-mono text-[11px] font-semibold text-[var(--ink)]">UpdatedReviewFull</code>,
                <code className="bg-[var(--card-bg)] border border-[var(--ok-border)] px-1 py-0.5 mx-1 font-mono text-[11px] font-semibold text-[var(--ink)]">UpdatedReviewLimited</code>,
                <code className="bg-[var(--card-bg)] border border-[var(--ok-border)] px-1 py-0.5 mx-1 font-mono text-[11px] font-semibold text-[var(--ink)]">UpdatedFull</code>, and
                <code className="bg-[var(--card-bg)] border border-[var(--ok-border)] px-1 py-0.5 mx-1 font-mono text-[11px] font-semibold text-[var(--ink)]">UpdatedLimited</code>. All other task rows are omitted from both sheets during investigation.
              </div>
            </div>
          </div>

          {/* Full Translation Table */}
          <div>
            <div className="font-mono text-[11px] uppercase tracking-wider text-[var(--brass)] mb-2 font-bold">
              Complete Translation Table
            </div>
            <table className="w-full border-collapse border border-[var(--card-border)] bg-[var(--card-bg)] text-[12px] font-mono">
              <thead>
                <tr className="bg-[var(--table-header-bg)] text-[10.5px] uppercase tracking-wider text-[var(--text-muted)] border-b border-[var(--card-border)]">
                  <th className="p-3 text-left font-bold">Data Pull Type Code</th>
                  <th className="p-3 text-left font-bold">Axis</th>
                  <th className="p-3 text-left font-bold">Employer Daily Category</th>
                  <th className="p-3 text-center font-bold">In Audit Scope?</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(TYPE_MAP).map(([rawCode, data]) => {
                  const isTracked = TRACKED_TYPES.has(rawCode);
                  return (
                    <tr
                      key={rawCode}
                      className={`border-b border-[var(--rule)] ${
                        isTracked ? 'bg-[var(--ok-bg)]/40 font-semibold' : 'hover:bg-[var(--table-row-hover)]'
                      }`}
                    >
                      <td className="p-3 text-[var(--ink)] font-mono">{rawCode}</td>
                      <td className="p-3 capitalize text-[var(--text-muted)]">{data.axis}</td>
                      <td className="p-3 text-[var(--ink)]">{data.category}</td>
                      <td className="p-3 text-center">
                        {isTracked ? (
                          <span className="inline-flex items-center gap-1 text-[var(--ok)] text-[11px] font-bold">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Tracked
                          </span>
                        ) : (
                          <span className="text-[var(--text-subtle)] text-[11px]">Excluded</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Matching Criteria */}
          <div className="border border-[var(--card-border)] p-4 bg-[var(--paper-card)] space-y-2">
            <div className="font-mono text-[11px] uppercase tracking-wider text-[var(--brass)] mb-1 font-bold flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4" />
              Reconciliation Matching Rules
            </div>
            <ul className="list-disc list-inside space-y-1.5 font-sans text-[12.5px] text-[var(--text-muted)]">
              <li>
                <strong className="text-[var(--ink)]">Asset Name Normalization</strong>: Names undergo punctuation and spacing normalization (e.g. <code className="bg-[var(--card-bg)] border border-[var(--rule)] px-1 font-mono text-[var(--ink)]">API Restauration</code> and <code className="bg-[var(--card-bg)] border border-[var(--rule)] px-1 font-mono text-[var(--ink)]">API-Restauration</code> match seamlessly).
              </li>
              <li>
                <strong className="text-[var(--ink)]">Category Matching</strong>: Tasks in Data Pull Sheet match against Daily Planning Sheet by Asset Name and Category without requiring identical date stamps.
              </li>
              <li>
                <strong className="text-[var(--ink)]">Status Requirement</strong>: Tasks logged in the Data Pull Sheet must have a <code className="bg-[var(--card-bg)] border border-[var(--rule)] px-1 font-mono font-bold text-[var(--ink)]">Done</code> entry in the Daily Planning Sheet&apos;s <em>Status</em> column to match cleanly. Non-done statuses are flagged.
              </li>
            </ul>
          </div>
        </div>

        <div className="p-4 border-t border-[var(--card-border)] bg-[var(--table-header-bg)] flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="font-mono text-[11px] font-bold tracking-wider uppercase bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] px-5 py-2.5 hover:bg-[var(--btn-primary-hover)] transition-colors cursor-pointer shadow-xs"
          >
            Close Matrix
          </button>
        </div>
      </div>
    </div>
  );
};
