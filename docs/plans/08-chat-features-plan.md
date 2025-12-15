# Chat Features Implementation Plan

**Goal:** Add image attachments, model selector dropdown, and search grounding toggle to the chat input area.

**Architecture:** Extend `Feature.Input` with attachment handling. Create `Feature.ModelSelector` for model dropdown. Add search grounding toggle to Input. File reading via ports to JavaScript FileReader API.

**Tech Stack:** Elm 0.19.1, File API via ports, elm-json

**Reference:** `docs/plans/2025-12-13-elm-tauri-migration-design.md`

---

## Before Execution

1. **Invoke brainstorming skill** — Review this plan and existing chat features
2. **Analyze** — Check `legacy/src/state/features/files.ts` for attachment handling
3. **Analyze** — Check `legacy/src/state/features/gemini.ts` for model types
4. **Analyze** — Check `legacy/src/state/features/searchGrounding.ts` for toggle logic
5. **Analyze** — Check `legacy/src/components/InputArea.tsx` for UI patterns
6. **Confirm** — User confirms plan accuracy before proceeding
7. **Proceed** — Use executing-plans + test-driven-development skills

---

## Prerequisites

- Message List + LLM phase complete
- All previous phases complete

---

## Task 1: Create File Attachment Types

**Files:**
- Create: `src/Shared/Attachment.elm`
- Create: `tests/Shared/AttachmentTest.elm`

**Step 1: Write failing test**

```elm
module Shared.AttachmentTest exposing (..)

import Expect
import Shared.Attachment as Attachment
import Test exposing (Test, describe, test)


suite : Test
suite =
    describe "Shared.Attachment"
        [ describe "create"
            [ test "creates attachment with correct fields" <|
                \_ ->
                    let
                        attachment =
                            Attachment.create
                                { name = "image.png"
                                , mimeType = "image/png"
                                , data = "base64data"
                                }
                    in
                    Expect.all
                        [ .name >> Expect.equal "image.png"
                        , .mimeType >> Expect.equal "image/png"
                        , .data >> Expect.equal "base64data"
                        ]
                        attachment
            ]
        , describe "isImage"
            [ test "returns True for image/png" <|
                \_ ->
                    Attachment.isImage { name = "x", mimeType = "image/png", data = "" }
                        |> Expect.equal True
            , test "returns True for image/jpeg" <|
                \_ ->
                    Attachment.isImage { name = "x", mimeType = "image/jpeg", data = "" }
                        |> Expect.equal True
            , test "returns False for application/pdf" <|
                \_ ->
                    Attachment.isImage { name = "x", mimeType = "application/pdf", data = "" }
                        |> Expect.equal False
            ]
        ]
```

**Step 2: Implement Attachment module**

```elm
module Shared.Attachment exposing
    ( Attachment
    , create
    , isImage
    , toContentPart
    )

import Shared.Message as Message



-- TYPES


type alias Attachment =
    { name : String
    , mimeType : String
    , data : String
    }


type alias CreateConfig =
    { name : String
    , mimeType : String
    , data : String
    }



-- CONSTRUCTORS


create : CreateConfig -> Attachment
create config =
    { name = config.name
    , mimeType = config.mimeType
    , data = config.data
    }



-- HELPERS


isImage : Attachment -> Bool
isImage attachment =
    String.startsWith "image/" attachment.mimeType


toContentPart : Attachment -> Message.ContentPart
toContentPart attachment =
    Message.Image
        { mimeType = attachment.mimeType
        , data = attachment.data
        }
```

**Step 3: Verify test passes**

```bash
elm-test tests/Shared/AttachmentTest.elm
```

---

## Task 2: Add File Ports

**Files:**
- Create: `src/Ports.elm`
- Modify: `ts/main.ts`
- Modify: `ts/ports.ts` (create if not exists)

**Step 1: Create Ports module**

```elm
port module Ports exposing
    ( requestFileRead
    , fileRead
    , FileReadResult
    )

import Json.Decode as Decode exposing (Decoder)
import Json.Encode as Encode



-- OUTGOING


port requestFileRead : () -> Cmd msg



-- INCOMING


type alias FileReadResult =
    { name : String
    , mimeType : String
    , data : String
    }


port fileRead : (Decode.Value -> msg) -> Sub msg


decodeFileReadResult : Decoder FileReadResult
decodeFileReadResult =
    Decode.map3 FileReadResult
        (Decode.field "name" Decode.string)
        (Decode.field "mimeType" Decode.string)
        (Decode.field "data" Decode.string)
```

**Step 2: Create ts/ports.ts**

```typescript
// ts/ports.ts
export interface FileReadResult {
  name: string;
  mimeType: string;
  data: string;
}

export interface ElmPorts {
  setTheme: { subscribe: (callback: (theme: string) => void) => void };
  setLanguage: { subscribe: (callback: (lang: string) => void) => void };
  requestFileRead: { subscribe: (callback: () => void) => void };
  fileRead: { send: (result: FileReadResult) => void };
}

export function setupFilePorts(ports: ElmPorts): void {
  ports.requestFileRead.subscribe(() => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.multiple = true;

    input.onchange = async (): Promise<void> => {
      const files = input.files;
      if (!files) return;

      for (const file of Array.from(files)) {
        const reader = new FileReader();
        reader.onload = (): void => {
          const base64 = (reader.result as string).split(",")[1];
          ports.fileRead.send({
            name: file.name,
            mimeType: file.type,
            data: base64,
          });
        };
        reader.readAsDataURL(file);
      }
    };

    input.click();
  });
}
```

**Step 3: Update ts/main.ts**

```typescript
import { setupFilePorts } from "./ports";

// In initApp, after Elm init:
setupFilePorts(app.ports);
```

---

## Task 3: Add Attachments to Input Feature

**Files:**
- Modify: `src/Feature/Input.elm`
- Modify: `tests/Feature/InputTest.elm`

**Step 1: Update Input model and messages**

```elm
module Feature.Input exposing
    ( Model
    , Msg(..)
    , init
    , update
    , view
    , canSubmit
    , subscriptions
    )

import Html exposing (Html, button, div, img, span, text, textarea)
import Html.Attributes exposing (attribute, class, disabled, placeholder, rows, src, type_, value)
import Html.Events exposing (onClick, onInput, preventDefaultOn)
import I18n exposing (Language)
import Json.Decode as Decode
import Ports
import Shared.Attachment as Attachment exposing (Attachment)



-- MODEL


type alias Model =
    { text : String
    , attachments : List Attachment
    , language : Language
    }


init : { language : Language } -> Model
init config =
    { text = ""
    , attachments = []
    , language = config.language
    }



-- UPDATE


type Msg
    = TextChanged String
    | Submitted
    | RequestAttachment
    | AttachmentAdded Attachment
    | AttachmentRemoved Int


update : Msg -> Model -> ( Model, Cmd Msg )
update msg model =
    case msg of
        TextChanged newText ->
            ( { model | text = newText }, Cmd.none )

        Submitted ->
            ( { model | text = "", attachments = [] }, Cmd.none )

        RequestAttachment ->
            ( model, Ports.requestFileRead () )

        AttachmentAdded attachment ->
            ( { model | attachments = model.attachments ++ [ attachment ] }
            , Cmd.none
            )

        AttachmentRemoved index ->
            ( { model
                | attachments =
                    List.indexedMap Tuple.pair model.attachments
                        |> List.filterMap
                            (\( i, a ) ->
                                if i == index then
                                    Nothing

                                else
                                    Just a
                            )
              }
            , Cmd.none
            )



-- SUBSCRIPTIONS


subscriptions : Model -> Sub Msg
subscriptions _ =
    Ports.fileRead
        (\value ->
            case Decode.decodeValue Ports.decodeFileReadResult value of
                Ok result ->
                    AttachmentAdded (Attachment.create result)

                Err _ ->
                    -- Ignore decode errors
                    TextChanged ""
        )



-- HELPERS


canSubmit : Model -> Bool
canSubmit model =
    String.trim model.text /= "" || not (List.isEmpty model.attachments)



-- VIEW


testId : String -> Html.Attribute msg
testId id =
    attribute "data-testid" id


view : Model -> Html Msg
view model =
    div [ class "border-t border-border bg-background p-4" ]
        [ -- Attachment previews
          if not (List.isEmpty model.attachments) then
            div [ class "flex gap-2 mb-3 max-w-4xl mx-auto" ]
                (List.indexedMap viewAttachmentPreview model.attachments)

          else
            text ""

        -- Input row
        , div [ class "flex gap-3 max-w-4xl mx-auto" ]
            [ -- Attachment button
              button
                [ class "btn-ghost p-2"
                , type_ "button"
                , testId "attach-button"
                , onClick RequestAttachment
                ]
                [ text "📎" ]

            -- Text input
            , textarea
                [ class "input flex-1 min-h-[80px] resize-none"
                , testId "message-input"
                , placeholder (I18n.chatPlaceholder model.language)
                , value model.text
                , rows 3
                , onInput TextChanged
                , onEnterSubmit
                ]
                []

            -- Send button
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


viewAttachmentPreview : Int -> Attachment -> Html Msg
viewAttachmentPreview index attachment =
    div [ class "relative group" ]
        [ if Attachment.isImage attachment then
            img
                [ src ("data:" ++ attachment.mimeType ++ ";base64," ++ attachment.data)
                , class "w-16 h-16 object-cover rounded-md"
                , testId ("attachment-preview-" ++ String.fromInt index)
                ]
                []

          else
            div [ class "w-16 h-16 bg-muted rounded-md flex items-center justify-center" ]
                [ text "📄" ]
        , button
            [ class "absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full w-5 h-5 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
            , type_ "button"
            , onClick (AttachmentRemoved index)
            ]
            [ text "×" ]
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

## Task 4: Create Model Selector Component

**Files:**
- Create: `src/Feature/ModelSelector.elm`
- Create: `tests/Feature/ModelSelectorTest.elm`

**Step 1: Write failing test**

```elm
module Feature.ModelSelectorTest exposing (..)

import Api.Gemini exposing (GeminiModel(..))
import Expect
import Feature.ModelSelector as ModelSelector
import I18n exposing (Language(..))
import Test exposing (Test, describe, test)


suite : Test
suite =
    describe "Feature.ModelSelector"
        [ describe "init"
            [ test "initializes with provided model" <|
                \_ ->
                    let
                        model =
                            ModelSelector.init { model = Thinking, language = Ru }
                    in
                    model.selected
                        |> Expect.equal Thinking
            ]
        , describe "update"
            [ test "Selected updates model" <|
                \_ ->
                    let
                        initial =
                            ModelSelector.init { model = Fast, language = Ru }

                        ( updated, _ ) =
                            ModelSelector.update (ModelSelector.Selected Creative) initial
                    in
                    updated.selected
                        |> Expect.equal Creative
            ]
        ]
```

**Step 2: Implement ModelSelector**

```elm
module Feature.ModelSelector exposing
    ( Model
    , Msg(..)
    , init
    , update
    , view
    )

import Api.Gemini as Gemini exposing (GeminiModel(..))
import Html exposing (Html, button, div, option, select, text)
import Html.Attributes exposing (attribute, class, selected, type_, value)
import Html.Events exposing (onInput)
import I18n exposing (Language)



-- MODEL


type alias Model =
    { selected : GeminiModel
    , language : Language
    , isOpen : Bool
    }


init : { model : GeminiModel, language : Language } -> Model
init config =
    { selected = config.model
    , language = config.language
    , isOpen = False
    }



-- UPDATE


type Msg
    = Selected GeminiModel
    | ToggleOpen


update : Msg -> Model -> ( Model, Cmd Msg )
update msg model =
    case msg of
        Selected newModel ->
            ( { model | selected = newModel, isOpen = False }
            , Cmd.none
            )

        ToggleOpen ->
            ( { model | isOpen = not model.isOpen }
            , Cmd.none
            )



-- VIEW


testId : String -> Html.Attribute msg
testId id =
    attribute "data-testid" id


view : Model -> Html Msg
view model =
    div [ class "relative" ]
        [ select
            [ class "input px-3 py-2 pr-8 appearance-none cursor-pointer"
            , testId "model-selector"
            , onInput (stringToModel >> Selected)
            ]
            (List.map (viewOption model) Gemini.allModels)
        ]


viewOption : Model -> GeminiModel -> Html Msg
viewOption model geminiModel =
    option
        [ value (modelToString geminiModel)
        , selected (model.selected == geminiModel)
        ]
        [ text (modelToLabel model.language geminiModel) ]


modelToString : GeminiModel -> String
modelToString model =
    case model of
        Fast ->
            "fast"

        Thinking ->
            "thinking"

        Creative ->
            "creative"


stringToModel : String -> GeminiModel
stringToModel str =
    case str of
        "thinking" ->
            Thinking

        "creative" ->
            Creative

        _ ->
            Fast


modelToLabel : Language -> GeminiModel -> String
modelToLabel lang model =
    case model of
        Fast ->
            I18n.modelsFast lang

        Thinking ->
            I18n.modelsThinking lang

        Creative ->
            I18n.modelsCreative lang
```

---

## Task 5: Add Search Grounding Toggle

**Files:**
- Modify: `src/Feature/Input.elm`

**Step 1: Add search grounding to Input model**

Add to Model:

```elm
type alias Model =
    { text : String
    , attachments : List Attachment
    , searchGrounding : Bool
    , language : Language
    }
```

Add Msg:

```elm
type Msg
    = ...
    | ToggleSearchGrounding
```

Update init:

```elm
init : { language : Language, searchGrounding : Bool } -> Model
init config =
    { text = ""
    , attachments = []
    , searchGrounding = config.searchGrounding
    , language = config.language
    }
```

Add to update:

```elm
ToggleSearchGrounding ->
    ( { model | searchGrounding = not model.searchGrounding }
    , Cmd.none
    )
```

Add to view (before textarea):

```elm
-- Search grounding toggle
, button
    [ class
        (if model.searchGrounding then
            "btn-primary p-2"

         else
            "btn-ghost p-2"
        )
    , type_ "button"
    , testId "search-toggle"
    , attribute "aria-pressed" (if model.searchGrounding then "true" else "false")
    , onClick ToggleSearchGrounding
    ]
    [ text "🔍" ]
```

---

## Task 6: Integrate Features into Main

**Files:**
- Modify: `src/Main.elm`

**Step 1: Update Main to include ModelSelector and pass attachments**

Add ModelSelector to model, wire up model selection changes to chat config, pass attachments when sending messages. Handle Input.Submitted to extract both text and attachments.

---

## Task 7: Commit and Mark Complete

**Step 1: Run all tests**

```bash
elm-test
```

**Step 2: Commit**

```bash
git add -A
git commit -m "feat: add chat features (attachments, model selector, search grounding)

- Add file attachment via FileReader API ports
- Create ModelSelector dropdown component
- Add search grounding toggle
- Attachment preview with remove button
- Wire attachments into message sending

🤖 Generated with Claude Code"
```

**Step 3: Mark phase complete**

Edit `docs/plans/2025-12-13-elm-tauri-migration-design.md`:

Change line 20 from:
```
| 8 | Chat Features | [ ] | `08-chat-features-plan.md` |
```
To:
```
| 8 | Chat Features | [x] | `08-chat-features-plan.md` |
```

---

## Verification Checklist

- [ ] `elm-test` passes all tests
- [ ] Attachment button opens file picker
- [ ] Selected images show as previews
- [ ] Remove button on hover removes attachment
- [ ] Model selector dropdown works
- [ ] Model selection persists (localStorage)
- [ ] Search grounding toggle works
- [ ] Toggle state reflected in aria-pressed
- [ ] Attachments sent with messages
- [ ] Images display in assistant responses
