# nearley-newick
Newick tree format parser using nearley.js

# Folder structure


# Compile grammar and parse Newick
Convert Newick `.tree` into `.ast` using `tree.ne` file.

`GRAMMAR=tree npm run parse tests/ex-1-leaf-nodes-named.tree`

# Compile grammar, parse Newick, and convert to graph
Do everything end-to-end

`GRAMMAR=tree npm run generate ast/tree/ex-6-distances-and-all-names.ast`


# Run test suite

Only compiling and parsing to `.ast`

`GRAMMAR=tree npm run test-parse`

Compiple, parse to `.ast`, and convert to graph

`GRAMMAR=tree npm run test-generate`