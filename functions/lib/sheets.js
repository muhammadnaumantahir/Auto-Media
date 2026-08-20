const { google } = require("googleapis");
const path = require("path");

let sheetsClientPromise = null;

function getSheetsClient() {
  if (!sheetsClientPromise) {
    const auth = new google.auth.GoogleAuth({
      keyFile: path.join(__dirname, "..", "serviceAccountKey.json"),
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });
    sheetsClientPromise = google.sheets({ version: "v4", auth });
  }
  return sheetsClientPromise;
}

// A, B, C ... Z, AA, AB ... from a zero-based column index.
function columnLetter(index) {
  let n = index + 1;
  let letters = "";
  while (n > 0) {
    const rem = (n - 1) % 26;
    letters = String.fromCharCode(65 + rem) + letters;
    n = Math.floor((n - 1) / 26);
  }
  return letters;
}

/**
 * Reads every row under the header row and returns them alongside their
 * real sheet row number (so we can write a status back to the right cell).
 */
async function readRows(sheetId, tabName, headers) {
  const sheets = getSheetsClient();
  const lastCol = columnLetter(headers.length - 1);
  const range = `${tabName}!A2:${lastCol}`;
  const res = await sheets.spreadsheets.values.get({ spreadsheetId: sheetId, range });
  const values = res.data.values || [];

  return values.map((row, i) => {
    const record = { rowNumber: i + 2 }; // +2: header is row 1, data starts row 2
    headers.forEach((h, colIdx) => {
      record[h] = row[colIdx] || "";
    });
    return record;
  });
}

/**
 * Writes a single value into the status column for one row.
 */
async function writeStatus(sheetId, tabName, rowNumber, statusColumnHeader, headers, value) {
  const sheets = getSheetsClient();
  const colIndex = headers.indexOf(statusColumnHeader);
  if (colIndex === -1) throw new Error(`Status column "${statusColumnHeader}" not found in headers`);
  const cell = `${tabName}!${columnLetter(colIndex)}${rowNumber}`;
  await sheets.spreadsheets.values.update({
    spreadsheetId: sheetId,
    range: cell,
    valueInputOption: "RAW",
    requestBody: { values: [[value]] },
  });
}

module.exports = { readRows, writeStatus, columnLetter };
