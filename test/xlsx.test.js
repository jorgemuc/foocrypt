const assert = require('assert');
const { createXLSXBuffer } = require('../csv-utils');

const buf = createXLSXBuffer([{a:1,b:2}]);
assert.ok(Buffer.isBuffer(buf) && buf.length > 0, 'should create xlsx buffer');
console.log('xlsx buffer test passed');
