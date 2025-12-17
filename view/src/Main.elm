{- This Source Code Form is subject to the terms of the Mozilla Public
   License, v. 2.0. If a copy of the MPL was not distributed with this
   file, You can obtain one at https://mozilla.org/MPL/2.0/.
-}


port module Main exposing (Model, Msg(..), init, main, update, view)

{-| Scientific Assistant application.
-}

import Browser
import Extra.Html.Attributes as Attrs
import Html
import Html.Attributes as Attrs
import Html.Events as Events
import UI.Icons as Icons
import UI.Theme as Theme


{-| Application entry point.
-}
main : Program () Model Msg
main =
    Browser.element
        { init = init
        , update = update
        , subscriptions = \_ -> Sub.none
        , view = view
        }



-- MODEL


{-| Application state.
-}
type alias Model =
    { message : String
    , theme : Theme.Theme
    }


{-| Create initial model.
-}
init : () -> ( Model, Cmd Msg )
init _ =
    ( { message = "Научный Ассистент"
      , theme = Theme.Light
      }
    , Cmd.none
    )



-- UPDATE


{-| Messages for updating application state.
-}
type Msg
    = ToggleTheme


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



-- PORTS


port setTheme : String -> Cmd msg



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
                    [ Html.text model.message ]
                , Html.p
                    [ Attrs.class "text-secondary"
                    , Attrs.testId "app-subtitle"
                    ]
                    [ Html.text "Чат-приложение для научной работы с поддержкой формул, графиков и кода" ]
                ]
            , Html.section [ Attrs.class "flex flex-col gap-gutter-sm mt-8" ]
                [ Html.nav
                    [ Attrs.class "flex gap-4 justify-center"
                    , Attrs.attribute "aria-label" "Настройки приложения"
                    ]
                    [ Html.button
                        [ Attrs.class "btn btn-primary flex items-center gap-2"
                        , Events.onClick ToggleTheme
                        , Attrs.testId "theme-toggle-button"
                        , Attrs.attribute "aria-label"
                            (case model.theme of
                                Theme.Light ->
                                    "Переключить на тёмную тему"

                                Theme.Dark ->
                                    "Переключить на светлую тему"
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
                                    "Тёмная тема"

                                Theme.Dark ->
                                    "Светлая тема"
                        ]
                    ]
                , Html.aside
                    [ Attrs.class "flex gap-4 justify-center flex-wrap"
                    , Attrs.attribute "aria-label" "Примеры компонентов"
                    ]
                    [ Html.div
                        [ Attrs.class "card"
                        , Attrs.testId "example-card"
                        , Attrs.attribute "role" "region"
                        , Attrs.attribute "aria-label" "Пример карточки"
                        ]
                        [ Html.p [] [ Html.text "Карточка" ] ]
                    , Html.span
                        [ Attrs.class "badge badge-primary"
                        , Attrs.testId "example-badge"
                        ]
                        [ Html.text "Бейдж" ]
                    ]
                ]
            ]
        ]
