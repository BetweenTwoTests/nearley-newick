@builtin "whitespace.ne" # `_` arbitrary amount of whitespace
@builtin "number.ne"     # `int`, `decimal`, and `percentage` number primitives
@builtin "string.ne"     # `dqstring`, `sqstring`, `btstring`, `dstrchar`, `sstrchar`, `strescape`

Tree -> 
    Subtree ";"
  | Branch  ";"

Subtree ->
    Leaf 
    {%
        data => {
            return {
                label: data[0],
                type: "leaf"
            }
        }
    %}
  | Internal 
    {%
        data => {

            return data
        }
    %}

Leaf -> Name {% data => data[0] %}

Internal -> "(" BranchSet ")" Name:? 
    {%
        data => {
            return data
        }
    %}

BranchSet ->
    Branch
    {%
        data => {
            return data
        }
    %}
  | Branch "," BranchSet

Branch -> Subtree Length:? 

Name -> [a-zA-Z0-9\-\_]:+ {% data => data[0].join("") %}

Length -> (":" decimal):+ {% data => data[0][0][1] %}