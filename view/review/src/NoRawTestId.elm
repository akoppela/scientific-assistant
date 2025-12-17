{- This Source Code Form is subject to the terms of the Mozilla Public
   License, v. 2.0. If a copy of the MPL was not distributed with this
   file, You can obtain one at https://mozilla.org/MPL/2.0/.
-}
module NoRawTestId exposing (rule)

{-| Forbid raw data-testid attributes.

Enforce using `Extra.Html.Attributes.testId` instead of `Html.Attributes.attribute "data-testid"`.

@docs rule

-}

import Elm.Syntax.Expression as Expression exposing (Expression)
import Elm.Syntax.Node as Node exposing (Node)
import Review.Rule as Rule exposing (Error, Rule)


{-| Reports raw `attribute "data-testid" value` usage.

Encourages using the `testId` helper from `Extra.Html.Attributes` for consistency.

    config =
        [ NoRawTestId.rule
        ]

-}
rule : Rule
rule =
    Rule.newModuleRuleSchema "NoRawTestId" ()
        |> Rule.withSimpleExpressionVisitor expressionVisitor
        |> Rule.fromModuleRuleSchema


expressionVisitor : Node Expression -> List (Error {})
expressionVisitor node =
    case Node.value node of
        Expression.Application [ functionNode, arg1Node, arg2Node ] ->
            case ( Node.value functionNode, Node.value arg1Node, Node.value arg2Node ) of
                ( Expression.FunctionOrValue _ "attribute", Expression.Literal "data-testid", Expression.Literal _ ) ->
                    [ Rule.error
                        { message = "Use `testId` helper instead of raw `attribute \"data-testid\"`"
                        , details =
                            [ "Import `Extra.Html.Attributes exposing (testId)` and use `testId \"value\"` instead."
                            , "This provides better consistency and makes test IDs easier to refactor."
                            ]
                        }
                        (Node.range node)
                    ]

                _ ->
                    []

        _ ->
            []
