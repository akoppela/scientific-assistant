module MainTest exposing (..)

import Expect
import Main
import Test exposing (Test, describe, test)


suite : Test
suite =
    describe "Main"
        [ test "init creates model with correct message" <|
            \_ ->
                let
                    ( model, _ ) =
                        Main.init ()
                in
                Expect.equal model.message "Scientific Assistant"
        ]
