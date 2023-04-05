var GraphNode = function(label, type) {
    this.label = label;
    this.type = type;
    return this;
}

GraphNode.prototype = {
    label: undefined,
    type: undefined
}   


global.GraphNode = GraphNode;