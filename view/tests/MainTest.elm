{- This Source Code Form is subject to the terms of the Mozilla Public
   License, v. 2.0. If a copy of the MPL was not distributed with this
   file, You can obtain one at https://mozilla.org/MPL/2.0/.
-}
module MainTest exposing (suite)

{-| Tests for Main module.
-}

import Extra.Html.Attributes as Attrs
import Extra.ProgramTest as ProgramTest
import Main
import ProgramTest
import Test
import Test.Html.Selector as Selector


{-| Default flags for testing.
-}
defaultFlags : Main.Flags
defaultFlags =
    { savedTheme = Nothing
    , savedLanguage = Nothing
    }


{-| Test helper for starting program.
-}
start : ProgramTest.ProgramTest Main.Model Main.Msg (Cmd Main.Msg)
start =
    ProgramTest.createElement
        { init = Main.init
        , update = Main.update
        , view = Main.view
        }
        |> ProgramTest.start defaultFlags


{-| Main test suite.
-}
suite : Test.Test
suite =
    Test.describe "Main"
        [ Test.describe "init"
            [ Test.test "displays app title" <|
                \_ ->
                    start
                        |> ProgramTest.expectViewHas
                            [ Selector.attribute (Attrs.testId "app-title") ]
            , Test.test "displays app subtitle" <|
                \_ ->
                    start
                        |> ProgramTest.expectViewHas
                            [ Selector.attribute (Attrs.testId "app-subtitle") ]
            , Test.test "displays theme toggle button" <|
                \_ ->
                    start
                        |> ProgramTest.expectViewHas
                            [ Selector.attribute (Attrs.testId "theme-toggle-button") ]
            , Test.test "has example card" <|
                \_ ->
                    start
                        |> ProgramTest.expectViewHas
                            [ Selector.attribute (Attrs.testId "example-card") ]
            , Test.test "has example badge" <|
                \_ ->
                    start
                        |> ProgramTest.expectViewHas
                            [ Selector.attribute (Attrs.testId "example-badge") ]
            ]
        , Test.describe "theme toggle"
            [ Test.test "clicking toggle button changes state" <|
                \_ ->
                    start
                        |> ProgramTest.clickByTestId "theme-toggle-button"
                        |> ProgramTest.expectViewHas
                            [ Selector.attribute (Attrs.testId "theme-toggle-button") ]
            , Test.test "clicking toggle twice returns to original state" <|
                \_ ->
                    start
                        |> ProgramTest.clickByTestId "theme-toggle-button"
                        |> ProgramTest.clickByTestId "theme-toggle-button"
                        |> ProgramTest.expectViewHas
                            [ Selector.attribute (Attrs.testId "theme-toggle-button") ]
            ]
        , Test.describe "view structure"
            [ Test.test "theme toggle has primary button class" <|
                \_ ->
                    start
                        |> ProgramTest.ensureViewHas
                            [ Selector.attribute (Attrs.testId "theme-toggle-button")
                            , Selector.tag "button"
                            , Selector.class "btn-primary"
                            ]
                        |> ProgramTest.done
            , Test.test "example card has card class" <|
                \_ ->
                    start
                        |> ProgramTest.ensureViewHas
                            [ Selector.attribute (Attrs.testId "example-card")
                            , Selector.class "card"
                            ]
                        |> ProgramTest.done
            , Test.test "example badge has badge-primary class" <|
                \_ ->
                    start
                        |> ProgramTest.ensureViewHas
                            [ Selector.attribute (Attrs.testId "example-badge")
                            , Selector.class "badge-primary"
                            ]
                        |> ProgramTest.done
            ]
        ]
