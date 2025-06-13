const fs = require('fs');
const path = require('path');
const Papa = require('papaparse');
const XLSX = require('xlsx');

function normalizeKey(k) {
  return k ? k.toString().trim().toLowerCase().replace(/\s+/g, '') : '';
}

function hasPartnerColumn(row) {
  return row && Object.keys(row).some(k => normalizeKey(k).includes('partner'));
}

function hasSystemColumn(row) {
  return row && Object.keys(row).some(k => normalizeKey(k).includes('system'));
}

function validateColumns(row, required = ['partner', 'system']) {
  if (!row) return false;
  const keys = Object.keys(row).map(normalizeKey);
  return required.every(req => {
    const norm = normalizeKey(req);
    return keys.some(k => k.includes(norm));
  });
}

function parseFileSync(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  let rows = [];
  if (ext === '.xlsx' || ext === '.xls') {
    const wb = XLSX.readFile(filePath);
    const ws = wb.Sheets[wb.SheetNames[0]];
    rows = XLSX.utils.sheet_to_json(ws);
  } else {
    const content = fs.readFileSync(filePath, 'utf8');
    const result = Papa.parse(content, {
      header: true,
      skipEmptyLines: true,
      delimitersToGuess: [',', ';', '\t', '|']
    });
    if (result.errors && result.errors.length) {
      throw new Error('Parse error');
    }
    rows = result.data.filter(r => Object.keys(r).length);
  }
  if (rows.length && !validateColumns(rows[0])) {
    throw new Error('Missing required column');
  }
  return rows;
}

function createXLSXBuffer(rows) {
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
}

module.exports = {
  normalizeKey,
  validateColumns,
  parseFileSync,
  createXLSXBuffer,
};
