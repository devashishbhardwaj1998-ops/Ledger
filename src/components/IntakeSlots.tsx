import React, { useRef, useState } from 'react';
import { UploadCloud, CheckCircle2, FileText, Link, Sparkles, X, RefreshCw } from 'lucide-react';
import { RawEmployeeRow, RawEmployerRow } from '../types';
import {
  readSheet,
  normalizeEmployeeRows,
  normalizeEmployerRows,
  extractSheetInfo,
  parseCSV
} from '../utils/parser';
import { getSampleDataPullSheet, getSampleEmployerPlanningSheet } from '../utils/sampleData';

interface IntakeSlotsProps {
  employeeFile: { name: string; sizeText?: string } | null;
  employerFile: { name: string; sizeText?: string } | null;
  onEmployeeLoaded: (fileInfo: { name: string; sizeText: string }, rows: RawEmployeeRow[]) => void;
  onEmployerLoaded: (fileInfo: { name: string; sizeText: string }, rows: RawEmployerRow[]) => void;
  onClearEmployee: () => void;
  onClearEmployer: () => void;
  onError: (msg: string) => void;
}

export const IntakeSlots: React.FC<IntakeSlotsProps> = ({
  employeeFile,
  employerFile,
  onEmployeeLoaded,
  onEmployerLoaded,
  onClearEmployee,
  onClearEmployer,
  onError
}) => {
  const [isDragA, setIsDragA] = useState(false);
  const [isDragB, setIsDragB] = useState(false);
  const [gsheetUrl, setGsheetUrl] = useState('');
  const [gsheetLoading, setGsheetLoading] = useState(false);
  const [gsheetStatus, setGsheetStatus] = useState<{ text: string; type: 'ok' | 'err' | 'idle' }>({
    text: 'Not loaded',
    type: 'idle'
  });

  const fileInputARef = useRef<HTMLInputElement>(null);
  const fileInputBRef = useRef<HTMLInputElement>(null);

  const handleProcessFileA = async (file: File) => {
    try {
      const { aoa } = await readSheet(file, null);
      const rows = normalizeEmployeeRows(aoa);
      const sizeText = `${(Math.round(file.size / 102.4) / 10).toFixed(1)} KB • ${rows.length} rows`;
      onEmployeeLoaded({ name: file.name, sizeText }, rows);
    } catch (err: any) {
      onError(`Could not read Exhibit A (${file.name}): ${err.message}`);
    }
  };

  const handleProcessFileB = async (file: File) => {
    try {
      const { aoa, sheetName } = await readSheet(file, 'content');
      const rows = normalizeEmployerRows(aoa);
      const sizeText = `Tab: "${sheetName}" • ${(Math.round(file.size / 102.4) / 10).toFixed(1)} KB • ${rows.length} rows`;
      onEmployerLoaded({ name: file.name, sizeText }, rows);
      setGsheetStatus({
        text: `Using "${sheetName}" tab from ${file.name}.`,
        type: 'ok'
      });
    } catch (err: any) {
      onError(`Could not read Exhibit B (${file.name}): ${err.message}`);
    }
  };

  const handleLoadGoogleSheet = async () => {
    const url = gsheetUrl.trim();
    if (!url) {
      setGsheetStatus({ text: 'Paste a Google Sheet link first.', type: 'err' });
      return;
    }
    const info = extractSheetInfo(url);
    if (!info) {
      setGsheetStatus({
        text: 'That does not look like a valid Google Sheets URL (expected .../spreadsheets/d/SHEET_ID/...).',
        type: 'err'
      });
      return;
    }

    setGsheetLoading(true);
    setGsheetStatus({ text: 'Fetching Google Sheet data…', type: 'idle' });

    const csvUrl = `https://docs.google.com/spreadsheets/d/${info.id}/gviz/tq?tqx=out:csv&gid=${info.gid}`;
    try {
      const res = await fetch(csvUrl);
      if (!res.ok) {
        throw new Error(
          `Sheet returned HTTP ${res.status} — verify that sharing is set to "Anyone with the link can view"`
        );
      }
      const text = await res.text();
      if (/^\s*<!DOCTYPE html/i.test(text) || /^\s*<html/i.test(text)) {
        throw new Error(
          'Received a sign-in or authorization page instead of CSV data — sheet is not publicly viewable'
        );
      }
      const aoa = parseCSV(text);
      const rows = normalizeEmployerRows(aoa);
      onEmployerLoaded(
        {
          name: `Google Sheet (${info.id.slice(0, 10)}…, gid ${info.gid})`,
          sizeText: `${rows.length} rows`
        },
        rows
      );
      setGsheetStatus({ text: `Successfully loaded ${rows.length} rows from Google Sheet.`, type: 'ok' });
    } catch (err: any) {
      let msg = err.message;
      if (err instanceof TypeError) {
        msg =
          'Network request blocked. Ensure the sheet is shared as "Anyone with the link can view", or upload the sheet as .xlsx/.csv export.';
      }
      setGsheetStatus({ text: `Could not load: ${msg}`, type: 'err' });
      onError(`Google Sheet Error: ${msg}`);
    } finally {
      setGsheetLoading(false);
    }
  };

  return (
    <div className="mb-6">
      <div className="grid grid-cols-1 md:grid-cols-2 border border-[var(--card-border)] bg-[var(--card-bg)]">
        {/* Exhibit A Slot */}
        <div className="p-5 sm:p-6 border-b md:border-b-0 md:border-r border-[var(--card-border)] flex flex-col justify-between">
          <div>
            <span className="font-mono text-[10px] tracking-[2px] uppercase text-[var(--brass)] block mb-1 font-bold">
              Exhibit A
            </span>
            <h3 className="font-serif font-bold text-xl sm:text-2xl text-[var(--ink)] mb-1">
              Data Pull Sheet
            </h3>
            <p className="font-mono text-[11.5px] text-[var(--text-muted)] mb-3.5 leading-relaxed">
              Master log for all workers. Columns: <code>assetName</code>, <code>minutes</code>, <code>type</code>, <code>userID</code>, <code>firstName</code>, <code>lastName</code>.
            </p>

            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragA(true);
              }}
              onDragLeave={() => setIsDragA(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragA(false);
                if (e.dataTransfer.files[0]) handleProcessFileA(e.dataTransfer.files[0]);
              }}
              onClick={() => fileInputARef.current?.click()}
              className={`border-1.5 border-dashed p-5 text-center cursor-pointer transition-all ${
                isDragA
                  ? 'border-[var(--brass)] bg-[var(--brass-light)]'
                  : employeeFile
                  ? 'border-[var(--ok)] bg-[var(--ok-bg)] text-left'
                  : 'border-[var(--input-border)] bg-[var(--paper-card)] hover:border-[var(--brass)] hover:bg-[var(--brass-light)]/40'
              }`}
            >
              {employeeFile ? (
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-5 h-5 text-[var(--ok)] shrink-0 mt-0.5" />
                    <div>
                      <div className="font-mono text-[12.5px] font-bold text-[var(--ink)] break-all">
                        {employeeFile.name}
                      </div>
                      <div className="font-mono text-[11px] text-[var(--text-muted)] mt-0.5">
                        {employeeFile.sizeText} &mdash; Loaded & verified
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onClearEmployee();
                      if (fileInputARef.current) fileInputARef.current.value = '';
                    }}
                    className="p-1 text-[var(--text-subtle)] hover:text-[var(--flag)] cursor-pointer"
                    title="Remove file"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="font-mono text-[11.5px] text-[var(--text-muted)] flex flex-col items-center gap-1.5 py-1">
                  <UploadCloud className="w-6 h-6 text-[var(--brass)]" />
                  <span>Click to choose, or drop <strong>.xlsx / .csv</strong> here</span>
                </div>
              )}
            </div>
            <input
              ref={fileInputARef}
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.[0]) handleProcessFileA(e.target.files[0]);
              }}
            />
          </div>

          <div className="mt-3 pt-3 border-t border-[var(--rule)] flex items-center justify-between text-[11px] font-mono text-[var(--text-subtle)]">
            <span>Accepted formats: .xlsx, .xls, .csv</span>
          </div>
        </div>

        {/* Exhibit B Slot */}
        <div className="p-5 sm:p-6 flex flex-col justify-between">
          <div>
            <span className="font-mono text-[10px] tracking-[2px] uppercase text-[var(--brass)] block mb-1 font-bold">
              Exhibit B
            </span>
            <h3 className="font-serif font-bold text-xl sm:text-2xl text-[var(--ink)] mb-1">
              Daily Planning Sheet
            </h3>
            <p className="font-mono text-[11.5px] text-[var(--text-muted)] mb-3.5 leading-relaxed">
              Target employee workbook (e.g. &ldquo;Content&rdquo; sheet or flat table with <code>Date</code>, <code>Asset name</code>, <code>Production</code>, <code>Review</code>, <code>Status</code>).
            </p>

            {/* Google Sheets Fetcher */}
            <div className="flex gap-2 mb-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={gsheetUrl}
                  onChange={(e) => setGsheetUrl(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleLoadGoogleSheet();
                    }
                  }}
                  placeholder="https://docs.google.com/spreadsheets/d/..."
                  className="w-full font-mono text-[12px] px-3 py-2 border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--input-text)] focus:outline-none focus:border-[var(--brass)] pr-8 placeholder:text-[var(--text-dim)]"
                />
                <Link className="w-3.5 h-3.5 text-[var(--text-subtle)] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
              <button
                type="button"
                disabled={gsheetLoading}
                onClick={handleLoadGoogleSheet}
                className="font-mono text-[11px] font-bold tracking-wider uppercase bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] hover:bg-[var(--btn-primary-hover)] px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shrink-0 flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                {gsheetLoading && <RefreshCw className="w-3 h-3 animate-spin" />}
                <span>{gsheetLoading ? 'Fetching' : 'Load'}</span>
              </button>
            </div>

            <div
              className={`font-mono text-[11px] mb-2.5 min-h-[16px] ${
                gsheetStatus.type === 'ok'
                  ? 'text-[var(--ok)] font-medium'
                  : gsheetStatus.type === 'err'
                  ? 'text-[var(--flag)] font-medium'
                  : 'text-[var(--text-muted)]'
              }`}
            >
              {gsheetStatus.text}
            </div>

            <div className="flex items-center gap-2 my-2 font-mono text-[10px] uppercase tracking-wider text-[var(--text-subtle)]">
              <div className="flex-1 h-[1px] bg-[var(--rule)]" />
              <span>or upload file</span>
              <div className="flex-1 h-[1px] bg-[var(--rule)]" />
            </div>

            {/* Dropzone for Exhibit B */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragB(true);
              }}
              onDragLeave={() => setIsDragB(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragB(false);
                if (e.dataTransfer.files[0]) handleProcessFileB(e.dataTransfer.files[0]);
              }}
              onClick={() => fileInputBRef.current?.click()}
              className={`border-1.5 border-dashed p-3.5 text-center cursor-pointer transition-all ${
                isDragB
                  ? 'border-[var(--brass)] bg-[var(--brass-light)]'
                  : employerFile
                  ? 'border-[var(--ok)] bg-[var(--ok-bg)] text-left'
                  : 'border-[var(--input-border)] bg-[var(--paper-card)] hover:border-[var(--brass)] hover:bg-[var(--brass-light)]/40'
              }`}
            >
              {employerFile ? (
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[var(--ok)] shrink-0 mt-0.5" />
                    <div>
                      <div className="font-mono text-[12px] font-bold text-[var(--ink)] break-all">
                        {employerFile.name}
                      </div>
                      <div className="font-mono text-[10.5px] text-[var(--text-muted)]">
                        {employerFile.sizeText} &mdash; Attached
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onClearEmployer();
                      if (fileInputBRef.current) fileInputBRef.current.value = '';
                    }}
                    className="p-1 text-[var(--text-subtle)] hover:text-[var(--flag)] cursor-pointer"
                    title="Remove file"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="font-mono text-[11px] text-[var(--text-muted)] flex items-center justify-center gap-2">
                  <FileText className="w-4 h-4 text-[var(--brass)]" />
                  <span>Drop a <strong>.xlsx / .csv</strong> export here</span>
                </div>
              )}
            </div>
            <input
              ref={fileInputBRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.[0]) handleProcessFileB(e.target.files[0]);
              }}
            />
          </div>

          <div className="mt-3 pt-3 border-t border-[var(--rule)] flex items-center justify-between text-[11px] font-mono text-[var(--text-subtle)]">
            <span>Requires Google Sheet link or .xlsx / .csv file</span>
          </div>
        </div>
      </div>
    </div>
  );
};
