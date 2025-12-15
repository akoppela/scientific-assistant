# Session Features Implementation Plan

**Goal:** Add session management features: export chat history to JSON, import saved sessions, and clear current session.

**Architecture:** `Feature.Session` handles export/import/clear actions. Export uses Tauri file dialog + fs.write. Import uses file dialog + fs.read. Data serialized as JSON with version for forward compatibility.

**Tech Stack:** Elm 0.19.1, Tauri file dialogs, elm/json, elm-json

**Reference:** `docs/plans/2025-12-13-elm-tauri-migration-design.md`

---

## Before Execution

1. **Invoke brainstorming skill** — Review this plan and existing session implementation
2. **Analyze** — Check `../legacy/src/state/features/session.ts` for export/import logic
3. **Analyze** — Check `../legacy/src/components/Header.tsx` for session action buttons
4. **Analyze** — Review JSON structure for session data
5. **Confirm** — User confirms plan accuracy before proceeding
6. **Proceed** — Use executing-plans + test-driven-development skills

---

## Prerequisites

- Message List + LLM phase complete
- Chat Features phase complete

---

## Task 1: Create Session Types

**Files:**
- Create: `src/Shared/Session.elm`
- Create: `tests/Shared/SessionTest.elm`

**Step 1: Write failing test**

```elm
module Shared.SessionTest exposing (..)

import Api.Gemini exposing (GeminiModel(..))
import Expect
import Json.Decode as Decode
import Json.Encode as Encode
import Shared.Message as Message
import Shared.Session as Session
import Test exposing (Test, describe, test)


suite : Test
suite =
    describe "Shared.Session"
        [ describe "encoding"
            [ test "encodes session with version" <|
                \_ ->
                    let
                        session =
                            { history = [ Message.createUser "Hello" ]
                            , model = Fast
                            , searchGrounding = True
                            }

                        encoded =
                            Session.encode session
                    in
                    Decode.decodeValue (Decode.field "version" Decode.int) encoded
                        |> Expect.equal (Ok 1)
            ]
        , describe "decoding"
            [ test "decodes valid session" <|
                \_ ->
                    let
                        json =
                            """
                            {
                              "version": 1,
                              "history": [],
                              "model": "fast",
                              "searchGrounding": false
                            }
                            """
                    in
                    Decode.decodeString Session.decoder json
                        |> Result.map .searchGrounding
                        |> Expect.equal (Ok False)
            ]
        ]
```

**Step 2: Implement Session module**

```elm
module Shared.Session exposing
    ( Session
    , encode
    , decoder
    )

import Api.Gemini as Gemini exposing (GeminiModel(..))
import Json.Decode as Decode exposing (Decoder)
import Json.Encode as Encode
import Shared.Message as Message exposing (Message)



-- TYPES


type alias Session =
    { history : List Message
    , model : GeminiModel
    , searchGrounding : Bool
    }



-- ENCODING


encode : Session -> Encode.Value
encode session =
    Encode.object
        [ ( "version", Encode.int 1 )
        , ( "history", Encode.list Message.encodeMessage session.history )
        , ( "model", Encode.string (modelToString session.model) )
        , ( "searchGrounding", Encode.bool session.searchGrounding )
        ]


modelToString : GeminiModel -> String
modelToString model =
    case model of
        Fast ->
            "fast"

        Thinking ->
            "thinking"

        Creative ->
            "creative"



-- DECODING


decoder : Decoder Session
decoder =
    Decode.map3 Session
        (Decode.field "history" (Decode.list Message.decodeMessage))
        (Decode.field "model" modelDecoder)
        (Decode.field "searchGrounding" Decode.bool)


modelDecoder : Decoder GeminiModel
modelDecoder =
    Decode.string
        |> Decode.andThen
            (\str ->
                case str of
                    "thinking" ->
                        Decode.succeed Thinking

                    "creative" ->
                        Decode.succeed Creative

                    _ ->
                        Decode.succeed Fast
            )
```

---

## Task 2: Add Tauri File Dialog Ports

**Files:**
- Modify: `src/Ports.elm`
- Modify: `ts/ports.ts`
- Modify: `src-tauri/src/lib.rs`

**Step 1: Add Tauri commands**

```rust
// src-tauri/src/lib.rs
use tauri::Manager;

#[tauri::command]
async fn save_session(app: tauri::AppHandle, content: String) -> Result<(), String> {
    use tauri_plugin_dialog::DialogExt;

    let file_path = app
        .dialog()
        .file()
        .add_filter("JSON", &["json"])
        .set_file_name("session.json")
        .blocking_save_file();

    if let Some(path) = file_path {
        std::fs::write(path.path(), content).map_err(|e| e.to_string())?;
    }

    Ok(())
}

#[tauri::command]
async fn load_session(app: tauri::AppHandle) -> Result<Option<String>, String> {
    use tauri_plugin_dialog::DialogExt;

    let file_path = app
        .dialog()
        .file()
        .add_filter("JSON", &["json"])
        .blocking_pick_file();

    if let Some(path) = file_path {
        let content = std::fs::read_to_string(path.path()).map_err(|e| e.to_string())?;
        Ok(Some(content))
    } else {
        Ok(None)
    }
}
```

**Step 2: Add to Elm ports**

```elm
-- In Ports.elm
port saveSession : String -> Cmd msg
port loadSession : () -> Cmd msg
port sessionLoaded : (Maybe String -> msg) -> Sub msg
port sessionSaved : (() -> msg) -> Sub msg
```

**Step 3: Wire up in TypeScript**

```typescript
// In ts/ports.ts
export function setupSessionPorts(ports: ElmPorts): void {
  ports.saveSession.subscribe(async (content: string) => {
    try {
      await invoke("save_session", { content });
      ports.sessionSaved.send(null);
    } catch (error) {
      console.error("Save failed:", error);
    }
  });

  ports.loadSession.subscribe(async () => {
    try {
      const content = await invoke<string | null>("load_session");
      ports.sessionLoaded.send(content);
    } catch (error) {
      console.error("Load failed:", error);
      ports.sessionLoaded.send(null);
    }
  });
}
```

---

## Task 3: Add Session Actions to Header

**Files:**
- Modify: `src/Feature/Header.elm`

**Step 1: Update Header view with session buttons**

Add export, import, clear buttons to header actions:

```elm
-- In Header.view, add to actions div:
, button
    [ class "btn-ghost px-3 py-2 rounded-md text-sm"
    , type_ "button"
    , testId "export-button"
    , disabled (not canExport)
    , onClick ExportClicked
    ]
    [ text (I18n.actionsExport model.language) ]
, button
    [ class "btn-ghost px-3 py-2 rounded-md text-sm"
    , type_ "button"
    , testId "import-button"
    , onClick ImportClicked
    ]
    [ text (I18n.actionsImport model.language) ]
, button
    [ class "btn-ghost px-3 py-2 rounded-md text-sm text-destructive"
    , type_ "button"
    , testId "clear-button"
    , disabled (not canClear)
    , onClick ClearClicked
    ]
    [ text (I18n.actionsClear model.language) ]
```

---

## Task 4: Handle Session Actions in Main

**Files:**
- Modify: `src/Main.elm`

**Step 1: Wire Header actions to session operations**

```elm
-- In Main.update, handle Header messages:
HeaderMsg Header.ExportClicked ->
    let
        session =
            { history = model.chat.history
            , model = model.chat.geminiConfig.model
            , searchGrounding = model.chat.geminiConfig.searchGrounding
            }

        json =
            Session.encode session |> Encode.encode 2
    in
    ( model, Ports.saveSession json )

HeaderMsg Header.ImportClicked ->
    ( model, Ports.loadSession () )

HeaderMsg Header.ClearClicked ->
    let
        ( chatModel, _ ) =
            Chat.update Chat.ClearHistory model.chat
    in
    ( { model | chat = chatModel }, Cmd.none )
```

**Step 2: Add subscription for session loaded**

```elm
subscriptions : Model -> Sub Msg
subscriptions model =
    Sub.batch
        [ Sub.map InputMsg (Input.subscriptions model.input)
        , Ports.sessionLoaded SessionLoaded
        ]

-- Add to Msg type:
type Msg
    = ...
    | SessionLoaded (Maybe String)

-- Handle in update:
SessionLoaded maybeJson ->
    case maybeJson of
        Just json ->
            case Decode.decodeString Session.decoder json of
                Ok session ->
                    -- Update chat with imported session
                    ...

                Err _ ->
                    -- Show error alert
                    ...

        Nothing ->
            ( model, Cmd.none )
```

---

## Task 5: Add Clear Confirmation

**Files:**
- Create: `src/Feature/ConfirmDialog.elm`

**Step 1: Create simple confirm dialog**

```elm
module Feature.ConfirmDialog exposing
    ( Model
    , Msg(..)
    , init
    , update
    , view
    , isOpen
    )

import Html exposing (Html, button, div, p, text)
import Html.Attributes exposing (attribute, class, type_)
import Html.Events exposing (onClick)
import I18n exposing (Language)



-- MODEL


type Model
    = Closed
    | Open { message : String, onConfirm : Msg }


init : Model
init =
    Closed


isOpen : Model -> Bool
isOpen model =
    case model of
        Open _ ->
            True

        Closed ->
            False



-- UPDATE


type Msg
    = Show String Msg
    | Confirmed
    | Cancelled


update : Msg -> Model -> ( Model, Maybe Msg )
update msg model =
    case msg of
        Show message onConfirm ->
            ( Open { message = message, onConfirm = onConfirm }
            , Nothing
            )

        Confirmed ->
            case model of
                Open { onConfirm } ->
                    ( Closed, Just onConfirm )

                Closed ->
                    ( Closed, Nothing )

        Cancelled ->
            ( Closed, Nothing )



-- VIEW


testId : String -> Html.Attribute msg
testId id =
    attribute "data-testid" id


view : Language -> Model -> Html Msg
view lang model =
    case model of
        Closed ->
            text ""

        Open { message } ->
            div [ class "fixed inset-0 bg-black/50 flex items-center justify-center z-50" ]
                [ div [ class "bg-card rounded-lg p-6 max-w-sm mx-4 shadow-lg", testId "confirm-dialog" ]
                    [ p [ class "text-foreground mb-4" ] [ text message ]
                    , div [ class "flex gap-3 justify-end" ]
                        [ button
                            [ class "btn-secondary px-4 py-2"
                            , type_ "button"
                            , testId "confirm-cancel"
                            , onClick Cancelled
                            ]
                            [ text (I18n.actionsCancel lang) ]
                        , button
                            [ class "btn-destructive px-4 py-2"
                            , type_ "button"
                            , testId "confirm-ok"
                            , onClick Confirmed
                            ]
                            [ text (I18n.actionsClear lang) ]
                        ]
                    ]
                ]
```

---

## Task 6: Commit and Mark Complete

**Step 1: Run all tests**

```bash
elm-test
```

**Step 2: Commit**

```bash
git add -A
git commit -m "feat: add session features (export, import, clear)

- Create Session types with JSON encoding/decoding
- Add Tauri commands for file dialogs
- Wire export/import/clear to Header actions
- Add confirmation dialog for clear action
- Version session JSON for forward compatibility

🤖 Generated with Claude Code"
```

**Step 3: Mark phase complete**

Edit `docs/plans/2025-12-13-elm-tauri-migration-design.md`:

Change line 21 from:
```
| 9 | Session Features | [ ] | `09-session-features-plan.md` |
```
To:
```
| 9 | Session Features | [x] | `09-session-features-plan.md` |
```

---

## Verification Checklist

- [ ] `elm-test` passes all tests
- [ ] Export button opens save dialog
- [ ] Session saves as JSON with correct structure
- [ ] Import button opens file picker
- [ ] Valid JSON imports successfully
- [ ] Invalid JSON shows error
- [ ] Clear button shows confirmation dialog
- [ ] Confirming clear empties chat history
- [ ] Cancelling keeps history intact
- [ ] Session JSON includes version field
