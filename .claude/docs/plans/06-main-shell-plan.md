# Main Shell Implementation Plan

**Goal:** Create the main application shell with Header (title, theme toggle, language toggle) and basic chat input area.

**Architecture:** Feature-based Elm modules. `Feature.Header` manages header UI and actions. `Feature.Input` manages text input. Main.elm composes features and handles cross-feature communication.

**Tech Stack:** Elm 0.19.1, Tailwind CSS, elm-json for dependencies

**Reference:** `.claude/docs/plans/2025-12-13-elm-tauri-migration-design.md`

---

## Before Execution

1. **Invoke brainstorming skill** — Review this plan and existing shell implementation
2. **Analyze** — Check `legacy/src/components/Header.tsx` for header structure
3. **Analyze** — Check `legacy/src/components/InputArea.tsx` for input patterns
4. **Confirm** — User confirms plan accuracy before proceeding
5. **Proceed** — Use executing-plans + test-driven-development skills

---

## Prerequisites

- Bootstrap phase complete
- Redesign phase complete
- i18n phase complete

---

## Task 1: Create Header Feature Module

**Files:**
- Create: `src/Feature/Header.elm`
- Create: `tests/Feature/HeaderTest.elm`

**Step 1: Write failing test**

```elm
module Feature.HeaderTest exposing (..)

import Expect
import Feature.Header as Header
import I18n exposing (Language(..))
import Shared.Theme as Theme
import Test exposing (Test, describe, test)


suite : Test
suite =
    describe "Feature.Header"
        [ describe "init"
            [ test "initializes with provided theme and language" <|
                \_ ->
                    let
                        model =
                            Header.init
                                { theme = Theme.Dark
                                , language = Ru
                                }
                    in
                    Expect.all
                        [ .theme >> Expect.equal Theme.Dark
                        , .language >> Expect.equal Ru
                        ]
                        model
            ]
        , describe "update"
            [ test "ToggleTheme toggles theme" <|
                \_ ->
                    let
                        initial =
                            Header.init { theme = Theme.Light, language = En }

                        ( updated, _ ) =
                            Header.update Header.ToggleTheme initial
                    in
                    updated.theme
                        |> Expect.equal Theme.Dark
            , test "ToggleLanguage toggles language" <|
                \_ ->
                    let
                        initial =
                            Header.init { theme = Theme.Light, language = En }

                        ( updated, _ ) =
                            Header.update Header.ToggleLanguage initial
                    in
                    updated.language
                        |> Expect.equal Ru
            ]
        ]
```

**Step 2: Verify test fails**

```bash
elm-test tests/Feature/HeaderTest.elm
```

Expected: FAIL with "I cannot find a `Feature.Header` module".

**Step 3: Implement Header module**

```elm
module Feature.Header exposing
    ( Model
    , Msg(..)
    , init
    , update
    , view
    )

import Html exposing (Html, button, div, h1, header, text)
import Html.Attributes exposing (class, type_)
import Html.Events exposing (onClick)
import I18n exposing (Language)
import Shared.Theme as Theme



-- MODEL


type alias Model =
    { theme : Theme.Theme
    , language : Language
    }


type alias InitConfig =
    { theme : Theme.Theme
    , language : Language
    }


init : InitConfig -> Model
init config =
    { theme = config.theme
    , language = config.language
    }



-- UPDATE


type Msg
    = ToggleTheme
    | ToggleLanguage
    | HelpClicked
    | ClearClicked
    | ExportClicked
    | ImportClicked


update : Msg -> Model -> ( Model, Cmd Msg )
update msg model =
    case msg of
        ToggleTheme ->
            ( { model | theme = Theme.toggle model.theme }
            , Cmd.none
            )

        ToggleLanguage ->
            ( { model | language = I18n.toggle model.language }
            , Cmd.none
            )

        HelpClicked ->
            ( model, Cmd.none )

        ClearClicked ->
            ( model, Cmd.none )

        ExportClicked ->
            ( model, Cmd.none )

        ImportClicked ->
            ( model, Cmd.none )



-- VIEW


view : Model -> Html Msg
view model =
    header [ class "flex items-center justify-between px-4 py-3 border-b border-border bg-background" ]
        [ -- Left: Title
          h1 [ class "text-xl font-semibold text-foreground" ]
            [ text (I18n.appTitle model.language) ]

        -- Right: Actions
        , div [ class "flex items-center gap-2" ]
            [ -- Theme toggle
              button
                [ class "btn-ghost p-2 rounded-md"
                , type_ "button"
                , onClick ToggleTheme
                ]
                [ text
                    (case model.theme of
                        Theme.Light ->
                            "🌙"

                        Theme.Dark ->
                            "☀️"
                    )
                ]

            -- Language toggle
            , button
                [ class "btn-ghost px-3 py-2 rounded-md text-sm"
                , type_ "button"
                , onClick ToggleLanguage
                ]
                [ text
                    (case model.language of
                        I18n.En ->
                            "RU"

                        I18n.Ru ->
                            "EN"
                    )
                ]

            -- Help button
            , button
                [ class "btn-ghost px-3 py-2 rounded-md text-sm"
                , type_ "button"
                , onClick HelpClicked
                ]
                [ text (I18n.helpButton model.language) ]
            ]
        ]
```

**Step 4: Verify test passes**

```bash
elm-test tests/Feature/HeaderTest.elm
```

Expected: All tests pass.

---

## Task 2: Create Input Feature Module

**Files:**
- Create: `src/Feature/Input.elm`
- Create: `tests/Feature/InputTest.elm`

**Step 1: Write failing test**

```elm
module Feature.InputTest exposing (..)

import Expect
import Feature.Input as Input
import I18n exposing (Language(..))
import Test exposing (Test, describe, test)


suite : Test
suite =
    describe "Feature.Input"
        [ describe "init"
            [ test "initializes with empty text" <|
                \_ ->
                    let
                        model =
                            Input.init { language = Ru }
                    in
                    model.text
                        |> Expect.equal ""
            ]
        , describe "update"
            [ test "TextChanged updates text" <|
                \_ ->
                    let
                        initial =
                            Input.init { language = Ru }

                        ( updated, _ ) =
                            Input.update (Input.TextChanged "Hello") initial
                    in
                    updated.text
                        |> Expect.equal "Hello"
            , test "Submitted clears text" <|
                \_ ->
                    let
                        initial =
                            { text = "Hello", language = Ru }

                        ( updated, _ ) =
                            Input.update Input.Submitted initial
                    in
                    updated.text
                        |> Expect.equal ""
            ]
        , describe "canSubmit"
            [ test "returns False for empty text" <|
                \_ ->
                    Input.canSubmit { text = "", language = Ru }
                        |> Expect.equal False
            , test "returns False for whitespace only" <|
                \_ ->
                    Input.canSubmit { text = "   ", language = Ru }
                        |> Expect.equal False
            , test "returns True for non-empty text" <|
                \_ ->
                    Input.canSubmit { text = "Hello", language = Ru }
                        |> Expect.equal True
            ]
        ]
```

**Step 2: Verify test fails**

```bash
elm-test tests/Feature/InputTest.elm
```

Expected: FAIL with "I cannot find a `Feature.Input` module".

**Step 3: Implement Input module**

```elm
module Feature.Input exposing
    ( Model
    , Msg(..)
    , init
    , update
    , view
    , canSubmit
    )

import Html exposing (Html, button, div, textarea, text)
import Html.Attributes exposing (class, disabled, placeholder, rows, type_, value)
import Html.Events exposing (onClick, onInput)
import I18n exposing (Language)



-- MODEL


type alias Model =
    { text : String
    , language : Language
    }


type alias InitConfig =
    { language : Language
    }


init : InitConfig -> Model
init config =
    { text = ""
    , language = config.language
    }



-- UPDATE


type Msg
    = TextChanged String
    | Submitted


update : Msg -> Model -> ( Model, Cmd Msg )
update msg model =
    case msg of
        TextChanged newText ->
            ( { model | text = newText }
            , Cmd.none
            )

        Submitted ->
            ( { model | text = "" }
            , Cmd.none
            )



-- HELPERS


canSubmit : Model -> Bool
canSubmit model =
    String.trim model.text /= ""



-- VIEW


view : Model -> Html Msg
view model =
    div [ class "border-t border-border bg-background p-4" ]
        [ div [ class "flex gap-3 max-w-4xl mx-auto" ]
            [ textarea
                [ class "input flex-1 min-h-[80px] resize-none"
                , placeholder (I18n.chatPlaceholder model.language)
                , value model.text
                , rows 3
                , onInput TextChanged
                ]
                []
            , button
                [ class "btn-primary px-6 py-2 self-end"
                , type_ "button"
                , disabled (not (canSubmit model))
                , onClick Submitted
                ]
                [ text (I18n.actionsSend model.language) ]
            ]
        ]
```

**Step 4: Verify test passes**

```bash
elm-test tests/Feature/InputTest.elm
```

Expected: All tests pass.

---

## Task 3: Refactor Main.elm to Use Features

**Files:**
- Modify: `src/Main.elm`

**Step 1: Update Main.elm**

```elm
port module Main exposing (main)

import Browser
import Feature.Header as Header
import Feature.Input as Input
import Html exposing (Html, div, main_, text)
import Html.Attributes exposing (class)
import I18n exposing (Language(..))
import Shared.Theme as Theme



-- PORTS


port setTheme : String -> Cmd msg


port setLanguage : String -> Cmd msg



-- MAIN


main : Program Flags Model Msg
main =
    Browser.element
        { init = init
        , update = update
        , subscriptions = subscriptions
        , view = view
        }



-- FLAGS


type alias Flags =
    { savedTheme : Maybe String
    , savedLanguage : Maybe String
    }



-- MODEL


type alias Model =
    { header : Header.Model
    , input : Input.Model
    }


init : Flags -> ( Model, Cmd Msg )
init flags =
    let
        theme =
            flags.savedTheme
                |> Maybe.andThen Theme.fromString
                |> Maybe.withDefault Theme.Light

        language =
            flags.savedLanguage
                |> Maybe.andThen I18n.fromString
                |> Maybe.withDefault Ru
    in
    ( { header =
            Header.init
                { theme = theme
                , language = language
                }
      , input =
            Input.init
                { language = language
                }
      }
    , Cmd.none
    )



-- UPDATE


type Msg
    = HeaderMsg Header.Msg
    | InputMsg Input.Msg


update : Msg -> Model -> ( Model, Cmd Msg )
update msg model =
    case msg of
        HeaderMsg subMsg ->
            let
                ( headerModel, headerCmd ) =
                    Header.update subMsg model.header

                -- Sync language to input if changed
                inputModel =
                    if model.header.language /= headerModel.language then
                        { (model.input) | language = headerModel.language }

                    else
                        model.input

                -- Handle side effects
                sideEffects =
                    case subMsg of
                        Header.ToggleTheme ->
                            setTheme (Theme.toString headerModel.theme)

                        Header.ToggleLanguage ->
                            setLanguage (I18n.toString headerModel.language)

                        _ ->
                            Cmd.none
            in
            ( { model
                | header = headerModel
                , input = inputModel
              }
            , Cmd.batch
                [ Cmd.map HeaderMsg headerCmd
                , sideEffects
                ]
            )

        InputMsg subMsg ->
            let
                ( inputModel, inputCmd ) =
                    Input.update subMsg model.input
            in
            ( { model | input = inputModel }
            , Cmd.map InputMsg inputCmd
            )



-- SUBSCRIPTIONS


subscriptions : Model -> Sub Msg
subscriptions _ =
    Sub.none



-- VIEW


view : Model -> Html Msg
view model =
    div [ class "flex flex-col h-screen" ]
        [ -- Header
          Html.map HeaderMsg (Header.view model.header)

        -- Main content area (placeholder for message list)
        , main_ [ class "flex-1 overflow-y-auto p-4" ]
            [ div [ class "max-w-4xl mx-auto text-center text-muted-foreground py-20" ]
                [ text (I18n.chatPlaceholder model.header.language) ]
            ]

        -- Input area
        , Html.map InputMsg (Input.view model.input)
        ]
```

---

## Task 4: Add Keyboard Support for Input

**Files:**
- Modify: `src/Feature/Input.elm`

**Step 1: Add elm/json dependency if not present**

```bash
elm-json install elm/json
```

**Step 2: Update Input.elm with keyboard handling**

Add to imports:

```elm
import Html.Events exposing (onClick, onInput, preventDefaultOn)
import Json.Decode as Decode
```

Update view textarea:

```elm
view : Model -> Html Msg
view model =
    div [ class "border-t border-border bg-background p-4" ]
        [ div [ class "flex gap-3 max-w-4xl mx-auto" ]
            [ textarea
                [ class "input flex-1 min-h-[80px] resize-none"
                , placeholder (I18n.chatPlaceholder model.language)
                , value model.text
                , rows 3
                , onInput TextChanged
                , onEnterSubmit
                ]
                []
            , button
                [ class "btn-primary px-6 py-2 self-end"
                , type_ "button"
                , disabled (not (canSubmit model))
                , onClick Submitted
                ]
                [ text (I18n.actionsSend model.language) ]
            ]
        ]


onEnterSubmit : Html.Attribute Msg
onEnterSubmit =
    preventDefaultOn "keydown"
        (Decode.map2 Tuple.pair
            (Decode.field "key" Decode.string)
            (Decode.field "shiftKey" Decode.bool)
            |> Decode.andThen
                (\( key, shift ) ->
                    if key == "Enter" && not shift then
                        Decode.succeed ( Submitted, True )

                    else
                        Decode.fail "not enter"
                )
        )
```

---

## Task 5: Add Data Test IDs for E2E

**Files:**
- Modify: `src/Feature/Header.elm`
- Modify: `src/Feature/Input.elm`

**Step 1: Add Html.Attributes.Extra or use custom attribute**

Add to Header.elm view:

```elm
import Html.Attributes exposing (attribute, class, type_)

-- Helper
testId : String -> Html.Attribute msg
testId id =
    attribute "data-testid" id
```

Update Header.elm buttons:

```elm
view : Model -> Html Msg
view model =
    header [ class "flex items-center justify-between px-4 py-3 border-b border-border bg-background" ]
        [ h1 [ class "text-xl font-semibold text-foreground", testId "app-title" ]
            [ text (I18n.appTitle model.language) ]
        , div [ class "flex items-center gap-2" ]
            [ button
                [ class "btn-ghost p-2 rounded-md"
                , type_ "button"
                , testId "theme-toggle"
                , onClick ToggleTheme
                ]
                [ text (if model.theme == Theme.Light then "🌙" else "☀️") ]
            , button
                [ class "btn-ghost px-3 py-2 rounded-md text-sm"
                , type_ "button"
                , testId "language-toggle"
                , onClick ToggleLanguage
                ]
                [ text (if model.language == I18n.En then "RU" else "EN") ]
            , button
                [ class "btn-ghost px-3 py-2 rounded-md text-sm"
                , type_ "button"
                , testId "help-button"
                , onClick HelpClicked
                ]
                [ text (I18n.helpButton model.language) ]
            ]
        ]
```

Update Input.elm with testIds:

```elm
testId : String -> Html.Attribute msg
testId id =
    attribute "data-testid" id

view : Model -> Html Msg
view model =
    div [ class "border-t border-border bg-background p-4" ]
        [ div [ class "flex gap-3 max-w-4xl mx-auto" ]
            [ textarea
                [ class "input flex-1 min-h-[80px] resize-none"
                , testId "message-input"
                , placeholder (I18n.chatPlaceholder model.language)
                , value model.text
                , rows 3
                , onInput TextChanged
                , onEnterSubmit
                ]
                []
            , button
                [ class "btn-primary px-6 py-2 self-end"
                , type_ "button"
                , testId "send-button"
                , disabled (not (canSubmit model))
                , onClick Submitted
                ]
                [ text (I18n.actionsSend model.language) ]
            ]
        ]
```

---

## Task 6: Update CLAUDE.md

**Files:**
- Modify: `CLAUDE.md`

**Step 1: Add feature module section**

```markdown
## Feature Modules

Each feature is a self-contained Elm module with complete TEA cycle:

```
src/Feature/
├── Header.elm    # App header, theme/language toggles
├── Input.elm     # Message input area
├── Chat.elm      # Message list (coming)
├── Tutorial.elm  # Tutorial overlay (coming)
└── Session.elm   # Export/import/clear (coming)
```

**Structure:**
```elm
module Feature.Name exposing (Model, Msg, init, update, view)

type alias Model = { ... }
type Msg = ...
init : Config -> Model
update : Msg -> Model -> ( Model, Cmd Msg )
view : Model -> Html Msg
```

**Cross-feature communication:**
Main.elm handles syncing (e.g., language changes propagate to all features).

## Test IDs

Use `data-testid` for E2E testing:
- `app-title` - Header title
- `theme-toggle` - Theme toggle button
- `language-toggle` - Language toggle button
- `help-button` - Help button
- `message-input` - Chat input textarea
- `send-button` - Send message button
```

---

## Task 7: Commit and Mark Complete

**Step 1: Run all tests**

```bash
elm-test
```

Expected: All tests pass.

**Step 2: Commit**

```bash
git add -A
git commit -m "feat: add main shell with Header and Input features

- Create Feature.Header with theme/language toggles
- Create Feature.Input with text area and send button
- Compose features in Main.elm
- Add keyboard support (Enter to send)
- Add data-testid attributes for E2E
- Sync language across features

🤖 Generated with Claude Code"
```

**Step 3: Mark phase complete**

Edit `.claude/docs/plans/2025-12-13-elm-tauri-migration-design.md`:

Change line 18 from:
```
| 6 | Main Shell | [ ] | `06-main-shell-plan.md` |
```
To:
```
| 6 | Main Shell | [x] | `06-main-shell-plan.md` |
```

---

## Verification Checklist

- [ ] `elm-test` passes all tests
- [ ] Header displays title, theme toggle, language toggle
- [ ] Theme toggle switches between light/dark
- [ ] Language toggle switches between EN/RU
- [ ] Input area accepts text
- [ ] Send button is disabled when input empty
- [ ] Enter key submits (Shift+Enter adds newline)
- [ ] All data-testid attributes present
- [ ] Language changes sync across Header and Input
