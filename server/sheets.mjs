import { getSheetsAccessToken } from './googleAuth.mjs';

function extractSheetId(urlOrId) {
  const match = String(urlOrId).match(/\/d\/([a-zA-Z0-9-_]+)/);
  return match ? match[1] : String(urlOrId).trim();
}

function columnLetter(index) {
  let n = index + 1;
  let letters = '';
  while (n > 0) {
    const rem = (n - 1) % 26;
    letters = String.fromCharCode(65 + rem) + letters;
    n = Math.floor((n - 1) / 26);
  }
  return letters;
}

async function sheetsFetch(path, options = {}) {
  const token = await getSheetsAccessToken();
  const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${path}`, {
    ...options,
    headers: { Authorization: `Bearer ${token}`, ...(options.headers || {}) },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || 'Google Sheets request failed.');
  return data;
}

export async function getHeaderRow({ sheetUrl, tabName }) {
  const sheetId = extractSheetId(sheetUrl);
  const data = await sheetsFetch(
    `${sheetId}/values/${encodeURIComponent(`${tabName}!1:1`)}`
  );
  return data.values?.[0] || [];
}

/**
 * Reads every data row (everything after the header) and maps each row's
 * cells to field names using the saved column mapping. Each row is tagged
 * with its 1-based sheet row number so status can be written back to the
 * right place afterward.
 */
export async function readSheetRows({ sheetUrl, tabName, mapping }) {
  const sheetId = extractSheetId(sheetUrl);
  const data = await sheetsFetch(`${sheetId}/values/${encodeURIComponent(tabName)}`);

  const [headerRow, ...dataRows] = data.values || [];
  if (!headerRow) return { headerRow: [], rows: [] };

  const colIndex = {};
  Object.entries(mapping || {}).forEach(([field, columnName]) => {
    if (columnName) colIndex[field] = headerRow.indexOf(columnName);
  });

  const rows = dataRows.map((row, i) => {
    const entry = { sheetRow: i + 2 };
    Object.entries(colIndex).forEach(([field, idx]) => {
      entry[field] = idx >= 0 ? row[idx] || '' : '';
    });
    return entry;
  });

  return { headerRow, rows };
}

/**
 * Writes a single cell — the status column, for one specific row — back
 * into the sheet. Requires the sheet to be shared with the service
 * account email as Editor.
 */
export async function writeStatus({ sheetUrl, tabName, sheetRow, headerRow, statusColumn, value }) {
  const sheetId = extractSheetId(sheetUrl);
  const colIdx = headerRow.indexOf(statusColumn);
  if (colIdx < 0) throw new Error(`Status column "${statusColumn}" not found in the sheet.`);

  const range = `${tabName}!${columnLetter(colIdx)}${sheetRow}`;
  await sheetsFetch(`${sheetId}/values/${encodeURIComponent(range)}?valueInputOption=RAW`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ values: [[value]] }),
  });
}

export function isReadyRow(row) {
  return (row.status || '').trim().toLowerCase() === 'ready';
}
