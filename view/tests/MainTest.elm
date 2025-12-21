{- This Source Code Form is subject to the terms of the Mozilla Public
   License, v. 2.0. If a copy of the MPL was not distributed with this
   file, You can obtain one at https://mozilla.org/MPL/2.0/.
-}


module MainTest exposing (suite)

{-| Tests for Main module.
-}

import Extra.ProgramTest as ProgramTest
import Extra.Selector as Selector
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
        [ Test.describe "shell layout"
            [ Test.test "displays app title in header" <|
                \_ ->
                    start
                        |> ProgramTest.expectViewHas
                            [ Selector.testId "app-title" ]
            , Test.test "displays settings button" <|
                \_ ->
                    start
                        |> ProgramTest.expectViewHas
                            [ Selector.testId "settings-button" ]
            , Test.test "displays message input" <|
                \_ ->
                    start
                        |> ProgramTest.expectViewHas
                            [ Selector.testId "message-input" ]
            , Test.test "displays send button" <|
                \_ ->
                    start
                        |> ProgramTest.expectViewHas
                            [ Selector.testId "send-button" ]
            , Test.test "send button is disabled when input is empty" <|
                \_ ->
                    start
                        |> ProgramTest.ensureViewHas
                            [ Selector.testId "send-button"
                            , Selector.disabled True
                            ]
                        |> ProgramTest.done
            ]
        , Test.describe "input functionality"
            [ Test.test "typing in input enables send button" <|
                \_ ->
                    start
                        |> ProgramTest.fillInByTestId "message-input" "Hello"
                        |> ProgramTest.ensureViewHas
                            [ Selector.testId "send-button"
                            , Selector.disabled False
                            ]
                        |> ProgramTest.done
            , Test.test "clicking send clears input" <|
                \_ ->
                    start
                        |> ProgramTest.fillInByTestId "message-input" "Hello"
                        |> ProgramTest.clickByTestId "send-button"
                        |> ProgramTest.ensureViewHas
                            [ Selector.testId "message-input" ]
                        |> ProgramTest.done
            ]
        ]
