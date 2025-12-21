{- This Source Code Form is subject to the terms of the Mozilla Public
   License, v. 2.0. If a copy of the MPL was not distributed with this
   file, You can obtain one at https://mozilla.org/MPL/2.0/.
-}


module Extra.Selector exposing (testId)

{-| Extra helpers for Test.Html.Selector.

Provides convenience functions for common testing patterns.

-}

import Extra.Html.Attributes as Attrs
import Test.Html.Selector as Selector


{-| Select an element by its data-testid attribute.
-}
testId : String -> Selector.Selector
testId value =
    Selector.attribute (Attrs.testId value)
