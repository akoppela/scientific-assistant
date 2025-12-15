# Tutorial Implementation Plan

**Goal:** Create interactive tutorial that introduces users to the application features with step-by-step guidance and demo messages.

**Architecture:** `Feature.Tutorial` manages tutorial state, steps, and demo content. Overlay renders on top of main UI. Tutorial replaces real chat with demo messages. Steps highlight different features.

**Tech Stack:** Elm 0.19.1, elm-json

**Reference:** `docs/plans/2025-12-13-elm-tauri-migration-design.md`

---

## Before Execution

1. **Invoke brainstorming skill** — Review this plan and existing tutorial implementation
2. **Analyze** — Check `../legacy/src/state/features/tutorial.ts` for tutorial state machine
3. **Analyze** — Check `../legacy/src/components/Tutorial.tsx` for overlay UI
4. **Analyze** — Review demo messages and step content
5. **Confirm** — User confirms plan accuracy and step content
6. **Proceed** — Use executing-plans + test-driven-development skills

---

## Prerequisites

- Session Features phase complete
- All previous phases complete

---

## Task 1: Create Tutorial Feature Module

**Files:**
- Create: `src/Feature/Tutorial.elm`
- Create: `tests/Feature/TutorialTest.elm`

**Step 1: Write failing test**

```elm
module Feature.TutorialTest exposing (..)

import Expect
import Feature.Tutorial as Tutorial exposing (Step(..))
import I18n exposing (Language(..))
import Test exposing (Test, describe, test)


suite : Test
suite =
    describe "Feature.Tutorial"
        [ describe "init"
            [ test "initializes as inactive" <|
                \_ ->
                    let
                        model =
                            Tutorial.init { language = Ru }
                    in
                    Tutorial.isActive model
                        |> Expect.equal False
            ]
        , describe "update"
            [ test "Started activates tutorial at step 1" <|
                \_ ->
                    let
                        initial =
                            Tutorial.init { language = Ru }

                        ( updated, _ ) =
                            Tutorial.update Tutorial.Started initial
                    in
                    Expect.all
                        [ Tutorial.isActive >> Expect.equal True
                        , Tutorial.currentStep >> Expect.equal (Just Welcome)
                        ]
                        updated
            , test "Advanced moves to next step" <|
                \_ ->
                    let
                        initial =
                            Tutorial.init { language = Ru }

                        ( started, _ ) =
                            Tutorial.update Tutorial.Started initial

                        ( advanced, _ ) =
                            Tutorial.update Tutorial.Advanced started
                    in
                    Tutorial.currentStep advanced
                        |> Expect.equal (Just SendMessage)
            , test "Ended deactivates tutorial" <|
                \_ ->
                    let
                        initial =
                            Tutorial.init { language = Ru }

                        ( started, _ ) =
                            Tutorial.update Tutorial.Started initial

                        ( ended, _ ) =
                            Tutorial.update Tutorial.Ended started
                    in
                    Tutorial.isActive ended
                        |> Expect.equal False
            ]
        , describe "totalSteps"
            [ test "returns correct count" <|
                \_ ->
                    Tutorial.totalSteps
                        |> Expect.equal 5
            ]
        ]
```

**Step 2: Implement Tutorial module**

```elm
module Feature.Tutorial exposing
    ( Model
    , Msg(..)
    , Step(..)
    , init
    , update
    , view
    , isActive
    , currentStep
    , totalSteps
    , demoMessages
    , demoInputText
    )

import Html exposing (Html, button, div, h2, p, span, text)
import Html.Attributes exposing (attribute, class, type_)
import Html.Events exposing (onClick)
import I18n exposing (Language)
import Shared.Message as Message exposing (Message)



-- TYPES


type Step
    = Welcome
    | SendMessage
    | ViewResponse
    | ModelSelector
    | Finish


type alias Model =
    { active : Bool
    , step : Step
    , language : Language
    }



-- CONSTANTS


allSteps : List Step
allSteps =
    [ Welcome, SendMessage, ViewResponse, ModelSelector, Finish ]


totalSteps : Int
totalSteps =
    List.length allSteps


stepIndex : Step -> Int
stepIndex step =
    case step of
        Welcome ->
            1

        SendMessage ->
            2

        ViewResponse ->
            3

        ModelSelector ->
            4

        Finish ->
            5



-- INIT


init : { language : Language } -> Model
init config =
    { active = False
    , step = Welcome
    , language = config.language
    }



-- HELPERS


isActive : Model -> Bool
isActive model =
    model.active


currentStep : Model -> Maybe Step
currentStep model =
    if model.active then
        Just model.step

    else
        Nothing



-- DEMO CONTENT


demoMessages : Language -> List Message
demoMessages lang =
    [ { role = Message.User
      , content = [ Message.Text (demoUserMessage lang) ]
      }
    , { role = Message.Assistant
      , content = [ Message.Text (demoAssistantMessage lang) ]
      }
    ]


demoUserMessage : Language -> String
demoUserMessage lang =
    case lang of
        I18n.En ->
            "What is photosynthesis?"

        I18n.Ru ->
            "Что такое фотосинтез?"


demoAssistantMessage : Language -> String
demoAssistantMessage lang =
    case lang of
        I18n.En ->
            "Photosynthesis is the process by which plants convert sunlight into energy..."

        I18n.Ru ->
            "Фотосинтез — это процесс, при котором растения преобразуют солнечный свет в энергию..."


demoInputText : Language -> String
demoInputText lang =
    case lang of
        I18n.En ->
            "Tell me more about chlorophyll"

        I18n.Ru ->
            "Расскажи подробнее о хлорофилле"



-- UPDATE


type Msg
    = Started
    | Advanced
    | Reversed
    | Ended


update : Msg -> Model -> ( Model, Cmd Msg )
update msg model =
    case msg of
        Started ->
            ( { model | active = True, step = Welcome }
            , Cmd.none
            )

        Advanced ->
            ( { model | step = nextStep model.step }
            , Cmd.none
            )

        Reversed ->
            ( { model | step = prevStep model.step }
            , Cmd.none
            )

        Ended ->
            ( { model | active = False, step = Welcome }
            , Cmd.none
            )


nextStep : Step -> Step
nextStep step =
    case step of
        Welcome ->
            SendMessage

        SendMessage ->
            ViewResponse

        ViewResponse ->
            ModelSelector

        ModelSelector ->
            Finish

        Finish ->
            Finish


prevStep : Step -> Step
prevStep step =
    case step of
        Welcome ->
            Welcome

        SendMessage ->
            Welcome

        ViewResponse ->
            SendMessage

        ModelSelector ->
            ViewResponse

        Finish ->
            ModelSelector



-- VIEW


testId : String -> Html.Attribute msg
testId id =
    attribute "data-testid" id


view : Model -> Html Msg
view model =
    if not model.active then
        text ""

    else
        div [ class "fixed inset-0 bg-black/50 flex items-center justify-center z-50" ]
            [ div
                [ class "bg-card rounded-lg p-6 max-w-md mx-4 shadow-lg"
                , testId "tutorial-dialog"
                ]
                [ viewStepContent model
                , viewStepIndicator model
                , viewNavigation model
                ]
            ]


viewStepContent : Model -> Html Msg
viewStepContent model =
    let
        ( title, description ) =
            stepContent model.language model.step
    in
    div [ class "mb-6" ]
        [ h2 [ class "text-xl font-semibold text-foreground mb-2" ] [ text title ]
        , p [ class "text-muted-foreground" ] [ text description ]
        ]


stepContent : Language -> Step -> ( String, String )
stepContent lang step =
    case ( lang, step ) of
        ( I18n.Ru, Welcome ) ->
            ( "Добро пожаловать!"
            , "Это ваш научный помощник. Давайте познакомимся с основными функциями."
            )

        ( I18n.En, Welcome ) ->
            ( "Welcome!"
            , "This is your scientific assistant. Let's explore the main features."
            )

        ( I18n.Ru, SendMessage ) ->
            ( "Отправка сообщений"
            , "Введите вопрос в поле ниже и нажмите кнопку отправки или Enter."
            )

        ( I18n.En, SendMessage ) ->
            ( "Sending Messages"
            , "Type your question in the field below and click send or press Enter."
            )

        ( I18n.Ru, ViewResponse ) ->
            ( "Просмотр ответов"
            , "Ответы появляются в области чата. Вы можете копировать текст."
            )

        ( I18n.En, ViewResponse ) ->
            ( "Viewing Responses"
            , "Responses appear in the chat area. You can copy the text."
            )

        ( I18n.Ru, ModelSelector ) ->
            ( "Выбор модели"
            , "Используйте переключатель для выбора модели: Быстрая, Думающая или Творческая."
            )

        ( I18n.En, ModelSelector ) ->
            ( "Model Selection"
            , "Use the selector to choose a model: Fast, Thinking, or Creative."
            )

        ( I18n.Ru, Finish ) ->
            ( "Готово!"
            , "Теперь вы готовы использовать помощника. Нажмите Завершить, чтобы начать."
            )

        ( I18n.En, Finish ) ->
            ( "All Done!"
            , "You're ready to use the assistant. Click Finish to begin."
            )


viewStepIndicator : Model -> Html Msg
viewStepIndicator model =
    div [ class "flex justify-center gap-1 mb-4" ]
        (List.map
            (\s ->
                span
                    [ class
                        (if s == model.step then
                            "w-2 h-2 rounded-full bg-primary"

                         else
                            "w-2 h-2 rounded-full bg-muted"
                        )
                    ]
                    []
            )
            allSteps
        )


viewNavigation : Model -> Html Msg
viewNavigation model =
    div [ class "flex justify-between items-center" ]
        [ -- Skip button
          button
            [ class "btn-ghost px-3 py-2 text-sm"
            , type_ "button"
            , testId "tutorial-skip"
            , onClick Ended
            ]
            [ text (I18n.tutorialSkip model.language) ]

        -- Step counter
        , span [ class "text-sm text-muted-foreground" ]
            [ text
                (I18n.tutorialStepOf model.language
                    { current = String.fromInt (stepIndex model.step)
                    , total = String.fromInt totalSteps
                    }
                )
            ]

        -- Navigation buttons
        , div [ class "flex gap-2" ]
            [ if model.step /= Welcome then
                button
                    [ class "btn-secondary px-4 py-2"
                    , type_ "button"
                    , testId "tutorial-prev"
                    , onClick Reversed
                    ]
                    [ text (I18n.tutorialPrev model.language) ]

              else
                text ""
            , if model.step == Finish then
                button
                    [ class "btn-primary px-4 py-2"
                    , type_ "button"
                    , testId "tutorial-finish"
                    , onClick Ended
                    ]
                    [ text (I18n.tutorialFinish model.language) ]

              else
                button
                    [ class "btn-primary px-4 py-2"
                    , type_ "button"
                    , testId "tutorial-next"
                    , onClick Advanced
                    ]
                    [ text (I18n.tutorialNext model.language) ]
            ]
        ]
```

---

## Task 2: Integrate Tutorial into Main

**Files:**
- Modify: `src/Main.elm`

**Step 1: Add Tutorial to model**

```elm
type alias Model =
    { header : Header.Model
    , input : Input.Model
    , chat : Chat.Model
    , tutorial : Tutorial.Model
    }
```

**Step 2: Handle Help button triggering tutorial**

```elm
-- In update, handle Header.HelpClicked:
HeaderMsg Header.HelpClicked ->
    let
        ( tutorialModel, tutorialCmd ) =
            Tutorial.update Tutorial.Started model.tutorial
    in
    ( { model | tutorial = tutorialModel }
    , Cmd.map TutorialMsg tutorialCmd
    )
```

**Step 3: Override chat display during tutorial**

```elm
view : Model -> Html Msg
view model =
    let
        visibleHistory =
            if Tutorial.isActive model.tutorial then
                Tutorial.demoMessages model.header.language

            else
                model.chat.history

        visibleInputText =
            if Tutorial.isActive model.tutorial then
                Tutorial.demoInputText model.header.language

            else
                model.input.text
    in
    -- Use visibleHistory and visibleInputText in view
```

---

## Task 3: Commit and Mark Complete

**Step 1: Run all tests**

```bash
elm-test
```

**Step 2: Commit**

```bash
git add -A
git commit -m "feat: add interactive tutorial

- Create Tutorial feature with 5 steps
- Add step navigation (next, prev, skip)
- Show demo messages during tutorial
- Display demo input text
- Add step indicator dots
- Trigger via Help button

🤖 Generated with Claude Code"
```

**Step 3: Mark phase complete**

Edit `docs/plans/2025-12-13-elm-tauri-migration-design.md`:

Change line 22 from:
```
| 10 | Tutorial | [ ] | `10-tutorial-plan.md` |
```
To:
```
| 10 | Tutorial | [x] | `10-tutorial-plan.md` |
```

---

## Verification Checklist

- [ ] `elm-test` passes all tests
- [ ] Help button opens tutorial
- [ ] Welcome step displays correctly
- [ ] Next button advances steps
- [ ] Previous button goes back
- [ ] Skip button closes tutorial
- [ ] Step indicator shows current position
- [ ] Demo messages shown during tutorial
- [ ] Demo input text shown during tutorial
- [ ] Finish button closes tutorial
- [ ] Tutorial content is in Russian and English
