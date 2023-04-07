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
    return newick_nodes_to_graph([nodes]);
}

function newick_nodes_to_graph(startingNodes, closestAncestorNode={}) {
    const nodes = startingNodes[0];

    let newParentNodeInThisIteration = {}; // update if new internal node is found

    let childNodeArray = []; // polytomy is represented as nested binary, so this is always length <=2 
    const nodeConnection = [];
    // console.log('// nodes:\n', JSON.stringify(nodes))
    const idxOfChildNodeArrFromNodes = find_idx_of_children_from_newick_nodes(nodes); 
    // console.log(`\n//idxOfChildNodeArrFromNodes: ${idxOfChildNodeArrFromNodes}`);
    for (const i in nodes) {
        // console.log(`// testing ${i}:\n`, JSON.stringify(nodes[i]));
        if (idxOfChildNodeArrFromNodes.includes(i)) { // if (Array.isArray(nodes[i]) && Array.isArray(nodes[i].at(0))) {
            // subtree
            if (childNodeArray.length > 1) {
                throw new Error("There cannot be more than array containing children");
            }
            childNodeArray.push(nodes[i]);
            // console.log("// found child")
        }
        else if (newick_node_is_leaf(nodes[i])) {
            // isLeaf
            nodeConnection.push({ 
                // parentNodeId: parentNode.id, 
                ...newick_node_get_leaf(nodes[i])
            });
            // console.log("// found leaf")
        }
        else if (newick_node_is_internal(nodes[i])) {
            nodeConnection.push({
                // parentNodeId: parentNode.id,
                ...nodes[i]
            })
            
            // Replace new parent
            newParentNodeInThisIteration = nodes[i]
            // console.log("// found internal")
        }
        // else {
        //     // console.log("// found nothing")
        // }
    }
    // console.log("// -- Loop end");
    // console.log("// parent:\n", JSON.stringify(parentNode));
    // console.log(`// child: ${childNodeArray.length}: \n`, JSON.stringify(childNodeArray));

    let parentNode = closestAncestorNode ? nodes[find_idx_of_parent_from_newick_nodes(nodes)] : closestAncestorNode;

    nodeConnection.forEach((n) => {
        // Ignore the self connection happens on root node. 
        if (parentNode.id !== n.id) {
            const edge = {
                parentNodeId: parentNode.id,
                ...n
            };

            // TODO use graph class to save edge
            console.log("// Found node-connection: ", JSON.stringify(edge))
        }
    });

    if (childNodeArray.length === 0) {
        // base case
        // console.log("// ---> reached terminal level\n")
        return;
    } else {
        // recursive case
        // console.log('// Called recursive')

        if (newParentNodeInThisIteration) {
            return newick_nodes_to_graph(childNodeArray, parentNode);
        } else {
            return newick_nodes_to_graph(childNodeArray, newParentNodeInThisIteration);
        }
    }
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
    return (typeof node !== 'string' && !Array.isArray(node) &&  'nodeMetadata' in node)
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