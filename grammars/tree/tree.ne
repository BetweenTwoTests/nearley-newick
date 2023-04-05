@builtin "whitespace.ne" # `_` arbitrary amount of whitespace
@builtin "number.ne"     # `int`, `decimal`, and `percentage` number primitives
@builtin "string.ne"     # `dqstring`, `sqstring`, `btstring`, `dstrchar`, `sstrchar`, `strescape`

Tree -> 
    Subtree ";"
  | Branch ";"

# Tree -> 
#     RootLeaf ";"
#   | RootInternal ";"

# RootLeaf ->
#     Name
#   | "(" Branch ")" Name

# RootInternal ->
#     "(" Branch "," BranchSet ")" Name

# {% 
#     data => {
#         console.log(data)
#         return data;
#     }
# %}

Subtree ->
    Leaf 
  | Internal 

Leaf -> Name 

Internal -> "(" BranchSet ")" Name

BranchSet ->
    Branch 
  | Branch "," BranchSet 

Branch -> Subtree Length

Name -> 
    null
  | sqstring {% data => data[0] %}
  | [a-zA-Z0-9\-\_]:+ {% data => data[0].join("") %}

Length -> 
    null 
  | ":" decimal {% data => data[1] %}