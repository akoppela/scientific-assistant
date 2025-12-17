{- This Source Code Form is subject to the terms of the Mozilla Public
   License, v. 2.0. If a copy of the MPL was not distributed with this
   file, You can obtain one at https://mozilla.org/MPL/2.0/.
-}


module Extra.Html.Attributes exposing (testId)

{-| Extra HTML attribute helpers.

Provides convenience functions for common HTML attributes.

-}

import Html
import Html.Attributes as Attrs


{-| Create a data-testid attribute for testing.
-}
testId : String -> Html.Attribute msg
testId value =
    Attrs.attribute "data-testid" value
