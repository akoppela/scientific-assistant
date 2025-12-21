{- This Source Code Form is subject to the terms of the Mozilla Public
   License, v. 2.0. If a copy of the MPL was not distributed with this
   file, You can obtain one at https://mozilla.org/MPL/2.0/.
-}


module UI.ThemeTest exposing (suite)

{-| Tests for UI.Theme module.

Verifies theme toggling and string conversion functions.

-}

import Expect
import Test
import UI.Theme as Theme


{-| Theme test suite.
-}
suite : Test.Test
suite =
    Test.describe "Theme"
        [ Test.test "toggle switches light to dark" <|
            \_ ->
                Theme.Light
                    |> Theme.toggle
                    |> Expect.equal Theme.Dark
        , Test.test "toggle switches dark to light" <|
            \_ ->
                Theme.Dark
                    |> Theme.toggle
                    |> Expect.equal Theme.Light
        , Test.test "toString returns correct string for light" <|
            \_ ->
                Theme.Light
                    |> Theme.toString
                    |> Expect.equal "light"
        , Test.test "toString returns correct string for dark" <|
            \_ ->
                Theme.Dark
                    |> Theme.toString
                    |> Expect.equal "dark"
        , Test.test "fromString parses light" <|
            \_ ->
                "light"
                    |> Theme.fromString
                    |> Expect.equal (Just Theme.Light)
        , Test.test "fromString parses dark" <|
            \_ ->
                "dark"
                    |> Theme.fromString
                    |> Expect.equal (Just Theme.Dark)
        , Test.test "fromString returns Nothing for invalid" <|
            \_ ->
                "invalid"
                    |> Theme.fromString
                    |> Expect.equal Nothing
        ]
