const assert = require('assert');
const { validateColumns, getMissingColumns } = require('../csv-utils');

const row = { 'PartnerName': 'A', 'SystemName': 'S', 'Other': 'x' };
// Should succeed when both required columns are present
assert.strictEqual(validateColumns(row, ['partnername','systemname']), true);
// Should fail when a required column is missing
assert.strictEqual(validateColumns(row, ['partnername','missing']), false);
// Should list missing column
assert.deepStrictEqual(getMissingColumns(row, ['partnername','missing']), ['missing']);
console.log('validateColumns custom requirement tests passed');
