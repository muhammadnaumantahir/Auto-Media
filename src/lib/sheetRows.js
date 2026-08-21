import { googleSheetsApiKey } from '../firebaseConfig';

/**
 * Reads every data row (everything after row 1) from the connected sheet
 * and maps each row's cells to field names using the saved column mapping.
 * Returns rows in sheet order, each tagged with its 1-based sheet row
 * number (useful later for writing status back to the right row).
 */
export async function fetchSheetRows({ sheetUrl, tabName, mapping }) {
  const idMatch = sheetUrl.match(/\/d\/([a-zA-Z0-9-_]+)/);
  const sheetId = idMatch ? idMatch[1] : sheetUrl.trim();

  const range = `${tabName}`;
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodeURIComponent(
    range
  )}?key=${googleSheetsApiKey}`;

  const res = await fetch(url);
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error?.message || 'Could not read the sheet.');
  }

  const [headerRow, ...dataRows] = data.values || [];
  if (!headerRow) return [];

  const colIndex = {};
  Object.entries(mapping || {}).forEach(([field, columnName]) => {
    if (columnName) colIndex[field] = headerRow.indexOf(columnName);
  });

  return dataRows.map((row, i) => {
    const entry = { sheetRow: i + 2 }; // +2: 1-based, plus the header row
    Object.entries(colIndex).forEach(([field, idx]) => {
      entry[field] = idx >= 0 ? row[idx] || '' : '';
    });
    return entry;
  });
}

/**
 * A row is "ready to post" when its mapped status cell reads exactly
 * "ready" (case-insensitive, trimmed). Anything else — blank, "posted",
 * "failed: ..." — is left alone.
 */
export function isReadyRow(row) {
  return (row.status || '').trim().toLowerCase() === 'ready';
}
