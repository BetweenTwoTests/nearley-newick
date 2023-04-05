@builtin "whitespace.ne" # `_` means arbitrary amount of whitespace
@builtin "number.ne"     # `int`, `decimal`, and `percentage` number primitives
@builtin "string.ne"    # `dqstring`, `sqstring`, `btstring`, `dstrchar`, `sstrchar`, `strescape`


Tree -> Subtree ";"
    | Branch ";"
@builtin "whitespace.ne" # `_` arbitrary amount of whitespace
@builtin "number.ne"     # `int`, `decimal`, and `percentage` number primitives
@builtin "string.ne"     # `dqstring`, `sqstring`, `btstring`, `dstrchar`, `sstrchar`, `strescape`

Tree -> Subtree ";"
    | Branch ";" 
    # TODO what if the file doesn't have ";"?

Subtree -> Leaf {% id %}
    | Internal {% id %}


Leaf -> 
    # Convert Node to into leafNode
    Node {%  
        data => {
            const leafNode =  {
                ...data[0],
                type: "leaf",
            }
            return leafNode;
        }
    %}

Branch -> Subtree {% id %}
Subtree -> Leaf {% id %}

Internal -> 
    # case 0: internal node label not specified
    "("  _ BranchSet _ ")" 
    {% 
        data => {
            var internalNode;
            if (data[2].at(0)['label'] && data[2].at(1)['label']) {
                // console.log(data[2]);
                const aguid = require('aguid')
                const fakeLabel = "lca__(" + data[2].at(0)['label'] + '_+_' + data[2].at(1)['label'] + ")__lca"
                internalNode = {
                    id: aguid(fakeLabel),
                    label: fakeLabel,
                    type: 'internal'
                }
            } else {
                internalNode = "TODO case 0"
            }

            // Without the parenthesis
            return [data[2], internalNode]

            // // With the parenthesis
            // return [data[0], data[2], data[4], internalNode]
        }
    %}
    # case 1: internal node label not specified but weight specified
    | "("  _ BranchSet _ ")" Distance 
    {%
        data => {
            var internalNode;
            if (data[2].at(0)['label'] && data[2].at(1)['label']) {
                // LR children are leaves
                const aguid = require('aguid')
                const fakeLabel = "lca(" + data[2].at(0)['label'] + '_+_' + data[2].at(1)['label'] + ")"
                internalNode = {
                    id: aguid(fakeLabel),
                    label: fakeLabel,
                    type: 'internal'
                }
            } else {
                // L is internal node, R is leaf
                // console.log("=====")
                // console.log(`L:  ${JSON.stringify(data[2].at(0), null, 2)}`);
                // console.log(`R:  ${JSON.stringify(data[2].at(1), null, 2)}`);
                // console.log("-----")
                internalNode = "TODO case 1"
            }

            // Without the parenthesis
            return [data[2], internalNode]

            // // With the parenthesis
            // return [data[0], data[2], data[4], internalNode]
        }
    %}
    # case 2: internal node specified with label
    | "("  _ BranchSet _ ")" Node 
    {%
        // Convert Node into internalNode
        data => {
            const internalNode = {
                ...data[5],
                type: 'internal'
            }

            // // Without the parenthesis
            return [data[2], internalNode]
            
            // // With the parenthesis
            // return [data[0], data[2], data[4], internalNode]
        }
    %}

BranchSet -> 
    Branch {% data => { return [data[0]] } %}
    | Branch "," BranchSet {% 
            data => {
                return [data[0], ...data[2]]
            }
        %}

Node -> 
    Label:? Distance {%
            data => {
                const aguid = require('aguid');
                var guid  = aguid(data[0]); // if no label, then random guid
                // console.log(guid, data)
                return { 
                    id: guid,
                    label: data[0] ? data[0] : "",
                    metadata: {
                        edgeWeightToParent: data[1][1]
                    }
                }
            }
        %}
    # case 2+: bootstrap values / other weights


# Allowed unquoted labels in Newick.
#   alphanumeric without blanks, parenthese, square brackets, single quotes, colons, semicolons, or commas
# label with those must be single quoted. Double quoting is not correct.
Label -> 
    # null {% () => [] %}
    sqstring 
    | [a-zA-Z0-9\-\_]:+ {% 
            data => data[0].join("")
        %}

Distance -> ":" decimal
Subtree -> Leaf {% id %}
    | Internal {% id %}

Internal -> 
    # case 0: internal node name not specified
    "("  _ BranchSet _ ")" {% 
            data => {
                // console.log("Internal without name");
                // console.log(JSON.stringify(data));
                // console.log("---")
                var nodeName;
                if (data[2].at(0)['label'] && data[2].at(1)['label']) {
                    // console.log(data[2]);
                    const aguid = require('aguid')
                    const fakeLabel = "lca__(" + data[2].at(0)['label'] + '_+_' + data[2].at(1)['label'] + ")__lca"
                    nodeName = {
                        id: aguid(fakeLabel),
                        label: fakeLabel,
                        type: 'internal'
                    }
                } else {
                    nodeName = "TODO"
                }

                // // Without the parenthesis
                return [data[2], nodeName]

                // With the parenthesis
                // return [data[0], data[2], data[4], nodeName]
            }
        %}
    # case 1: internal node specified
    | "("  _ BranchSet _ ")" Node {%
            // Convert Node into internalJSON
            data => {
                // console.log("Internal with name");
                // console.log(data);
                
                var nodeName = {
                    ...data[5],
                    type: 'internal'
                }

                // // Without the parenthesis
                return [data[2], nodeName]
                
                // With the parenthesis
                // return [data[0], data[2], data[4], nodeName]
            }
        %}

BranchSet -> 
    Branch {%
            data => { 
                // console.log("--> branch")
                // console.log(data)
                return [data[0]]
            }
        %}
    | Branch "," BranchSet {% 
            data => {
                // console.log("--> branchSet");
                // console.log(data)
                return [data[0], ...data[2]]
            }
        %}

Branch -> Subtree  {% id %}

Subtree -> 
    Leaf {% id %}

Leaf -> 
    Node {%
        data => {
            // Convert Node into leafJSON

            // console.log("--> leaf")
            // console.log(data)
            return {
                ...data[0],
                type: "leaf",
            };
        }
    %}

Node -> 
    Label {% 
            data => {
                const aguid = require('aguid');
                var guid  = aguid(data[0]);
                return { 
                    id: guid,
                    label: data[0],
                    metadata: {
                        edgeWeightToParent: 1 // default edge weight
                    }
                }
            }
        %}
    | Label:? ":" decimal {%
            data => {
                const aguid = require('aguid');
                var guid  = aguid(data[0]);
                return { 
                    id: guid,
                    label: data[0],
                    metadata: {
                        edgeWeightToParent: data[2]
                    }
                }
            }
        %}

# Allowed unquoted labels in Newick.
#   alphanumeric without blanks, parenthese, square brackets, single quotes, colons, semicolons, or commas
# label with those must be single quoted. Double quoting is not correct.
Label -> 
    sqstring 
    | [a-zA-Z0-9\-\_]:+ {% 
            data => data[0].join("")
        %}
