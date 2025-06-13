const assert = require('assert');
const path = require('path');
const { parseFileSync, validateColumns, parseCsvString } = require('../csv-utils');

const samplePath = path.join(__dirname, '..', 'PARTNER.csv');

const rows = parseFileSync(samplePath);
assert.ok(Array.isArray(rows) && rows.length > 0, 'should parse rows');
assert.ok(validateColumns(rows[0]), 'columns should be valid');

console.log('csv utils tests passed');

const sampleString = "Partner,System\nA,S";
const rows2 = parseCsvString(sampleString, ['partner','system']);
assert.strictEqual(rows2.length, 1, 'parseCsvString should parse one row');
console.log('parseCsvString test passed');
