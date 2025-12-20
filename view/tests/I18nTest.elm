module I18nTest exposing (suite)

{-| Tests for I18n pluralization functions.
-}

import Expect
import I18n
import Test


{-| Test suite for I18n module.
-}
suite : Test.Test
suite =
    Test.describe "I18n"
        [ pluralEnTests
        , pluralRuTests
        ]


{-| Tests for English pluralization.
-}
pluralEnTests : Test.Test
pluralEnTests =
    Test.describe "pluralEn"
        [ Test.test "1 is singular" <|
            \_ ->
                I18n.pluralEn 1 "file" "files"
                    |> Expect.equal "1 file"
        , Test.test "0 is plural" <|
            \_ ->
                I18n.pluralEn 0 "file" "files"
                    |> Expect.equal "0 files"
        , Test.test "2 is plural" <|
            \_ ->
                I18n.pluralEn 2 "file" "files"
                    |> Expect.equal "2 files"
        , Test.test "negative 1 is singular" <|
            \_ ->
                I18n.pluralEn -1 "file" "files"
                    |> Expect.equal "-1 file"
        ]


{-| Tests for Russian pluralization.
-}
pluralRuTests : Test.Test
pluralRuTests =
    Test.describe "pluralRu"
        [ Test.test "1 is one form" <|
            \_ ->
                I18n.pluralRu 1 "файл" "файла" "файлов"
                    |> Expect.equal "1 файл"
        , Test.test "2 is few form" <|
            \_ ->
                I18n.pluralRu 2 "файл" "файла" "файлов"
                    |> Expect.equal "2 файла"
        , Test.test "5 is many form" <|
            \_ ->
                I18n.pluralRu 5 "файл" "файла" "файлов"
                    |> Expect.equal "5 файлов"
        , Test.test "11 is many form (exception)" <|
            \_ ->
                I18n.pluralRu 11 "файл" "файла" "файлов"
                    |> Expect.equal "11 файлов"
        , Test.test "21 is one form" <|
            \_ ->
                I18n.pluralRu 21 "файл" "файла" "файлов"
                    |> Expect.equal "21 файл"
        , Test.test "22 is few form" <|
            \_ ->
                I18n.pluralRu 22 "файл" "файла" "файлов"
                    |> Expect.equal "22 файла"
        , Test.test "25 is many form" <|
            \_ ->
                I18n.pluralRu 25 "файл" "файла" "файлов"
                    |> Expect.equal "25 файлов"
        , Test.test "111 is many form (exception)" <|
            \_ ->
                I18n.pluralRu 111 "файл" "файла" "файлов"
                    |> Expect.equal "111 файлов"
        , Test.test "0 is many form" <|
            \_ ->
                I18n.pluralRu 0 "файл" "файла" "файлов"
                    |> Expect.equal "0 файлов"
        ]
