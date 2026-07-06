import { useState } from 'react';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

function downloadBlob(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function toCsv(columns, rows) {
  const escapeCell = (value) => {
    const str = String(value ?? '');
    return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
  };
  const header = columns.map((c) => escapeCell(c.label)).join(',');
  const body = rows.map((row) => columns.map((c) => escapeCell(c.value(row))).join(',')).join('\n');
  return `${header}\n${body}`;
}

/**
 * `columns`: [{ label, value: (row) => string }].
 * `rows`: fallback data (e.g. the currently visible page) if `fetchAll` isn't given.
 * `fetchAll`: optional async () => rows[] - when provided, exports pull the
 * complete filtered result set instead of just what's on screen.
 */
export default function ExportButtons({ columns, rows, fetchAll, filename, title }) {
  const [exporting, setExporting] = useState(false);
  const disabled = exporting || (rows.length === 0 && !fetchAll);

  const getRows = async () => {
    if (fetchAll) return fetchAll();
    return rows;
  };

  const runExport = async (format) => {
    setExporting(true);
    try {
      const data = await getRows();
      if (data.length === 0) return;

      if (format === 'csv') {
        downloadBlob(toCsv(columns, data), `${filename}.csv`, 'text/csv;charset=utf-8;');
      } else {
        const doc = new jsPDF({ orientation: columns.length > 5 ? 'landscape' : 'portrait' });
        doc.setFontSize(14);
        doc.text(title, 14, 16);
        doc.autoTable({
          startY: 22,
          head: [columns.map((c) => c.label)],
          body: data.map((row) => columns.map((c) => c.value(row))),
          styles: { fontSize: 8 },
          headStyles: { fillColor: [79, 70, 229] },
        });
        doc.save(`${filename}.pdf`);
      }
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="export-buttons">
      <button className="export-btn" onClick={() => runExport('csv')} disabled={disabled}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
        </svg>
        {exporting ? 'Exporting…' : 'CSV'}
      </button>
      <button className="export-btn" onClick={() => runExport('pdf')} disabled={disabled}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
        </svg>
        {exporting ? 'Exporting…' : 'PDF'}
      </button>
    </div>
  );
}
