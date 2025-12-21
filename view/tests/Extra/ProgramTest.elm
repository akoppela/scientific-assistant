{- This Source Code Form is subject to the terms of the Mozilla Public
   License, v. 2.0. If a copy of the MPL was not distributed with this
   file, You can obtain one at https://mozilla.org/MPL/2.0/.
-}


module Extra.ProgramTest exposing (clickByTestId, fillInByTestId)

{-| Extra helpers for ProgramTest.

Provides convenience functions for common testing patterns.

-}

import Extra.Html.Attributes as Attrs
import ProgramTest
import Test.Html.Event
import Test.Html.Query
import Test.Html.Selector as Selector


{-| Click an element by its data-testid attribute.
-}
clickByTestId : String -> ProgramTest.ProgramTest model msg effect -> ProgramTest.ProgramTest model msg effect
clickByTestId testId programTest =
    programTest
        |> ProgramTest.simulateDomEvent
            (Test.Html.Query.find [ Selector.attribute (Attrs.testId testId) ])
            Test.Html.Event.click


{-| Fill in an input/textarea element by its data-testid attribute.
-}
fillInByTestId : String -> String -> ProgramTest.ProgramTest model msg effect -> ProgramTest.ProgramTest model msg effect
fillInByTestId testId value programTest =
    programTest
        |> ProgramTest.simulateDomEvent
            (Test.Html.Query.find [ Selector.attribute (Attrs.testId testId) ])
            (Test.Html.Event.input value)
