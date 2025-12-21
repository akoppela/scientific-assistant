{- This Source Code Form is subject to the terms of the Mozilla Public
   License, v. 2.0. If a copy of the MPL was not distributed with this
   file, You can obtain one at https://mozilla.org/MPL/2.0/.
-}


port module Main exposing (Flags, Model, Msg, init, main, update, view)

{-| Scientific Assistant application.
-}

import Browser
import Extra.Html.Attributes as Attrs
import Html
import Html.Attributes as Attrs
import Html.Events as Events
import I18n
import Json.Decode as Decode
import UI.Icons as Icons
import UI.Menu as Menu
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
    , inputText : String
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
      , inputText = ""
      }
    , Cmd.none
    )



-- UPDATE


{-| Messages for updating application state.
-}
type Msg
    = ThemeToggled
    | LanguageToggled
    | HelpRequested
    | InputChanged String
    | SubmitRequested


{-| Handle messages and update state.
-}
update : Msg -> Model -> ( Model, Cmd Msg )
update msg model =
    case msg of
        ThemeToggled ->
            let
                newTheme : Theme.Theme
                newTheme =
                    Theme.toggle model.theme
            in
            ( { model | theme = newTheme }
            , setTheme (Theme.toString newTheme)
            )

        LanguageToggled ->
            let
                newLanguage : I18n.Language
                newLanguage =
                    I18n.toggleLanguage model.language
            in
            ( { model | language = newLanguage }
            , setLanguage (I18n.languageToString newLanguage)
            )

        HelpRequested ->
            -- TODO: Show help overlay in future phase
            ( model, Cmd.none )

        InputChanged text ->
            ( { model | inputText = text }, Cmd.none )

        SubmitRequested ->
            if canSend model then
                -- TODO: Send message to API in future phase
                ( { model | inputText = "" }, Cmd.none )

            else
                ( model, Cmd.none )


{-| Check if send button should be enabled.
-}
canSend : Model -> Bool
canSend model =
    String.trim model.inputText /= ""


{-| Calculate textarea rows based on content.
Minimum 1 row, maximum 9 rows.
-}
textareaRows : String -> Int
textareaRows text =
    let
        lineCount : Int
        lineCount =
            text
                |> String.lines
                |> List.length
    in
    Basics.clamp 1 9 lineCount



-- PORTS


port setTheme : String -> Cmd msg


port setLanguage : String -> Cmd msg



-- VIEW


{-| Render application view.
-}
view : Model -> Html.Html Msg
view model =
    Html.div [ Attrs.class "flex flex-col h-screen bg-background" ]
        [ viewHeader model
        , viewMain model
        , viewInput model
        ]


{-| Render header with title and settings menu.
-}
viewHeader : Model -> Html.Html Msg
viewHeader model =
    Html.header [ Attrs.class "app-header" ]
        [ -- Left: Title
          Html.h1
            [ Attrs.class "app-header-title"
            , Attrs.testId "app-title"
            ]
            [ Html.text (I18n.scientificAssistant model.language) ]

        -- Right: Settings menu
        , Html.div [ Attrs.class "app-header-actions" ]
            [ Html.button
                [ Attrs.id "settings-trigger"
                , Attrs.attribute "popovertarget" "settings-menu"
                , Attrs.class "btn btn-ghost btn-icon"
                , Attrs.attribute "aria-label" (I18n.settings model.language)
                , Attrs.testId "settings-button"
                ]
                [ Icons.toHtml Icons.Medium Icons.settings ]
            , Menu.view
                { id = "settings-menu"
                , items = settingsMenuItems model
                , gap = Just 6
                , onItemClick =
                    [ ( menuItemToggleTheme, ThemeToggled )
                    , ( menuItemToggleLanguage, LanguageToggled )
                    , ( menuItemHelp, HelpRequested )
                    ]
                }
            ]
        ]


{-| Menu item ID: toggle theme action.
-}
menuItemToggleTheme : String
menuItemToggleTheme =
    "toggle-theme"


{-| Menu item ID: toggle language action.
-}
menuItemToggleLanguage : String
menuItemToggleLanguage =
    "toggle-language"


{-| Menu item ID: help action.
-}
menuItemHelp : String
menuItemHelp =
    "help"


{-| Build settings menu items based on current state.
-}
settingsMenuItems : Model -> List Menu.Item
settingsMenuItems model =
    [ Menu.Action
        { id = menuItemToggleTheme
        , icon =
            case model.theme of
                Theme.Light ->
                    Icons.moon

                Theme.Dark ->
                    Icons.sun
        , label =
            case model.theme of
                Theme.Light ->
                    I18n.switchToDarkTheme model.language

                Theme.Dark ->
                    I18n.switchToLightTheme model.language
        , suffix = Nothing
        }
    , Menu.Action
        { id = menuItemToggleLanguage
        , icon = Icons.globe
        , label =
            case model.language of
                I18n.En ->
                    I18n.switchToRussian model.language

                I18n.Ru ->
                    I18n.switchToEnglish model.language
        , suffix =
            Just <|
                case model.language of
                    I18n.En ->
                        "RU"

                    I18n.Ru ->
                        "EN"
        }
    , Menu.Divider
    , Menu.Action
        { id = menuItemHelp
        , icon = Icons.help
        , label = I18n.help model.language
        , suffix = Nothing
        }
    ]


{-| Render main content area.
-}
viewMain : Model -> Html.Html Msg
viewMain model =
    Html.main_ [ Attrs.class "flex-1 overflow-y-auto p-6" ]
        [ Html.div [ Attrs.class "max-w-md mx-auto text-center py-20" ]
            [ Html.p [ Attrs.class "text-secondary mb-2" ]
                [ Html.text (I18n.appDescription model.language) ]
            , Html.p [ Attrs.class "text-sm text-tertiary mt-4 whitespace-pre-line" ]
                [ Html.text (I18n.inputHint model.language) ]
            ]
        ]


{-| Render input area with footer styling.
-}
viewInput : Model -> Html.Html Msg
viewInput model =
    Html.footer [ Attrs.class "app-footer flex items-end gap-3" ]
        [ -- Left: attach button
          Html.button
            [ Attrs.class "btn btn-ghost btn-icon"
            , Attrs.attribute "aria-label" (I18n.attachFile model.language)
            , Attrs.title (I18n.attachFile model.language)
            , Attrs.testId "attach-button"
            ]
            [ Icons.toHtml Icons.Medium Icons.plus ]

        -- Center: textarea
        , Html.textarea
            [ Attrs.class "input textarea flex-1"
            , Attrs.placeholder (I18n.messagePlaceholder model.language)
            , Attrs.value model.inputText
            , Attrs.rows (textareaRows model.inputText)
            , Attrs.testId "message-input"
            , Events.onInput InputChanged
            , onCtrlEnter SubmitRequested
            ]
            []

        -- Right: send button
        , Html.button
            [ Attrs.class "btn btn-primary btn-icon"
            , Attrs.attribute "aria-label" (I18n.send model.language)
            , Attrs.title (I18n.send model.language)
            , Attrs.testId "send-button"
            , Attrs.disabled (not (canSend model))
            , Events.onClick SubmitRequested
            ]
            [ Icons.toHtml Icons.Medium Icons.send ]
        ]


{-| Handle Ctrl+Enter keyboard shortcut.
-}
onCtrlEnter : Msg -> Html.Attribute Msg
onCtrlEnter msg =
    Events.preventDefaultOn "keydown"
        (Decode.map2 Tuple.pair
            (Decode.field "key" Decode.string)
            (Decode.field "ctrlKey" Decode.bool)
            |> Decode.andThen
                (\( key, ctrl ) ->
                    if key == "Enter" && ctrl then
                        Decode.succeed ( msg, True )

                    else
                        Decode.fail "not ctrl+enter"
                )
        )
