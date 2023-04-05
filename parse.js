const nearley = require('nearley');
const fs = require('fs')
const path = require('path')

function main() {
    const grammarName = process.argv[2]; // eg. nhx
    const fileName = process.argv[3]; // eg. tests/nhx/example1.nhx
    const grammar = require(`./grammars/${grammarName}/${grammarName}.js`);
    const outputFilename = `./tests/${grammarName}/` + path.basename(fileName, '.' + grammarName) + '.json';
    
    const parser = new nearley.Parser(nearley.Grammar.fromCompiled(grammar));
    const code = fs.readFileSync(fileName).toString();
    
    try {
        parser.feed(code);
        const ast = parser.results[0];
        fs.writeFileSync(outputFilename, JSON.stringify(ast, null, 2));
        // console.log('----------------');
        console.log(`Parse succeeded. Wrote to ${outputFilename}`);
        // console.log('----------------');
        // console.log(JSON.stringify(ast));
        // console.log(JSON.stringify(ast, null, 2));
    } catch (e) {
        console.log(`Parse failed: ${e.message}`)
    }
    // parser.feed("a := 12.50");
    // parser.feed("1234");
}

main()