const { loadSheet } = require('../config/googleSheetsClient');

/**
 * Extracts the Google Sheet ID from a full sheet URL, or returns the
 * input unchanged if it's already a bare ID.
 */
function extractSheetId(urlOrId) {
  const match = String(urlOrId).match(/\/d\/([a-zA-Z0-9-_]+)/);
  return match ? match[1] : urlOrId;
}

/**
 * Returns the header row of a user's video sheet so the frontend can
 * offer a dropdown for column mapping (video link, title, status, etc).
 */
async function getSheetHeaders(sheetIdOrUrl) {
  const sheetId = extractSheetId(sheetIdOrUrl);
  const doc = await loadSheet(sheetId);
  const sheet = doc.sheetsByIndex[0];
  await sheet.loadHeaderRow();
  return { sheetId, sheetTitle: sheet.title, headers: sheet.headerValues };
}

/**
 * Reads all video rows from the user's sheet using their saved column
 * mapping, returning a normalized list Auto Media can work with.
 */
async function getVideoRows(sheetId, columnMapping) {
  const doc = await loadSheet(sheetId);
  const sheet = doc.sheetsByIndex[0];
  const rows = await sheet.getRows();

  return rows.map((row, index) => ({
    rowIndex: index,
    videoLink: columnMapping.videoLink ? row.get(columnMapping.videoLink) : '',
    title: columnMapping.title ? row.get(columnMapping.title) : '',
    description: columnMapping.description ? row.get(columnMapping.description) : '',
    status: columnMapping.status ? row.get(columnMapping.status) : '',
    platforms: columnMapping.platforms ? row.get(columnMapping.platforms) : '',
    _row: row,
  }));
}

/**
 * Writes a status update (and optionally posted links) back into the
 * user's own sheet, in the columns they mapped.
 */
async function writeStatus(row, columnMapping, { status, notes }) {
  if (columnMapping.status && status !== undefined) {
    row._row.set(columnMapping.status, status);
  }
  if (columnMapping.notes && notes !== undefined) {
    row._row.set(columnMapping.notes, notes);
  }
  await row._row.save();
}

module.exports = { extractSheetId, getSheetHeaders, getVideoRows, writeStatus };
