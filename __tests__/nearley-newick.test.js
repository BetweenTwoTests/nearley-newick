'use strict';

const nn = require('..');
const fs = require('fs');

const assert = require('assert').strict;

const ex2 = fs.readFileSync('__tests__/examples/ex-2-all-nodes-named.tree', 'utf8')
nn.newickToJSON(ex2);

console.info('nearley-newick tests passed');