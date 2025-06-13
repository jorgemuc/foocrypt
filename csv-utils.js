(function(root, factory) {
  if (typeof module === 'object' && module.exports) {
    const fs = require('fs');
    const path = require('path');
    const Papa = require('papaparse');
    const XLSX = require('xlsx');
    module.exports = factory(fs, path, Papa, XLSX);
  } else {
    root.csvUtils = factory(null, null, root.Papa, root.XLSX);
  }
}(this, function(fs, path, Papa, XLSX) {
  function normalizeKey(k) {
    return k ? k.toString().trim().toLowerCase().replace(/\s+/g, '') : '';
  }
  function hasPartnerColumn(row) {
    return row && Object.keys(row).some(k => normalizeKey(k).includes('partner'));
  }
  function hasSystemColumn(row) {
    return row && Object.keys(row).some(k => normalizeKey(k).includes('system'));
  }
  function getMissingColumns(row, required = ['partner', 'system']) {
    if (!row) return required.slice();
    const keys = Object.keys(row).map(normalizeKey);
    return required.filter(req => {
      const norm = normalizeKey(req);
      return !keys.some(k => k.includes(norm));
    });
  }
  function validateColumns(row, required = ['partner', 'system']) {
    return getMissingColumns(row, required).length === 0;
  }
  function parseCsvString(content, required = ['partner', 'system']) {
    const result = Papa.parse(content, {
      header: true,
      skipEmptyLines: true,
      delimitersToGuess: [',', ';', '\t', '|']
    });
    if (result.errors && result.errors.length) {
      throw new Error('Parse error');
    }
    const rows = result.data.filter(r => Object.keys(r).length);
    if (rows.length && !validateColumns(rows[0], required)) {
      throw new Error('Missing required column');
    }
    return rows;
  }
  function parseFileSync(filePath) {
    if (!fs || !path) throw new Error('File system access not available');
    const ext = path.extname(filePath).toLowerCase();
    if (ext === '.xlsx' || ext === '.xls') {
      const wb = XLSX.readFile(filePath);
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(ws);
      if (rows.length && !validateColumns(rows[0])) {
        throw new Error('Missing required column');
      }
      return rows;
    }
    const content = fs.readFileSync(filePath, 'utf8');
    return parseCsvString(content);
  }
  function createXLSXBuffer(rows) {
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
    return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  }
  return {
    normalizeKey,
    getMissingColumns,
    validateColumns,
    parseCsvString,
    parseFileSync,
    createXLSXBuffer,
  };
}));
