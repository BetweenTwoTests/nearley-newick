const nearley = require('nearley');
const fs = require('fs')
const path = require('path')

function main() {
    const grammarName = process.argv[2]; // eg. nhx
    const fileNames = process.argv[3].split(","); // eg. tests/example.tree,tests/example2.tree
    const grammar = require(`./grammars/${grammarName}/${grammarName}.js`);

    for (const fileName of fileNames) {
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
    }
}

main()