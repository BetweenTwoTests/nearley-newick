const nearley = require('nearley');
const grammar = require('./grammar');
const events = require('events');

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
    const ast_nodes = ast[0]; // array of parent and direct children, `Tree` nonterminal in nearley  
    const ast_rootNote = ast_nodes[find_idx_of_parent_from_newick_treeArr(ast_nodes)]; // assumed to exist  
    
    // Collect ast into JSON nodes and edges format
    const nodes = [];
    const edges = [];
    let em = new events.EventEmitter();
    em.on('ParsedNode', function (data) { nodes.push(data); })
    em.on('ParsedEdge', function (data) { edges.push(data); })

    newick_treeArr_to_graph(em, [ast_nodes], ast_rootNote);

    return { nodes, edges }
}

function newick_treeArr_to_graph(em, startingTreeArr, closestAncestorNode={}) {
    const treeArr = startingTreeArr[0];

    let newParentNodeInThisIteration = {}; // update if new internal node is found

    const edges = [];
    const nodes = []

    let subTreeArr = []; // polytomy at the actual tree can be represented as nested subTreeArr
    const idxOfSubTreeArrFromTreeArr = find_idx_of_children_from_newick_nodes(treeArr); 
    
    // console.debug('// treeArr:\n', JSON.stringify(treeArr))
    // console.debug(`\n//idxOfSubTreeArrFromTreeArr: ${idxOfSubTreeArrFromTreeArr} (out of max idx: ${treeArr.length-1})`);
    
    for (const i in treeArr) {
        // console.debug(`// testing ${i}:\n`, JSON.stringify(treeArr[i]));
        if (idxOfSubTreeArrFromTreeArr.includes(i)) {
            if (subTreeArr.length >= 2) {
                // TODO verify if this is true
                throw new Error("There cannot be more than array containing children");
            }
            // console.debug("// found child")
            subTreeArr.push([treeArr[i]]);
        }
        else if (newick_node_is_leaf(treeArr[i])) {
            // console.debug("// found leaf")
            nodes.push(newick_node_get_leaf(treeArr[i]));
            edges.push({
                id: closestAncestorNode.id + ":" + treeArr[i].id,
                dir: "uni",
                weight: newick_node_get_leaf(treeArr[i]).nodeMetadata.edge_length
            });
        }
        else if (newick_node_is_internal(treeArr[i])) {
            // console.debug("// found internal node")
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
        //     console.debug("// found nothing")
        // }
    }
    // console.debug("// -- Loop end");

    // console.debug("// closestAncestorNode: ", JSON.stringify(closestAncestorNode));
    // console.debug("// newParentNodeInThisIteration: ", JSON.stringify(newParentNodeInThisIteration));
    // console.debug(`// edges: ${edges.length}`)
    // console.debug(`// subTreeArr: ${subTreeArr.length}`); // : \n`, JSON.stringify(subTreeArr));
    
    nodes.forEach((node) => {
        console.debug("// node: ", JSON.stringify(node));
        em.emit('ParsedNode', node)
    });
    edges.forEach((edge) => {
        // edge.parentNodeId is undefined for root
        // if (edge.parentNodeId && 'parentNodeId' in edge) {
            console.debug("// edge: ", JSON.stringify(edge));
            em.emit('ParsedEdge', edge)
        // }
    });

    if (subTreeArr.length === 0) {
        // base case
        // console.debug("// ---> reached terminal level")
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
        // console.debug(`// Running Recursive ${JSON.stringify(subTreeArr[i])}`);
        newick_treeArr_to_graph(em, subTreeArr[i], closestAncestorNodeForNextIteration);
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