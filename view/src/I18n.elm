{- This Source Code Form is subject to the terms of the Mozilla Public
   License, v. 2.0. If a copy of the MPL was not distributed with this
   file, You can obtain one at https://mozilla.org/MPL/2.0/.
-}


module I18n exposing
    ( Language(..)
    , applicationSettings
    , badge
    , card
    , cardExample
    , chatAppForScientificWork
    , componentExamples
    , darkTheme
    , defaultLanguage
    , english
    , languageFromString
    , languageToString
    , lightTheme
    , pluralEn
    , pluralRu
    , russian
    , scientificAssistant
    , switchToDarkTheme
    , switchToEnglish
    , switchToLightTheme
    , switchToRussian
    , toggleLanguage
    )

{-| Internationalization module for English and Russian translations.

All translation functions take Language as first argument to enable runtime switching.

-}


{-| Supported languages.
-}
type Language
    = En
    | Ru


{-| Default language (Russian for this app).
-}
defaultLanguage : Language
defaultLanguage =
    Ru


{-| Convert language to string for storage.
-}
languageToString : Language -> String
languageToString lang =
    case lang of
        En ->
            "en"

        Ru ->
            "ru"


{-| Parse language from string.
-}
languageFromString : String -> Maybe Language
languageFromString str =
    case str of
        "en" ->
            Just En

        "ru" ->
            Just Ru

        _ ->
            Nothing


{-| Toggle between languages.
-}
toggleLanguage : Language -> Language
toggleLanguage lang =
    case lang of
        En ->
            Ru

        Ru ->
            En


{-| English plural helper. English has 2 forms: one (1) and other (0, 2, 3...).
-}
pluralEn : Int -> String -> String -> String
pluralEn count one other =
    if Basics.abs count == 1 then
        String.fromInt count ++ " " ++ one

    else
        String.fromInt count ++ " " ++ other


{-| Russian plural helper. Russian has 3 forms based on last digits.

  - one: 1, 21, 31... (but not 11, 111...)
  - few: 2-4, 22-24... (but not 12-14, 112-114...)
  - many: 0, 5-20, 25-30, 11-14...

-}
pluralRu : Int -> String -> String -> String -> String
pluralRu count one few many =
    let
        absCount : Int
        absCount =
            Basics.abs count

        mod10 : Int
        mod10 =
            Basics.modBy 10 absCount

        mod100 : Int
        mod100 =
            Basics.modBy 100 absCount

        form : String
        form =
            if mod10 == 1 && mod100 /= 11 then
                one

            else if mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20) then
                few

            else
                many
    in
    String.fromInt count ++ " " ++ form


{-| "Scientific Assistant".
-}
scientificAssistant : Language -> String
scientificAssistant lang =
    case lang of
        En ->
            "Scientific Assistant"

        Ru ->
            "Научный Ассистент"


{-| "Chat application for scientific work with formulas, charts and code."
-}
chatAppForScientificWork : Language -> String
chatAppForScientificWork lang =
    case lang of
        En ->
            "Chat application for scientific work with formulas, charts and code."

        Ru ->
            "Чат-приложение для научной работы с поддержкой формул, графиков и кода"


{-| "Light theme".
-}
lightTheme : Language -> String
lightTheme lang =
    case lang of
        En ->
            "Light theme"

        Ru ->
            "Светлая тема"


{-| "Dark theme".
-}
darkTheme : Language -> String
darkTheme lang =
    case lang of
        En ->
            "Dark theme"

        Ru ->
            "Тёмная тема"


{-| "Switch to dark theme".
-}
switchToDarkTheme : Language -> String
switchToDarkTheme lang =
    case lang of
        En ->
            "Switch to dark theme"

        Ru ->
            "Переключить на тёмную тему"


{-| "Switch to light theme".
-}
switchToLightTheme : Language -> String
switchToLightTheme lang =
    case lang of
        En ->
            "Switch to light theme"

        Ru ->
            "Переключить на светлую тему"


{-| "English".
-}
english : Language -> String
english lang =
    case lang of
        En ->
            "English"

        Ru ->
            "Английский"


{-| "Russian".
-}
russian : Language -> String
russian lang =
    case lang of
        En ->
            "Russian"

        Ru ->
            "Русский"


{-| "Switch to English".
-}
switchToEnglish : Language -> String
switchToEnglish lang =
    case lang of
        En ->
            "Switch to English"

        Ru ->
            "Переключить на английский"


{-| "Switch to Russian".
-}
switchToRussian : Language -> String
switchToRussian lang =
    case lang of
        En ->
            "Switch to Russian"

        Ru ->
            "Переключить на русский"


{-| "Application settings".
-}
applicationSettings : Language -> String
applicationSettings lang =
    case lang of
        En ->
            "Application settings"

        Ru ->
            "Настройки приложения"


{-| "Component examples".
-}
componentExamples : Language -> String
componentExamples lang =
    case lang of
        En ->
            "Component examples"

        Ru ->
            "Примеры компонентов"


{-| "Card".
-}
card : Language -> String
card lang =
    case lang of
        En ->
            "Card"

        Ru ->
            "Карточка"


{-| "Card example".
-}
cardExample : Language -> String
cardExample lang =
    case lang of
        En ->
            "Card example"

        Ru ->
            "Пример карточки"


{-| "Badge".
-}
badge : Language -> String
badge lang =
    case lang of
        En ->
            "Badge"

        Ru ->
            "Бейдж"
