{- This Source Code Form is subject to the terms of the Mozilla Public
   License, v. 2.0. If a copy of the MPL was not distributed with this
   file, You can obtain one at https://mozilla.org/MPL/2.0/.
-}


port module Main exposing (Flags, Model, Msg(..), init, main, update, view)

{-| Scientific Assistant application.
-}

import Browser
import Extra.Html.Attributes as Attrs
import Html
import Html.Attributes as Attrs
import Html.Events as Events
import I18n
import UI.Icons as Icons
import UI.Theme as Theme


{-| Application entry point.
-}
main : Program Flags Model Msg
main =
    Browser.element
        { init = init
        , update = update
        , subscriptions = \_ -> Sub.none
        , view = view
        }


{-| Flags passed from JavaScript.
-}
type alias Flags =
    { savedTheme : Maybe String
    , savedLanguage : Maybe String
    }



-- MODEL


{-| Application state.
-}
type alias Model =
    { theme : Theme.Theme
    , language : I18n.Language
    }


{-| Create initial model.
-}
init : Flags -> ( Model, Cmd Msg )
init flags =
    let
        theme : Theme.Theme
        theme =
            flags.savedTheme
                |> Maybe.andThen Theme.fromString
                |> Maybe.withDefault Theme.default

        language : I18n.Language
        language =
            flags.savedLanguage
                |> Maybe.andThen I18n.languageFromString
                |> Maybe.withDefault I18n.defaultLanguage
    in
    ( { theme = theme
      , language = language
      }
    , Cmd.none
    )



-- UPDATE


{-| Messages for updating application state.
-}
type Msg
    = ToggleTheme
    | ToggleLanguage


{-| Handle messages and update state.
-}
update : Msg -> Model -> ( Model, Cmd Msg )
update msg model =
    case msg of
        ToggleTheme ->
            let
                newTheme : Theme.Theme
                newTheme =
                    Theme.toggle model.theme
            in
            ( { model | theme = newTheme }
            , setTheme (Theme.toString newTheme)
            )

        ToggleLanguage ->
            let
                newLanguage : I18n.Language
                newLanguage =
                    I18n.toggleLanguage model.language
            in
            ( { model | language = newLanguage }
            , setLanguage (I18n.languageToString newLanguage)
            )



-- PORTS


port setTheme : String -> Cmd msg


port setLanguage : String -> Cmd msg



-- VIEW


{-| Render application view.
-}
view : Model -> Html.Html Msg
view model =
    Html.main_ [ Attrs.class "min-h-screen flex items-center justify-center p-6" ]
        [ Html.article [ Attrs.class "container max-w-2xl" ]
            [ Html.header [ Attrs.class "flex flex-col gap-gutter-sm text-center" ]
                [ Html.h1
                    [ Attrs.class "text-3xl font-semibold"
                    , Attrs.testId "app-title"
                    ]
                    [ Html.text (I18n.scientificAssistant model.language) ]
                , Html.p
                    [ Attrs.class "text-secondary"
                    , Attrs.testId "app-subtitle"
                    ]
                    [ Html.text (I18n.chatAppForScientificWork model.language) ]
                ]
            , Html.section [ Attrs.class "flex flex-col gap-gutter-sm mt-8" ]
                [ Html.nav
                    [ Attrs.class "flex gap-4 justify-center"
                    , Attrs.attribute "aria-label" (I18n.applicationSettings model.language)
                    ]
                    [ Html.button
                        [ Attrs.class "btn btn-primary flex items-center gap-2"
                        , Events.onClick ToggleTheme
                        , Attrs.testId "theme-toggle-button"
                        , Attrs.attribute "aria-label"
                            (case model.theme of
                                Theme.Light ->
                                    I18n.switchToDarkTheme model.language

                                Theme.Dark ->
                                    I18n.switchToLightTheme model.language
                            )
                        ]
                        [ case model.theme of
                            Theme.Light ->
                                Icons.moon Icons.Medium

                            Theme.Dark ->
                                Icons.sun Icons.Medium
                        , Html.text <|
                            case model.theme of
                                Theme.Light ->
                                    I18n.darkTheme model.language

                                Theme.Dark ->
                                    I18n.lightTheme model.language
                        ]
                    , Html.button
                        [ Attrs.class "btn btn-secondary flex items-center gap-2"
                        , Events.onClick ToggleLanguage
                        , Attrs.testId "language-toggle-button"
                        , Attrs.attribute "aria-label"
                            (case model.language of
                                I18n.En ->
                                    I18n.switchToRussian model.language

                                I18n.Ru ->
                                    I18n.switchToEnglish model.language
                            )
                        ]
                        [ Icons.globe Icons.Medium
                        , Html.text <|
                            case model.language of
                                I18n.En ->
                                    I18n.russian model.language

                                I18n.Ru ->
                                    I18n.english model.language
                        ]
                    ]
                , Html.aside
                    [ Attrs.class "flex gap-4 justify-center flex-wrap"
                    , Attrs.attribute "aria-label" (I18n.componentExamples model.language)
                    ]
                    [ Html.div
                        [ Attrs.class "card"
                        , Attrs.testId "example-card"
                        , Attrs.attribute "role" "region"
                        , Attrs.attribute "aria-label" (I18n.cardExample model.language)
                        ]
                        [ Html.p [] [ Html.text (I18n.card model.language) ] ]
                    , Html.span
                        [ Attrs.class "badge badge-primary"
                        , Attrs.testId "example-badge"
                        ]
                        [ Html.text (I18n.badge model.language) ]
                    ]
                ]
            ]
        ]
