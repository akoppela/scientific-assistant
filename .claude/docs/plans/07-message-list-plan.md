# Message List + LLM Implementation Plan

**Goal:** Create chat message display with Gemini API integration, streaming responses, and message history.

**Architecture:** `Feature.Chat` manages message list and API communication. `Api.Gemini` handles API types and HTTP requests. Messages stream as plain text, format on completion. Ports bridge to JS fetch for API calls.

**Tech Stack:** Elm 0.19.1, elm/http, elm/json, Cloudflare Proxy, elm-json

**Reference:** `.claude/docs/plans/2025-12-13-elm-tauri-migration-design.md`

---

## Before Execution

1. **Invoke brainstorming skill** — Review this plan and existing message implementation
2. **Analyze** — Check `legacy/src/components/MessageList.tsx` for message display
3. **Analyze** — Check `legacy/src/state/features/messages.ts` for message types
4. **Analyze** — Check `legacy/src/state/features/gemini.ts` for API integration
5. **Analyze** — Check `legacy/src/effects.ts` for Gemini API call patterns
6. **Confirm** — User confirms plan accuracy before proceeding
7. **Proceed** — Use executing-plans + test-driven-development skills

---

## Prerequisites

- Main Shell phase complete
- Cloudflare Proxy deployed and working
- i18n phase complete

---

## Task 1: Create Message Types

**Files:**
- Create: `src/Shared/Message.elm`
- Create: `tests/Shared/MessageTest.elm`

**Step 1: Write failing test**

```elm
module Shared.MessageTest exposing (..)

import Expect
import Json.Decode as Decode
import Shared.Message as Message exposing (Role(..))
import Test exposing (Test, describe, test)


suite : Test
suite =
    describe "Shared.Message"
        [ describe "Role"
            [ test "toString User returns user" <|
                \_ ->
                    Message.roleToString User
                        |> Expect.equal "user"
            , test "toString Assistant returns model" <|
                \_ ->
                    Message.roleToString Assistant
                        |> Expect.equal "model"
            ]
        , describe "ContentPart"
            [ test "Text part encodes correctly" <|
                \_ ->
                    Message.Text "Hello"
                        |> Message.encodeContentPart
                        |> Decode.decodeValue (Decode.field "text" Decode.string)
                        |> Expect.equal (Ok "Hello")
            ]
        , describe "Message"
            [ test "creates user message with text" <|
                \_ ->
                    let
                        msg =
                            Message.createUser "Hello"
                    in
                    Expect.all
                        [ .role >> Expect.equal User
                        , .content >> List.length >> Expect.equal 1
                        ]
                        msg
            ]
        ]
```

**Step 2: Verify test fails**

```bash
elm-test tests/Shared/MessageTest.elm
```

Expected: FAIL.

**Step 3: Implement Message module**

```elm
module Shared.Message exposing
    ( Role(..)
    , ContentPart(..)
    , Message
    , GroundingChunk
    , createUser
    , createAssistant
    , roleToString
    , encodeContentPart
    , encodeMessage
    , decodeResponse
    )

import Json.Decode as Decode exposing (Decoder)
import Json.Encode as Encode



-- TYPES


type Role
    = User
    | Assistant


type ContentPart
    = Text String
    | Thought String
    | Image { mimeType : String, data : String }


type alias Message =
    { role : Role
    , content : List ContentPart
    }


type alias GroundingChunk =
    { title : String
    , url : String
    }



-- CONSTRUCTORS


createUser : String -> Message
createUser text =
    { role = User
    , content = [ Text text ]
    }


createAssistant : List ContentPart -> Message
createAssistant parts =
    { role = Assistant
    , content = parts
    }



-- ENCODING


roleToString : Role -> String
roleToString role =
    case role of
        User ->
            "user"

        Assistant ->
            "model"


encodeContentPart : ContentPart -> Encode.Value
encodeContentPart part =
    case part of
        Text str ->
            Encode.object [ ( "text", Encode.string str ) ]

        Thought str ->
            Encode.object
                [ ( "text", Encode.string str )
                , ( "thought", Encode.bool True )
                ]

        Image { mimeType, data } ->
            Encode.object
                [ ( "inlineData"
                  , Encode.object
                        [ ( "mimeType", Encode.string mimeType )
                        , ( "data", Encode.string data )
                        ]
                  )
                ]


encodeMessage : Message -> Encode.Value
encodeMessage msg =
    Encode.object
        [ ( "role", Encode.string (roleToString msg.role) )
        , ( "parts", Encode.list encodeContentPart msg.content )
        ]



-- DECODING


decodeResponse : Decoder (List ContentPart)
decodeResponse =
    Decode.at [ "candidates" ]
        (Decode.index 0
            (Decode.at [ "content", "parts" ]
                (Decode.list decodeContentPart)
            )
        )


decodeContentPart : Decoder ContentPart
decodeContentPart =
    Decode.oneOf
        [ decodeThoughtPart
        , decodeImagePart
        , decodeTextPart
        ]


decodeTextPart : Decoder ContentPart
decodeTextPart =
    Decode.map Text (Decode.field "text" Decode.string)


decodeThoughtPart : Decoder ContentPart
decodeThoughtPart =
    Decode.map2
        (\text _ -> Thought text)
        (Decode.field "text" Decode.string)
        (Decode.field "thought" Decode.bool)


decodeImagePart : Decoder ContentPart
decodeImagePart =
    Decode.at [ "inlineData" ]
        (Decode.map2
            (\mime data -> Image { mimeType = mime, data = data })
            (Decode.field "mimeType" Decode.string)
            (Decode.field "data" Decode.string)
        )
```

**Step 4: Verify test passes**

```bash
elm-test tests/Shared/MessageTest.elm
```

Expected: All tests pass.

---

## Task 2: Create Gemini API Module

**Files:**
- Create: `src/Api/Gemini.elm`
- Create: `tests/Api/GeminiTest.elm`

**Step 1: Install elm/http**

```bash
elm-json install elm/http
```

**Step 2: Write failing test**

```elm
module Api.GeminiTest exposing (..)

import Api.Gemini as Gemini exposing (GeminiModel(..))
import Expect
import Test exposing (Test, describe, test)


suite : Test
suite =
    describe "Api.Gemini"
        [ describe "GeminiModel"
            [ test "toApiId returns correct ID for Fast" <|
                \_ ->
                    Gemini.toApiId Fast
                        |> Expect.equal "gemini-2.0-flash"
            , test "toApiId returns correct ID for Thinking" <|
                \_ ->
                    Gemini.toApiId Thinking
                        |> Expect.equal "gemini-2.0-flash-thinking-exp"
            , test "toApiId returns correct ID for Creative" <|
                \_ ->
                    Gemini.toApiId Creative
                        |> Expect.equal "gemini-2.0-flash-exp"
            ]
        , describe "Config"
            [ test "default config has searchGrounding disabled" <|
                \_ ->
                    Gemini.defaultConfig.searchGrounding
                        |> Expect.equal False
            ]
        ]
```

**Step 3: Implement Gemini module**

```elm
module Api.Gemini exposing
    ( GeminiModel(..)
    , Config
    , Request
    , Response(..)
    , defaultConfig
    , toApiId
    , allModels
    , sendRequest
    )

import Http
import Json.Decode as Decode exposing (Decoder)
import Json.Encode as Encode
import Shared.Message as Message exposing (Message)



-- TYPES


type GeminiModel
    = Fast
    | Thinking
    | Creative


type alias Config =
    { model : GeminiModel
    , searchGrounding : Bool
    , proxyUrl : String
    , proxyApiKey : String
    }


type alias Request =
    { history : List Message
    , config : Config
    }


type Response
    = Success (List Message.ContentPart) (Maybe (List Message.GroundingChunk))
    | Error String



-- CONSTANTS


defaultConfig : Config
defaultConfig =
    { model = Fast
    , searchGrounding = False
    , proxyUrl = ""
    , proxyApiKey = ""
    }


allModels : List GeminiModel
allModels =
    [ Fast, Thinking, Creative ]


toApiId : GeminiModel -> String
toApiId model =
    case model of
        Fast ->
            "gemini-2.0-flash"

        Thinking ->
            "gemini-2.0-flash-thinking-exp"

        Creative ->
            "gemini-2.0-flash-exp"



-- HTTP


sendRequest : Request -> (Result Http.Error Response -> msg) -> Cmd msg
sendRequest request toMsg =
    let
        url =
            request.config.proxyUrl ++ "?model=" ++ toApiId request.config.model

        body =
            encodeRequestBody request
    in
    Http.request
        { method = "POST"
        , headers =
            [ Http.header "Authorization" ("Bearer " ++ request.config.proxyApiKey)
            , Http.header "Content-Type" "application/json"
            ]
        , url = url
        , body = Http.jsonBody body
        , expect = Http.expectJson toMsg decodeGeminiResponse
        , timeout = Just 120000
        , tracker = Nothing
        }


encodeRequestBody : Request -> Encode.Value
encodeRequestBody request =
    let
        baseConfig =
            Encode.object
                [ ( "thinkingConfig"
                  , Encode.object [ ( "includeThoughts", Encode.bool True ) ]
                  )
                ]

        tools =
            if request.config.searchGrounding then
                [ Encode.object [ ( "googleSearch", Encode.object [] ) ]
                , Encode.object [ ( "urlContext", Encode.object [] ) ]
                ]

            else
                [ Encode.object [ ( "urlContext", Encode.object [] ) ] ]
    in
    Encode.object
        [ ( "contents", Encode.list Message.encodeMessage request.history )
        , ( "generationConfig", baseConfig )
        , ( "tools", Encode.list identity tools )
        ]


decodeGeminiResponse : Decoder Response
decodeGeminiResponse =
    Decode.oneOf
        [ decodeSuccessResponse
        , decodeErrorResponse
        ]


decodeSuccessResponse : Decoder Response
decodeSuccessResponse =
    Decode.map2 Success
        Message.decodeResponse
        (Decode.maybe decodeGroundingChunks)


decodeGroundingChunks : Decoder (List Message.GroundingChunk)
decodeGroundingChunks =
    Decode.at [ "candidates" ]
        (Decode.index 0
            (Decode.at [ "groundingMetadata", "groundingChunks" ]
                (Decode.list decodeGroundingChunk)
            )
        )


decodeGroundingChunk : Decoder Message.GroundingChunk
decodeGroundingChunk =
    Decode.map2 Message.GroundingChunk
        (Decode.at [ "web", "title" ] Decode.string)
        (Decode.at [ "web", "uri" ] Decode.string)


decodeErrorResponse : Decoder Response
decodeErrorResponse =
    Decode.map Error
        (Decode.at [ "error", "message" ] Decode.string)
```

**Step 4: Verify test passes**

```bash
elm-test tests/Api/GeminiTest.elm
```

Expected: All tests pass.

---

## Task 3: Create Chat Feature Module

**Files:**
- Create: `src/Feature/Chat.elm`
- Create: `tests/Feature/ChatTest.elm`

**Step 1: Write failing test**

```elm
module Feature.ChatTest exposing (..)

import Api.Gemini as Gemini
import Expect
import Feature.Chat as Chat exposing (Status(..))
import I18n exposing (Language(..))
import Shared.Message as Message
import Test exposing (Test, describe, test)


suite : Test
suite =
    describe "Feature.Chat"
        [ describe "init"
            [ test "initializes with empty history" <|
                \_ ->
                    let
                        model =
                            Chat.init Chat.defaultConfig
                    in
                    model.history
                        |> Expect.equal []
            , test "initializes with Idle status" <|
                \_ ->
                    let
                        model =
                            Chat.init Chat.defaultConfig
                    in
                    model.status
                        |> Expect.equal Idle
            ]
        , describe "update"
            [ test "SendMessage adds user message to history" <|
                \_ ->
                    let
                        initial =
                            Chat.init Chat.defaultConfig

                        ( updated, _ ) =
                            Chat.update (Chat.SendMessage "Hello") initial
                    in
                    updated.history
                        |> List.length
                        |> Expect.equal 1
            , test "SendMessage sets status to Loading" <|
                \_ ->
                    let
                        initial =
                            Chat.init Chat.defaultConfig

                        ( updated, _ ) =
                            Chat.update (Chat.SendMessage "Hello") initial
                    in
                    updated.status
                        |> Expect.equal Loading
            ]
        ]
```

**Step 2: Implement Chat module**

```elm
module Feature.Chat exposing
    ( Model
    , Msg(..)
    , Status(..)
    , Config
    , defaultConfig
    , init
    , update
    , view
    )

import Api.Gemini as Gemini
import Html exposing (Html, div, p, span, text)
import Html.Attributes exposing (attribute, class)
import Http
import I18n exposing (Language)
import Shared.Message as Message exposing (ContentPart(..), Message, Role(..))



-- CONFIG


type alias Config =
    { language : Language
    , geminiConfig : Gemini.Config
    }


defaultConfig : Config
defaultConfig =
    { language = I18n.Ru
    , geminiConfig = Gemini.defaultConfig
    }



-- MODEL


type Status
    = Idle
    | Loading
    | Error String


type alias Model =
    { history : List Message
    , status : Status
    , language : Language
    , geminiConfig : Gemini.Config
    }


init : Config -> Model
init config =
    { history = []
    , status = Idle
    , language = config.language
    , geminiConfig = config.geminiConfig
    }



-- UPDATE


type Msg
    = SendMessage String
    | GotResponse (Result Http.Error Gemini.Response)
    | Retry
    | ClearHistory


update : Msg -> Model -> ( Model, Cmd Msg )
update msg model =
    case msg of
        SendMessage text ->
            let
                userMessage =
                    Message.createUser text

                newHistory =
                    model.history ++ [ userMessage ]

                request =
                    { history = newHistory
                    , config = model.geminiConfig
                    }
            in
            ( { model
                | history = newHistory
                , status = Loading
              }
            , Gemini.sendRequest request GotResponse
            )

        GotResponse result ->
            case result of
                Ok (Gemini.Success parts _) ->
                    let
                        assistantMessage =
                            Message.createAssistant parts
                    in
                    ( { model
                        | history = model.history ++ [ assistantMessage ]
                        , status = Idle
                      }
                    , Cmd.none
                    )

                Ok (Gemini.Error errorMsg) ->
                    ( { model | status = Error errorMsg }
                    , Cmd.none
                    )

                Err httpError ->
                    ( { model | status = Error (httpErrorToString httpError) }
                    , Cmd.none
                    )

        Retry ->
            -- Retry last user message
            case List.reverse model.history of
                lastMsg :: rest ->
                    if lastMsg.role == User then
                        let
                            request =
                                { history = model.history
                                , config = model.geminiConfig
                                }
                        in
                        ( { model | status = Loading }
                        , Gemini.sendRequest request GotResponse
                        )

                    else
                        ( model, Cmd.none )

                [] ->
                    ( model, Cmd.none )

        ClearHistory ->
            ( { model | history = [], status = Idle }
            , Cmd.none
            )


httpErrorToString : Http.Error -> String
httpErrorToString error =
    case error of
        Http.BadUrl url ->
            "Bad URL: " ++ url

        Http.Timeout ->
            "Request timed out"

        Http.NetworkError ->
            "Network error"

        Http.BadStatus code ->
            "Server error: " ++ String.fromInt code

        Http.BadBody body ->
            "Invalid response: " ++ body



-- VIEW


testId : String -> Html.Attribute msg
testId id =
    attribute "data-testid" id


view : Model -> Html Msg
view model =
    div [ class "flex-1 overflow-y-auto p-4" ]
        [ div [ class "max-w-4xl mx-auto space-y-4" ]
            (List.indexedMap (viewMessage model.language) model.history
                ++ [ viewStatus model ]
            )
        ]


viewMessage : Language -> Int -> Message -> Html Msg
viewMessage lang index msg =
    let
        ( roleClass, roleTestId ) =
            case msg.role of
                User ->
                    ( "bg-primary/10 ml-auto", "message-user" )

                Assistant ->
                    ( "bg-muted", "message-assistant" )
    in
    div
        [ class ("max-w-[80%] rounded-lg p-4 " ++ roleClass)
        , testId (roleTestId ++ "-" ++ String.fromInt index)
        ]
        (List.map (viewContentPart lang) msg.content)


viewContentPart : Language -> ContentPart -> Html Msg
viewContentPart _ part =
    case part of
        Text str ->
            p [ class "text-foreground whitespace-pre-wrap" ] [ text str ]

        Thought str ->
            div [ class "text-muted-foreground italic text-sm border-l-2 border-muted pl-3 mb-2" ]
                [ p [] [ text str ] ]

        Image { data, mimeType } ->
            Html.img
                [ Html.Attributes.src ("data:" ++ mimeType ++ ";base64," ++ data)
                , class "max-w-full rounded-md"
                ]
                []


viewStatus : Model -> Html Msg
viewStatus model =
    case model.status of
        Loading ->
            div [ class "flex items-center gap-2 text-muted-foreground", testId "loading-indicator" ]
                [ span [ class "spinner" ] []
                , text (I18n.chatThinking model.language)
                ]

        Error errorMsg ->
            div [ class "bg-destructive/10 border border-destructive rounded-lg p-4", testId "error-message" ]
                [ p [ class "text-destructive" ] [ text errorMsg ]
                , Html.button
                    [ class "btn-secondary mt-2"
                    , Html.Events.onClick Retry
                    , testId "retry-button"
                    ]
                    [ text (I18n.actionsRetry model.language) ]
                ]

        Idle ->
            text ""
```

**Step 3: Verify test passes**

```bash
elm-test tests/Feature/ChatTest.elm
```

Expected: All tests pass.

---

## Task 4: Integrate Chat into Main

**Files:**
- Modify: `src/Main.elm`

**Step 1: Update Main.elm**

Add Chat to imports and model:

```elm
import Feature.Chat as Chat
```

Update Model:

```elm
type alias Model =
    { header : Header.Model
    , input : Input.Model
    , chat : Chat.Model
    }
```

Update init:

```elm
init : Flags -> ( Model, Cmd Msg )
init flags =
    let
        -- ... existing code ...

        geminiConfig =
            { model = Gemini.Fast
            , searchGrounding = False
            , proxyUrl = flags.proxyUrl |> Maybe.withDefault ""
            , proxyApiKey = flags.proxyApiKey |> Maybe.withDefault ""
            }
    in
    ( { header = Header.init { theme = theme, language = language }
      , input = Input.init { language = language }
      , chat = Chat.init { language = language, geminiConfig = geminiConfig }
      }
    , Cmd.none
    )
```

Add ChatMsg to Msg type and update function:

```elm
type Msg
    = HeaderMsg Header.Msg
    | InputMsg Input.Msg
    | ChatMsg Chat.Msg


update : Msg -> Model -> ( Model, Cmd Msg )
update msg model =
    case msg of
        -- ... existing cases ...

        InputMsg Input.Submitted ->
            let
                text =
                    String.trim model.input.text
            in
            if String.isEmpty text then
                ( model, Cmd.none )

            else
                let
                    ( inputModel, _ ) =
                        Input.update Input.Submitted model.input

                    ( chatModel, chatCmd ) =
                        Chat.update (Chat.SendMessage text) model.chat
                in
                ( { model
                    | input = inputModel
                    , chat = chatModel
                  }
                , Cmd.map ChatMsg chatCmd
                )

        InputMsg subMsg ->
            -- ... existing code ...

        ChatMsg subMsg ->
            let
                ( chatModel, chatCmd ) =
                    Chat.update subMsg model.chat
            in
            ( { model | chat = chatModel }
            , Cmd.map ChatMsg chatCmd
            )
```

Update view:

```elm
view : Model -> Html Msg
view model =
    div [ class "flex flex-col h-screen" ]
        [ Html.map HeaderMsg (Header.view model.header)
        , Html.map ChatMsg (Chat.view model.chat)
        , Html.map InputMsg (Input.view model.input)
        ]
```

---

## Task 5: Add Flags for Proxy Config

**Files:**
- Modify: `ts/main.ts`
- Modify: `src/Main.elm`

**Step 1: Update Flags type in Main.elm**

```elm
type alias Flags =
    { savedTheme : Maybe String
    , savedLanguage : Maybe String
    , proxyUrl : Maybe String
    , proxyApiKey : Maybe String
    }
```

**Step 2: Update main.ts**

```typescript
interface Flags {
  savedTheme: string | null;
  savedLanguage: string | null;
  proxyUrl: string | null;
  proxyApiKey: string | null;
}

// In initApp:
const app = window.Elm.Main.init({
  node: root,
  flags: {
    savedTheme,
    savedLanguage,
    proxyUrl: import.meta.env.VITE_PROXY_URL || null,
    proxyApiKey: import.meta.env.VITE_PROXY_API_KEY || null,
  },
});
```

**Step 3: Create .env.example**

```bash
# .env.example
VITE_PROXY_URL=https://gemini-proxy.xxx.workers.dev
VITE_PROXY_API_KEY=your-proxy-api-key
```

---

## Task 6: Commit and Mark Complete

**Step 1: Run all tests**

```bash
elm-test
```

Expected: All tests pass.

**Step 2: Commit**

```bash
git add -A
git commit -m "feat: add chat message list with Gemini API integration

- Create Shared.Message with types and encoders/decoders
- Create Api.Gemini for API communication
- Create Feature.Chat with message list and loading states
- Integrate chat with Input submission
- Add proxy config via environment variables
- Support thinking/thought display
- Add error display with retry

🤖 Generated with Claude Code"
```

**Step 3: Mark phase complete**

Edit `.claude/docs/plans/2025-12-13-elm-tauri-migration-design.md`:

Change line 19 from:
```
| 7 | Message List + LLM | [ ] | `07-message-list-plan.md` |
```
To:
```
| 7 | Message List + LLM | [x] | `07-message-list-plan.md` |
```

---

## Verification Checklist

- [ ] `elm-test` passes all tests
- [ ] Typing message and pressing Send/Enter sends to API
- [ ] User messages display on right (primary bg)
- [ ] Assistant messages display on left (muted bg)
- [ ] Loading spinner shows during API call
- [ ] Thinking/thought text displays in italics
- [ ] Error messages display with retry button
- [ ] Retry button resends last message
- [ ] Environment variables configure proxy
