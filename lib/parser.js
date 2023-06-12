const nearley = require('nearley');
const grammar = require('./grammar');

module.exports = {
    newickToAST,
    newickToJSON
}

function parser() {
    return new nearley.Parser(grammar.ParserRules, grammar.ParserStart)
}

function newickToAST(input) {
    let nep = parser();
    const ast = nep.feed(input).results[0];
    return ast;
}

function newickToJSON(input) {
    const ast = newickToAST(input);
    const nodes = ast[0]; // array of parent and direct children, `Tree` nonterminal in nearley  
    const rootNode = nodes[find_idx_of_parent_from_newick_treeArr(nodes)]; // assumed to exist  
    return newick_treeArr_to_graph([nodes], rootNode);
}

function newick_treeArr_to_graph(startingTreeArr, closestAncestorNode={}) {
    const treeArr = startingTreeArr[0];

    let newParentNodeInThisIteration = {}; // update if new internal node is found

    const edges = [];
    const nodes = []

    let subTreeArr = []; // polytomy at the actual tree can be represented as nested subTreeArr
    const idxOfSubTreeArrFromTreeArr = find_idx_of_children_from_newick_nodes(treeArr); 
    
    // console.log('// treeArr:\n', JSON.stringify(treeArr))
    // console.log(`\n//idxOfSubTreeArrFromTreeArr: ${idxOfSubTreeArrFromTreeArr} (out of max idx: ${treeArr.length-1})`);
    
    for (const i in treeArr) {
        // console.log(`// testing ${i}:\n`, JSON.stringify(treeArr[i]));
        if (idxOfSubTreeArrFromTreeArr.includes(i)) {
            if (subTreeArr.length >= 2) {
                // TODO verify if this is true
                throw new Error("There cannot be more than array containing children");
            }
            // console.log("// found child")
            subTreeArr.push([treeArr[i]]);
        }
        else if (newick_node_is_leaf(treeArr[i])) {
            // console.log("// found leaf")
            nodes.push(newick_node_get_leaf(treeArr[i]));
            edges.push({
                id: closestAncestorNode.id + ":" + treeArr[i].id,
                dir: "uni",
                weight: newick_node_get_leaf(treeArr[i]).nodeMetadata.edge_length
            });
        }
        else if (newick_node_is_internal(treeArr[i])) {
            // console.log("// found internal node")
            nodes.push(treeArr[i])
            edges.push({
                id: closestAncestorNode.id + ":" + treeArr[i].id,
                dir: "uni",
                weight: treeArr[i].nodeMetadata.edge_length
            })
            // Set new parent to be passed off to next iteration
            newParentNodeInThisIteration = treeArr[i]
        }
        // else {
        //     // "(", ")", and ","
        //     console.log("// found nothing")
        // }
    }
    // console.log("// -- Loop end");

    // console.log("// closestAncestorNode: ", JSON.stringify(closestAncestorNode));
    // console.log("// newParentNodeInThisIteration: ", JSON.stringify(newParentNodeInThisIteration));
    // console.log(`// edges: ${edges.length}`)
    // console.log(`// subTreeArr: ${subTreeArr.length}`); // : \n`, JSON.stringify(subTreeArr));
    
    nodes.forEach((node) => {
        console.log("// node: ", JSON.stringify(node));
    });
    edges.forEach((edge) => {
        // edge.parentNodeId is undefined for root
        // if (edge.parentNodeId && 'parentNodeId' in edge) {
            console.log("// edge: ", JSON.stringify(edge));
        // }
    });

    if (subTreeArr.length === 0) {
        // base case
        // console.log("// ---> reached terminal level")
        return;
    } 
    // recursive case
    let closestAncestorNodeForNextIteration;
    if ('id' in newParentNodeInThisIteration) {
        closestAncestorNodeForNextIteration = newParentNodeInThisIteration
    } else {
        closestAncestorNodeForNextIteration = closestAncestorNode
    }

    // TODO test stack blowing up for deep trees
    for (const i in subTreeArr) {
        // console.log(`// Running Recursive ${JSON.stringify(subTreeArr[i])}`);
        newick_treeArr_to_graph(subTreeArr[i], closestAncestorNodeForNextIteration);
    }
    return;
}

function newick_node_is_polytomy(node) {
    // polytomy of subtrees are triple nested
    return (Array.isArray(node) 
            && node.length === 1 
            && Array.isArray(node.at(0)) && node.at(0).length === 1
            && Array.isArray(node.at(0).at(0)) && node.at(0).at(0).length !== 1
    )
}

function newick_node_is_leaf(node) {
    return (Array.isArray(node) 
            && node.length === 1 
            && Array.isArray(node.at(0)) && node.at(0).length === 1
            && 'nodeMetadata' in node[0][0])
}

function newick_node_get_leaf(node) {
    // check newick_node_is_leaf() before calling
    return node[0][0];
}

function newick_node_is_internal(node) {
    return (typeof node !== 'string' 
        && !Array.isArray(node) 
        && 'nodeMetadata' in node)
}

function find_idx_of_parent_from_newick_treeArr(astNodeArr) {
    for (const i in astNodeArr) {
        if (typeof astNodeArr[i] !== 'string' // skip : ( , ) ;
            && !Array.isArray(astNodeArr[i]) // array is subtree
            && 'nodeMetadata' in astNodeArr[i]
        ) {
            return i
        }
    }
}

function find_idx_of_children_from_newick_nodes(astNodeArr) {
    const childrenIdxArr = [];
    for (const i in astNodeArr) {
        if (typeof astNodeArr[i] !== 'string' // skip : ( , ) ;
        ) {
            if (!newick_node_is_leaf(astNodeArr[i]) && !newick_node_is_internal(astNodeArr[i])) {
                childrenIdxArr.push(i);
            }
        }
    }
    return childrenIdxArr
}