const fs = require('fs')
const path = require('path')

function main() {
    const grammarName = process.argv[2]; // eg. tree
    const fileNames = process.argv[3].split(","); // e.g. ast/tree/example1.ast,ast/tree/example2.ast

    for (const fileName of fileNames) {
        console.log(`Convert to graph: ${fileName}`);
        // const outputFileName = `./tests/${grammarName}/` + path.basename(fileName, ".ast") + ".json";
        const contents = fs.readFileSync(fileName).toString();
        const ast = JSON.parse(contents);
        const graph = json_to_graph(ast)
    }
}


function json_to_graph(ast) {
    const nodes = ast[0]; // array of parent and direct children, `Tree` nonterminal in nearley  
    const rootNode = nodes[find_idx_of_parent_from_newick_nodes(nodes)]; // assumed to exist  
    return newick_nodes_to_graph([nodes], rootNode);
}

function newick_nodes_to_graph(startingNodes, closestAncestorNode={}) {
    // const nodes = newick_node_is_polytomy(startingNodes) ? startingNodes[0][0]: startingNodes[0];
    const nodes = startingNodes[0];

    let newParentNodeInThisIteration = {}; // update if new internal node is found

    let childNodeArray = []; // polytomy is represented as nested binary, so this is always length <=2 
    const nodeConnection = [];
    const idxOfChildNodeArrFromNodes = find_idx_of_children_from_newick_nodes(nodes); 
    
    // console.log('// nodes:\n', JSON.stringify(nodes))
    // console.log(`\n//idxOfChildNodeArrFromNodes: ${idxOfChildNodeArrFromNodes} / ${nodes.length-1}`);
    
    for (const i in nodes) {
        // console.log(`// testing ${i}:\n`, JSON.stringify(nodes[i]));
        if (idxOfChildNodeArrFromNodes.includes(i)) { // if (Array.isArray(nodes[i]) && Array.isArray(nodes[i].at(0))) {
            // subtree
            if (childNodeArray.length >= 2) {
                throw new Error("There cannot be more than array containing children");
            }
            childNodeArray.push([nodes[i]]);
            // console.log("// found child")
        }
        else if (newick_node_is_leaf(nodes[i])) {
            // isLeaf
            nodeConnection.push({
                parentNodeId: closestAncestorNode.id,
                ...newick_node_get_leaf(nodes[i])
            });
            // console.log("// found leaf")
        }
        else if (newick_node_is_internal(nodes[i])) {
            nodeConnection.push({
                parentNodeId: closestAncestorNode.id,
                ...nodes[i]
            })
            
            // Replace new parent
            newParentNodeInThisIteration = nodes[i]
            // console.log("// found internal")
        }
        // else {
        //     console.log("// found nothing")
        // }
    }
    // console.log("// -- Loop end");

    // let parentNode = newParentNodeInThisIteration ? newParentNodeInThisIteration : closestAncestorNode;
    
    // console.log("// closestAncestorNode: ", JSON.stringify(closestAncestorNode));
    // console.log("// newParentNodeInThisIteration: ", JSON.stringify(newParentNodeInThisIteration));
    // console.log(`// nodeConnection: ${nodeConnection.length}`)
    // console.log(`// child: ${childNodeArray.length}`); // : \n`, JSON.stringify(childNodeArray));
    
    nodeConnection.forEach((edge) => {
        // edge.parentNodeId is undefined for root
        if (edge.parentNodeId && 'parentNodeId' in edge) {
            // TODO use graph class to save edge
            console.log("// Found node-connection", JSON.stringify(edge))
        }
    });

    if (childNodeArray.length === 0) {
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

    for (const i in childNodeArray) {
        // console.log(`// Running Recursive ${JSON.stringify(childNodeArray[i])}`);
        newick_nodes_to_graph(childNodeArray[i], closestAncestorNodeForNextIteration);
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

function find_idx_of_parent_from_newick_nodes(astNodeArr) {
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

main()