const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { parseCsvString } = require('../csv-utils');

const csvPath = path.join(__dirname, '..', 'PARTNER.csv');
const content = fs.readFileSync(csvPath, 'utf8');
const rows = parseCsvString(content);
assert.ok(rows.length > 0, 'rows should be parsed from csv string');
console.log('first row:', JSON.stringify(rows[0]));
console.log('renderer parse test passed');

