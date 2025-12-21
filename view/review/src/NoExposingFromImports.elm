{- This Source Code Form is subject to the terms of the Mozilla Public
   License, v. 2.0. If a copy of the MPL was not distributed with this
   file, You can obtain one at https://mozilla.org/MPL/2.0/.
-}


module NoExposingFromImports exposing (rule)

{-| Forbid exposing anything from imports.

All imports must be qualified - no `exposing` allowed.

@docs rule

-}

import Elm.Syntax.Import exposing (Import)
import Elm.Syntax.Node exposing (Node(..))
import Review.Rule as Rule exposing (Error, Rule)


{-| Reports any import with an exposing clause.

Enforces fully qualified imports for maximum clarity.

    config =
        [ NoExposingFromImports.rule
        ]

Examples:

  - ✗ `import Html exposing (Html, div, text)`
  - ✗ `import Foo exposing (Bar)`
  - ✓ `import Html`
  - ✓ `import Html as H`

-}
rule : Rule
rule =
    Rule.newModuleRuleSchema "NoExposingFromImports" ()
        |> Rule.withSimpleImportVisitor importVisitor
        |> Rule.fromModuleRuleSchema


importVisitor : Node Import -> List (Error {})
importVisitor (Node _ { exposingList }) =
    case exposingList of
        Just (Node range _) ->
            [ Rule.error
                { message = "Do not expose anything from imports"
                , details =
                    [ "Use qualified imports for all modules."
                    , "Qualified prefix = external. No prefix = internal to module."
                    , "This makes code origin immediately clear."
                    ]
                }
                range
            ]

        Nothing ->
            []
