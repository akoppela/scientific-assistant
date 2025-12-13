# i18n Implementation Plan

**Goal:** Create internationalization system with YAML source of truth, generating type-safe code for Elm (elm-codegen), TypeScript, and Rust.

**Architecture:** Single `translations.yaml` defines all strings with En/Ru translations. Build scripts generate language-specific modules. Elm gets type-safe functions. Missing keys cause compile errors.

**Tech Stack:** YAML, elm-codegen, Node.js scripts, Elm 0.19.1

**Reference:** `.claude/docs/plans/2025-12-13-elm-tauri-migration-design.md`

---

## Before Execution

1. **Invoke brainstorming skill** — Review this plan and existing i18n implementation
2. **Analyze** — Check `legacy/src/i18n/` for all translation keys and patterns
3. **Analyze** — Review `legacy/src/i18n/translations/ru.ts` and `en.ts` for all strings
4. **Confirm** — User confirms plan accuracy and all keys are captured
5. **Proceed** — Use executing-plans + test-driven-development skills

---

## Prerequisites

- Bootstrap phase complete
- Redesign phase complete

---

## Task 1: Create Translations YAML

**Files:**
- Create: `translations/translations.yaml`

**Step 1: Create translations file**

```yaml
# translations/translations.yaml
# Source of truth for all UI strings
# Format: key.subkey: { en: "English", ru: "Russian" }

app:
  title:
    en: "Scientific Assistant"
    ru: "Научный помощник"

theme:
  light:
    en: "Light"
    ru: "Светлая"
  dark:
    en: "Dark"
    ru: "Тёмная"
  toggle:
    en: "Toggle theme"
    ru: "Переключить тему"

language:
  toggle:
    en: "Toggle language"
    ru: "Переключить язык"
  en:
    en: "English"
    ru: "Английский"
  ru:
    en: "Russian"
    ru: "Русский"

actions:
  send:
    en: "Send"
    ru: "Отправить"
  cancel:
    en: "Cancel"
    ru: "Отмена"
  clear:
    en: "Clear"
    ru: "Очистить"
  export:
    en: "Export"
    ru: "Экспорт"
  import:
    en: "Import"
    ru: "Импорт"
  retry:
    en: "Retry"
    ru: "Повторить"
  copy:
    en: "Copy"
    ru: "Копировать"
  copied:
    en: "Copied!"
    ru: "Скопировано!"

chat:
  placeholder:
    en: "Type your message..."
    ru: "Введите сообщение..."
  thinking:
    en: "Thinking..."
    ru: "Думаю..."
  error:
    en: "Error occurred"
    ru: "Произошла ошибка"

models:
  fast:
    en: "Fast"
    ru: "Быстрая"
  thinking:
    en: "Thinking"
    ru: "Думающая"
  creative:
    en: "Creative"
    ru: "Творческая"

session:
  clearConfirm:
    en: "Clear all messages?"
    ru: "Очистить все сообщения?"
  exportSuccess:
    en: "Session exported"
    ru: "Сессия экспортирована"
  importSuccess:
    en: "Session imported"
    ru: "Сессия импортирована"
  importError:
    en: "Failed to import session"
    ru: "Не удалось импортировать сессию"

tutorial:
  title:
    en: "Welcome!"
    ru: "Добро пожаловать!"
  skip:
    en: "Skip"
    ru: "Пропустить"
  next:
    en: "Next"
    ru: "Далее"
  prev:
    en: "Back"
    ru: "Назад"
  finish:
    en: "Finish"
    ru: "Завершить"
  # Interpolated string: stepOf(1, 5) => "Step 1 of 5"
  stepOf:
    en: "Step {current} of {total}"
    ru: "Шаг {current} из {total}"

search:
  grounding:
    en: "Search grounding"
    ru: "Поиск в интернете"
  enabled:
    en: "Search enabled"
    ru: "Поиск включён"
  disabled:
    en: "Search disabled"
    ru: "Поиск отключён"

help:
  button:
    en: "Help"
    ru: "Справка"
```

---

## Task 2: Create elm-codegen Generator

**Files:**
- Create: `codegen/Generate.elm`
- Create: `codegen/elm.json`
- Create: `scripts/generate-i18n.js`

**Step 1: Create codegen elm.json**

```json
{
    "type": "application",
    "source-directories": [
        "."
    ],
    "elm-version": "0.19.1",
    "dependencies": {
        "direct": {
            "elm/core": "1.0.5",
            "elm/json": "1.1.3",
            "mdgriffith/elm-codegen": "4.1.1"
        },
        "indirect": {
            "elm/parser": "1.1.0",
            "elm/html": "1.0.0",
            "elm/virtual-dom": "1.0.3",
            "stil4m/elm-syntax": "7.3.8",
            "stil4m/structured-writer": "1.0.3",
            "the-sett/elm-pretty-printer": "3.0.0"
        }
    },
    "test-dependencies": {
        "direct": {},
        "indirect": {}
    }
}
```

**Step 2: Create Node.js generator script**

```javascript
// scripts/generate-i18n.js
import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { parse } from "yaml";
import { dirname } from "path";

const YAML_PATH = "translations/translations.yaml";
const ELM_OUTPUT = "src/I18n.elm";

function loadTranslations() {
  const content = readFileSync(YAML_PATH, "utf8");
  return parse(content);
}

function flattenKeys(obj, prefix = "") {
  const result = {};
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (value.en !== undefined && value.ru !== undefined) {
      result[fullKey] = value;
    } else if (typeof value === "object") {
      Object.assign(result, flattenKeys(value, fullKey));
    }
  }
  return result;
}

function hasInterpolation(str) {
  return /\{[^}]+\}/.test(str);
}

function getInterpolationParams(str) {
  const matches = str.match(/\{([^}]+)\}/g) || [];
  return matches.map((m) => m.slice(1, -1));
}

function toElmFunctionName(key) {
  // app.title => appTitle
  return key
    .split(".")
    .map((part, i) => (i === 0 ? part : part[0].toUpperCase() + part.slice(1)))
    .join("");
}

function generateElmModule(translations) {
  const flat = flattenKeys(translations);
  const functions = [];
  const exports = [];

  for (const [key, value] of Object.entries(flat)) {
    const fnName = toElmFunctionName(key);
    exports.push(fnName);

    if (hasInterpolation(value.en)) {
      const params = getInterpolationParams(value.en);
      const paramList = params.map((p) => `${p} : String`).join(", ");
      const paramArgs = params.join(" ");

      // Generate interpolation function
      const enValue = value.en.replace(/\{([^}]+)\}/g, '" ++ $1 ++ "');
      const ruValue = value.ru.replace(/\{([^}]+)\}/g, '" ++ $1 ++ "');

      functions.push(`
${fnName} : Language -> { ${paramList} } -> String
${fnName} lang { ${paramArgs} } =
    case lang of
        En ->
            "${enValue}"

        Ru ->
            "${ruValue}"
`);
    } else {
      functions.push(`
${fnName} : Language -> String
${fnName} lang =
    case lang of
        En ->
            "${value.en}"

        Ru ->
            "${value.ru}"
`);
    }
  }

  const moduleContent = `module I18n exposing
    ( Language(..)
    , toString
    , fromString
    , toggle
    , ${exports.join("\n    , ")}
    )

{-| Generated internationalization module.
Do not edit manually - regenerate with: npm run generate:i18n
-}


type Language
    = En
    | Ru


toString : Language -> String
toString lang =
    case lang of
        En ->
            "en"

        Ru ->
            "ru"


fromString : String -> Maybe Language
fromString str =
    case str of
        "en" ->
            Just En

        "ru" ->
            Just Ru

        _ ->
            Nothing


toggle : Language -> Language
toggle lang =
    case lang of
        En ->
            Ru

        Ru ->
            En

${functions.join("\n")}
`;

  mkdirSync(dirname(ELM_OUTPUT), { recursive: true });
  writeFileSync(ELM_OUTPUT, moduleContent);
  console.log(`Generated: ${ELM_OUTPUT}`);
}

function generateTypeScriptModule(translations) {
  const flat = flattenKeys(translations);
  const functions = [];

  for (const [key, value] of Object.entries(flat)) {
    const fnName = toElmFunctionName(key);

    if (hasInterpolation(value.en)) {
      const params = getInterpolationParams(value.en);
      const paramTypes = params.map((p) => `${p}: string`).join(", ");
      functions.push(`
export function ${fnName}(lang: Language, { ${params.join(", ")} }: { ${paramTypes} }): string {
  const templates = {
    en: \`${value.en.replace(/\{/g, "${")}\`,
    ru: \`${value.ru.replace(/\{/g, "${")}\`
  };
  return templates[lang];
}
`);
    } else {
      functions.push(`
export function ${fnName}(lang: Language): string {
  return lang === "en" ? "${value.en}" : "${value.ru}";
}
`);
    }
  }

  const content = `// Generated - do not edit manually
// Regenerate with: npm run generate:i18n

export type Language = "en" | "ru";

export function toggle(lang: Language): Language {
  return lang === "en" ? "ru" : "en";
}
${functions.join("\n")}
`;

  writeFileSync("ts/i18n.ts", content);
  console.log("Generated: ts/i18n.ts");
}

const translations = loadTranslations();
generateElmModule(translations);
generateTypeScriptModule(translations);
```

**Step 3: Add yaml dependency and script to package.json**

```json
{
  "scripts": {
    "generate:i18n": "node scripts/generate-i18n.js"
  },
  "devDependencies": {
    "yaml": "^2.6.0"
  }
}
```

**Step 4: Install and generate**

```bash
npm install
npm run generate:i18n
```

Expected: `src/I18n.elm` and `ts/i18n.ts` generated.

---

## Task 3: Write Tests for Generated I18n

**Files:**
- Create: `tests/I18nTest.elm`

**Step 1: Write test**

```elm
module I18nTest exposing (..)

import Expect
import I18n exposing (Language(..))
import Test exposing (Test, describe, test)


suite : Test
suite =
    describe "I18n"
        [ describe "Language"
            [ test "toString En returns en" <|
                \_ ->
                    I18n.toString En
                        |> Expect.equal "en"
            , test "toString Ru returns ru" <|
                \_ ->
                    I18n.toString Ru
                        |> Expect.equal "ru"
            , test "fromString parses en" <|
                \_ ->
                    I18n.fromString "en"
                        |> Expect.equal (Just En)
            , test "fromString parses ru" <|
                \_ ->
                    I18n.fromString "ru"
                        |> Expect.equal (Just Ru)
            , test "toggle switches En to Ru" <|
                \_ ->
                    I18n.toggle En
                        |> Expect.equal Ru
            , test "toggle switches Ru to En" <|
                \_ ->
                    I18n.toggle Ru
                        |> Expect.equal En
            ]
        , describe "Translations"
            [ test "appTitle returns correct English" <|
                \_ ->
                    I18n.appTitle En
                        |> Expect.equal "Scientific Assistant"
            , test "appTitle returns correct Russian" <|
                \_ ->
                    I18n.appTitle Ru
                        |> Expect.equal "Научный помощник"
            , test "actionsSend returns correct translations" <|
                \_ ->
                    ( I18n.actionsSend En, I18n.actionsSend Ru )
                        |> Expect.equal ( "Send", "Отправить" )
            ]
        , describe "Interpolation"
            [ test "tutorialStepOf interpolates correctly in English" <|
                \_ ->
                    I18n.tutorialStepOf En { current = "2", total = "5" }
                        |> Expect.equal "Step 2 of 5"
            , test "tutorialStepOf interpolates correctly in Russian" <|
                \_ ->
                    I18n.tutorialStepOf Ru { current = "2", total = "5" }
                        |> Expect.equal "Шаг 2 из 5"
            ]
        ]
```

**Step 2: Verify tests pass**

```bash
elm-test tests/I18nTest.elm
```

Expected: All tests pass.

---

## Task 4: Create Language Module

**Files:**
- Create: `src/Shared/Language.elm`

**Step 1: Create Language module (re-exports from I18n)**

```elm
module Shared.Language exposing
    ( Language
    , default
    , toggle
    , toString
    , fromString
    )

{-| Re-exports Language type from I18n for cleaner imports.
-}

import I18n


type alias Language =
    I18n.Language


default : Language
default =
    I18n.Ru


toggle : Language -> Language
toggle =
    I18n.toggle


toString : Language -> String
toString =
    I18n.toString


fromString : String -> Maybe Language
fromString =
    I18n.fromString
```

---

## Task 5: Integrate i18n into Main

**Files:**
- Modify: `src/Main.elm`

**Step 1: Update Main.elm with i18n**

```elm
port module Main exposing (main)

import Browser
import Html exposing (Html, button, div, h1, p, span, text)
import Html.Attributes exposing (class, type_)
import Html.Events exposing (onClick)
import I18n exposing (Language(..))
import Shared.Theme as Theme


port setTheme : String -> Cmd msg


port setLanguage : String -> Cmd msg


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
    { theme : Theme.Theme
    , language : Language
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
    ( { theme = theme
      , language = language
      }
    , Cmd.none
    )



-- UPDATE


type Msg
    = ToggleTheme
    | ToggleLanguage


update : Msg -> Model -> ( Model, Cmd Msg )
update msg model =
    case msg of
        ToggleTheme ->
            let
                newTheme =
                    Theme.toggle model.theme
            in
            ( { model | theme = newTheme }
            , setTheme (Theme.toString newTheme)
            )

        ToggleLanguage ->
            let
                newLanguage =
                    I18n.toggle model.language
            in
            ( { model | language = newLanguage }
            , setLanguage (I18n.toString newLanguage)
            )



-- SUBSCRIPTIONS


subscriptions : Model -> Sub Msg
subscriptions _ =
    Sub.none



-- VIEW


view : Model -> Html Msg
view model =
    let
        t =
            -- Partial application for convenience
            identity
    in
    div [ class "flex flex-col items-center justify-center h-screen gap-6" ]
        [ h1 [ class "text-4xl font-bold text-foreground" ]
            [ text (I18n.appTitle model.language) ]
        , p [ class "text-muted-foreground" ]
            [ text "Elm + Tauri" ]
        , div [ class "flex gap-4" ]
            [ button
                [ class "btn-secondary px-4 py-2"
                , type_ "button"
                , onClick ToggleTheme
                ]
                [ text (I18n.themeToggle model.language) ]
            , button
                [ class "btn-secondary px-4 py-2"
                , type_ "button"
                , onClick ToggleLanguage
                ]
                [ text (I18n.languageToggle model.language) ]
            ]
        , div [ class "card p-4" ]
            [ p [ class "text-sm" ]
                [ text (I18n.tutorialStepOf model.language { current = "1", total = "5" }) ]
            ]
        ]
```

---

## Task 6: Update TypeScript Bridge

**Files:**
- Modify: `ts/main.ts`

**Step 1: Update main.ts with language port**

```typescript
// ts/main.ts
import { invoke } from "@tauri-apps/api/core";

declare global {
  interface Window {
    Elm: {
      Main: {
        init: (options: { node: HTMLElement; flags: Flags }) => ElmApp;
      };
    };
  }
}

interface Flags {
  savedTheme: string | null;
  savedLanguage: string | null;
}

interface ElmPorts {
  setTheme: {
    subscribe: (callback: (theme: string) => void) => void;
  };
  setLanguage: {
    subscribe: (callback: (lang: string) => void) => void;
  };
}

interface ElmApp {
  ports: ElmPorts;
}

function setTheme(theme: string): void {
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem("theme", theme);
}

function setLanguage(lang: string): void {
  document.documentElement.setAttribute("lang", lang);
  localStorage.setItem("language", lang);
}

async function initApp(): Promise<void> {
  const root = document.getElementById("app");
  if (!root) {
    throw new Error("Root element #app not found");
  }

  // Load saved preferences
  const savedTheme = localStorage.getItem("theme");
  const savedLanguage = localStorage.getItem("language");

  // Apply saved theme immediately
  if (savedTheme) {
    setTheme(savedTheme);
  }
  if (savedLanguage) {
    setLanguage(savedLanguage);
  }

  // Initialize Elm with flags
  const app = window.Elm.Main.init({
    node: root,
    flags: {
      savedTheme,
      savedLanguage,
    },
  });

  // Subscribe to ports
  app.ports.setTheme.subscribe(setTheme);
  app.ports.setLanguage.subscribe(setLanguage);

  // Test Tauri command
  const greeting = await invoke<string>("greet", { name: "Elm" });
  console.log(greeting);
}

document.addEventListener("DOMContentLoaded", initApp);
```

---

## Task 7: Add Build Script Integration

**Files:**
- Modify: `package.json`

**Step 1: Update build scripts**

```json
{
  "scripts": {
    "prebuild": "npm run generate:i18n",
    "predev": "npm run generate:i18n",
    "generate:i18n": "node scripts/generate-i18n.js"
  }
}
```

**Step 2: Verify full build**

```bash
npm run build
```

Expected: i18n generated, Elm compiled, build succeeds.

---

## Task 8: Update CLAUDE.md

**Files:**
- Modify: `CLAUDE.md`

**Step 1: Add i18n section**

```markdown
## Internationalization

Source of truth: `translations/translations.yaml`

**Adding translations:**
1. Add key to `translations.yaml` with `en` and `ru` values
2. Run `npm run generate:i18n`
3. Use in Elm: `I18n.newKey model.language`

**Interpolation:**
```yaml
stepOf:
  en: "Step {current} of {total}"
  ru: "Шаг {current} из {total}"
```

Usage: `I18n.tutorialStepOf lang { current = "1", total = "5" }`

**Files generated:**
- `src/I18n.elm` - Type-safe Elm module
- `ts/i18n.ts` - TypeScript module

Missing translation key = Elm compile error.
```

---

## Task 9: Commit and Mark Complete

**Step 1: Commit**

```bash
git add -A
git commit -m "feat: add i18n system with YAML source of truth

- Create translations.yaml with En/Ru translations
- Generate type-safe I18n.elm via codegen script
- Generate ts/i18n.ts for TypeScript usage
- Support interpolation (stepOf pattern)
- Integrate language toggle into Main
- Persist language preference in localStorage

🤖 Generated with Claude Code"
```

**Step 2: Mark phase complete**

Edit `.claude/docs/plans/2025-12-13-elm-tauri-migration-design.md`:

Change line 17 from:
```
| 5 | i18n | [ ] | `05-i18n-plan.md` |
```
To:
```
| 5 | i18n | [x] | `05-i18n-plan.md` |
```

---

## Verification Checklist

- [ ] `translations.yaml` contains all required keys
- [ ] `npm run generate:i18n` produces valid Elm and TS
- [ ] `elm-test tests/I18nTest.elm` passes
- [ ] Language toggle works in UI
- [ ] Language persists across page reload
- [ ] Interpolated strings work correctly
- [ ] Russian characters display correctly
- [ ] Adding new key + regenerate works
