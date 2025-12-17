{- This Source Code Form is subject to the terms of the Mozilla Public
   License, v. 2.0. If a copy of the MPL was not distributed with this
   file, You can obtain one at https://mozilla.org/MPL/2.0/.
-}
module ReviewConfig exposing (config)

{-| Do not rename the ReviewConfig module or the config function, because
`elm-review` will look for these.

To add packages that contain rules, add them to this review project using

    `elm install author/packagename`

when inside the directory containing this file.

-}

import CognitiveComplexity
import Docs.NoMissing
import Docs.ReviewAtDocs
import Docs.ReviewLinksAndSections
import NoConfusingPrefixOperator
import NoDebug.Log
import NoDebug.TodoOrToString
import NoDeprecated
import NoExposingEverything
import NoExposingFromImports
import NoImportingEverything
import NoMissingSubscriptionsCall
import NoMissingTypeAnnotation
import NoMissingTypeAnnotationInLetIn
import NoMissingTypeConstructor
import NoMissingTypeExpose
import NoPrematureLetComputation
import NoRawTestId
import NoRecursiveUpdate
import NoSimpleLetBody
import NoUnnecessaryTrailingUnderscore
import NoUnoptimizedRecursion
import NoUselessSubscriptions
import NoUnused.CustomTypeConstructorArgs
import NoUnused.CustomTypeConstructors
import NoUnused.Dependencies
import NoUnused.Exports
import NoUnused.Modules
import NoUnused.Parameters
import NoUnused.Patterns
import NoUnused.Variables
import Review.Rule exposing (Rule)
import Simplify


config : List Rule
config =
    [ CognitiveComplexity.rule 25
    , Docs.NoMissing.rule
        { document = Docs.NoMissing.everything
        , from = Docs.NoMissing.allModules
        }
    , Docs.ReviewAtDocs.rule
    , Docs.ReviewLinksAndSections.rule
    , NoConfusingPrefixOperator.rule
    , NoDeprecated.rule NoDeprecated.defaults
    , NoExposingEverything.rule
    , NoExposingFromImports.rule
    , NoImportingEverything.rule []
    , NoMissingTypeAnnotation.rule
    , NoMissingTypeAnnotationInLetIn.rule
    , NoMissingTypeConstructor.rule
    , NoMissingTypeExpose.rule
    , NoMissingSubscriptionsCall.rule
    , NoPrematureLetComputation.rule
    , NoRawTestId.rule
    , NoRecursiveUpdate.rule
    , NoUselessSubscriptions.rule
    , NoSimpleLetBody.rule
    , NoUnnecessaryTrailingUnderscore.rule
    , NoUnoptimizedRecursion.rule (NoUnoptimizedRecursion.optOutWithComment "IGNORE TCO")
    , NoDebug.Log.rule
    , NoDebug.TodoOrToString.rule
    , NoUnused.Dependencies.rule
    , NoUnused.Modules.rule
    , NoUnused.Parameters.rule
    , NoUnused.Patterns.rule
    , NoUnused.Variables.rule
        |> Review.Rule.ignoreErrorsForFiles [ "src/UI/Icons.elm" ]
    , NoUnused.CustomTypeConstructors.rule []
        |> Review.Rule.ignoreErrorsForFiles [ "src/UI/Icons.elm" ]
    , NoUnused.CustomTypeConstructorArgs.rule
    , NoUnused.Exports.rule
        |> Review.Rule.ignoreErrorsForFiles [ "src/UI/Icons.elm" ]
    , Simplify.rule Simplify.defaults
    ]
