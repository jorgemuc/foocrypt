const assert = require('assert');
const path = require('path');
const { parseFileSync, validateColumns } = require('../csv-utils');

const samplePath = path.join(__dirname, '..', 'PARTNER.csv');

const rows = parseFileSync(samplePath);
assert.ok(Array.isArray(rows) && rows.length > 0, 'should parse rows');
assert.ok(validateColumns(rows[0]), 'columns should be valid');

console.log('csv utils tests passed');
