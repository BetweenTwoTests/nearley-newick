@builtin "whitespace.ne" # `_` arbitrary amount of whitespace
@builtin "number.ne"     # `int`, `decimal`, and `percentage` number primitives
# @builtin "string.ne"     # `dqstring`, `sqstring`, `btstring`, `dstrchar`, `sstrchar`, `strescape`

# forest = tree+ ; 

# tree = node,";" ; 

# node = children,label?,distance? 
#     | children?,label,distance? ;

# children = "(",node,(",",node),")" ; 

# label = quoted-list 
#     | unquoted-list ; 

# distance = ":",number ; 

# quoted-list = "'",(qchar escaped-quote),"'" ; 

# escaped-quote = "''" ; 

# unquoted-list = uqchar ;

# comment = "[",(cchar comment),"]" ;

forrest -> tree:+

tree => node ";"

node -> children label:? distance:?
    | children:? label distance:?

children -> 
    "(" node 
    ("," node) # {% data => {console.log("==="); console.log(data); console.log("==="); return data; } %}
    ")" 
        {%
            data => {
                console.log("---")
                console.log("L", JSON.stringify(data[1]));
                console.log("R", JSON.stringify(data[2]));
                console.log("---")
                return data;
            }
        %}

# label -> [a-zA-Z0-9\-\_]:+ 
#     {% 
#         data => data[0].join("")
#     %}

# label -> quoted_list
#     | unquoted_list

label -> [a-zA-Z0-9\-\_]:+ {% 
            data => data[0].join("")
        %}

distance -> ":" decimal

# quoted_list -> "'" (qchar escaped_quote) "'"

# escaped_quote -> "''"

# unquoted_list -> [a-zA-Z0-9\-\_]:* {% data => data[0].join("") %}

# qchar -> sqstring 

