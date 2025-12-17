{- This Source Code Form is subject to the terms of the Mozilla Public
   License, v. 2.0. If a copy of the MPL was not distributed with this
   file, You can obtain one at https://mozilla.org/MPL/2.0/.
-}


module UI.Theme exposing (Theme(..), fromString, toString, toggle)

{-| Theme management for Scientific Assistant.

Provides light and dark theme variants with string serialization.

-}


{-| Available theme variants.
-}
type Theme
    = Light
    | Dark


{-| Switch between themes.
-}
toggle : Theme -> Theme
toggle theme =
    case theme of
        Light ->
            Dark

        Dark ->
            Light


{-| Convert theme to string representation.
-}
toString : Theme -> String
toString theme =
    case theme of
        Light ->
            "light"

        Dark ->
            "dark"


{-| Parse theme from string representation.
-}
fromString : String -> Maybe Theme
fromString str =
    case str of
        "light" ->
            Just Light

        "dark" ->
            Just Dark

        _ ->
            Nothing
