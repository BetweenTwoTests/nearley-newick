'use strict';
const parser = require('./parser');

module.exports = {
    newickToAST: parser.newickToAST,
    newickToJSON: parser.newickToJSON
}

