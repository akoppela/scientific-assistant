# i18n Implementation Plan

**Goal:** Add internationalization support with English and Russian translations, runtime language switching.

**Architecture:** Hand-written Elm module with translation functions. Each function takes `Language` and returns `String`. No codegen, no external dependencies. Simple and type-safe.

**Reference:** `docs/plans/2025-12-13-elm-tauri-migration-design.md`

---

## Design Decisions

1. **Native modules per layer** — Each layer (view, bridge, landing) owns its translations in native format. No shared source of truth.

2. **No codegen** — Hand-written Elm is already type-safe. Missing keys cause compile errors naturally.

3. **Runtime switching** — All translation functions take `Language` as first argument, enabling dynamic switching.

4. **Pluralization helpers** — Russian has 3 plural forms (one, few, many), English has 2 (one, other). Include helper functions.

5. **Future layers** — Bridge and landing will add their own i18n modules when needed. Duplication is acceptable.

---

## Prerequisites

- Bootstrap phase complete
- Redesign phase complete

---

## Task 1: Create I18n Module

**Files:**
- Create: `view/src/I18n.elm`

**Step 1: Create the module with Language type and core functions**

```elm
{- This Source Code Form is subject to the terms of the Mozilla Public
   License, v. 2.0. If a copy of the MPL was not distributed with this
   file, You can obtain one at https://mozilla.org/MPL/2.0/.
-}


module I18n exposing
    ( Language(..)
    , default
    , toString
    , fromString
    , toggle
    , pluralEn
    , pluralRu
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
default : Language
default =
    Ru


{-| Convert language to string for storage.
-}
toString : Language -> String
toString lang =
    case lang of
        En ->
            "en"

        Ru ->
            "ru"


{-| Parse language from string.
-}
fromString : String -> Maybe Language
fromString str =
    case str of
        "en" ->
            Just En

        "ru" ->
            Just Ru

        _ ->
            Nothing


{-| Toggle between languages.
-}
toggle : Language -> Language
toggle lang =
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
```

**Step 2: Add translation functions for current UI**

Add only translations used in Main.elm (expand exposing list accordingly):

```elm
-- =============================================================================
-- App
-- =============================================================================


{-| Application title.
-}
appTitle : Language -> String
appTitle lang =
    case lang of
        En ->
            "Scientific Assistant"

        Ru ->
            "Научный Ассистент"


{-| Application description.
-}
appDescription : Language -> String
appDescription lang =
    case lang of
        En ->
            "Chat application for scientific work with formulas, charts and code."

        Ru ->
            "Чат-приложение для научной работы с поддержкой формул, графиков и кода"



-- =============================================================================
-- Theme
-- =============================================================================


{-| Light theme button text.
-}
themeLight : Language -> String
themeLight lang =
    case lang of
        En ->
            "Light theme"

        Ru ->
            "Светлая тема"


{-| Dark theme button text.
-}
themeDark : Language -> String
themeDark lang =
    case lang of
        En ->
            "Dark theme"

        Ru ->
            "Тёмная тема"


{-| Switch to dark theme (aria-label).
-}
themeSwitchToDark : Language -> String
themeSwitchToDark lang =
    case lang of
        En ->
            "Switch to dark theme"

        Ru ->
            "Переключить на тёмную тему"


{-| Switch to light theme (aria-label).
-}
themeSwitchToLight : Language -> String
themeSwitchToLight lang =
    case lang of
        En ->
            "Switch to light theme"

        Ru ->
            "Переключить на светлую тему"
```

**Note:** Add more translations as features are built. elm-review will flag unused exports.

---

## Task 2: Write I18n Tests

**Files:**
- Create: `view/tests/I18nTest.elm`

**Step 1: Create test file**

```elm
module I18nTest exposing (suite)

{-| Tests for I18n pluralization functions.
-}

import Expect
import I18n
import Test exposing (Test, describe, test)


suite : Test
suite =
    describe "I18n"
        [ pluralEnTests
        , pluralRuTests
        ]


pluralEnTests : Test
pluralEnTests =
    describe "pluralEn"
        [ test "1 is singular" <|
            \_ ->
                I18n.pluralEn 1 "file" "files"
                    |> Expect.equal "1 file"
        , test "0 is plural" <|
            \_ ->
                I18n.pluralEn 0 "file" "files"
                    |> Expect.equal "0 files"
        , test "2 is plural" <|
            \_ ->
                I18n.pluralEn 2 "file" "files"
                    |> Expect.equal "2 files"
        , test "negative 1 is singular" <|
            \_ ->
                I18n.pluralEn -1 "file" "files"
                    |> Expect.equal "-1 file"
        ]


pluralRuTests : Test
pluralRuTests =
    describe "pluralRu"
        [ test "1 is one form" <|
            \_ ->
                I18n.pluralRu 1 "файл" "файла" "файлов"
                    |> Expect.equal "1 файл"
        , test "2 is few form" <|
            \_ ->
                I18n.pluralRu 2 "файл" "файла" "файлов"
                    |> Expect.equal "2 файла"
        , test "5 is many form" <|
            \_ ->
                I18n.pluralRu 5 "файл" "файла" "файлов"
                    |> Expect.equal "5 файлов"
        , test "11 is many form (exception)" <|
            \_ ->
                I18n.pluralRu 11 "файл" "файла" "файлов"
                    |> Expect.equal "11 файлов"
        , test "21 is one form" <|
            \_ ->
                I18n.pluralRu 21 "файл" "файла" "файлов"
                    |> Expect.equal "21 файл"
        , test "22 is few form" <|
            \_ ->
                I18n.pluralRu 22 "файл" "файла" "файлов"
                    |> Expect.equal "22 файла"
        , test "25 is many form" <|
            \_ ->
                I18n.pluralRu 25 "файл" "файла" "файлов"
                    |> Expect.equal "25 файлов"
        , test "111 is many form (exception)" <|
            \_ ->
                I18n.pluralRu 111 "файл" "файла" "файлов"
                    |> Expect.equal "111 файлов"
        , test "0 is many form" <|
            \_ ->
                I18n.pluralRu 0 "файл" "файла" "файлов"
                    |> Expect.equal "0 файлов"
        ]
```

**Step 2: Verify tests pass**

```bash
cd view && elm-test tests/I18nTest.elm
```

---

## Task 3: Add Language to Model

**Files:**
- Modify: `view/src/Main.elm`

**Step 1: Add language to Model and Flags**

Update the Model type:

```elm
type alias Model =
    { message : String
    , theme : Theme.Theme
    , language : I18n.Language
    }
```

Update Flags (add savedLanguage):

```elm
-- Note: Currently Main doesn't use flags. This step adds them.
```

**Step 2: Add ToggleLanguage message**

```elm
type Msg
    = ToggleTheme
    | ToggleLanguage
```

**Step 3: Handle ToggleLanguage in update**

```elm
ToggleLanguage ->
    let
        newLanguage : I18n.Language
        newLanguage =
            I18n.toggle model.language
    in
    ( { model | language = newLanguage }
    , setLanguage (I18n.toString newLanguage)
    )
```

**Step 4: Add setLanguage port**

```elm
port setLanguage : String -> Cmd msg
```

**Step 5: Update view to use I18n**

Replace hardcoded Russian strings with I18n function calls.

---

## Task 4: Add Language Port to Bridge

**Files:**
- Modify: `bridge/src/main.ts`
- Create: `bridge/src/language.ts`

**Step 1: Create language module**

```typescript
// bridge/src/language.ts
// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

const STORAGE_KEY = 'language';
const DEFAULT_LANGUAGE = 'ru';

export function load(): string {
  return localStorage.getItem(STORAGE_KEY) ?? DEFAULT_LANGUAGE;
}

export function set(lang: string): void {
  document.documentElement.setAttribute('lang', lang);
  localStorage.setItem(STORAGE_KEY, lang);
}
```

**Step 2: Update main.ts**

Add language to Flags interface:

```typescript
interface Flags {
  savedTheme: string | null;
  savedLanguage: string | null;
}
```

Update ElmPorts interface:

```typescript
interface ElmPorts {
  setTheme: {
    subscribe: (callback: (theme: string) => void) => void;
  };
  setLanguage: {
    subscribe: (callback: (lang: string) => void) => void;
  };
}
```

Update initApp to load and pass language:

```typescript
import * as Language from './language';

// In initApp:
const savedLanguage = Language.load();
Language.set(savedLanguage);

const app = window.Elm.Main.init({
  node: root,
  flags: {
    savedTheme,
    savedLanguage,
  },
});

app.ports.setLanguage.subscribe(Language.set);
```

**Step 3: Write language tests**

Create `bridge/src/__tests__/language.test.ts` following the pattern of theme tests.

---

## Task 5: Update CLAUDE.md

**Files:**
- Modify: `CLAUDE.md`

**Step 1: Add i18n section**

```markdown
## Internationalization

Hand-written Elm module at `view/src/I18n.elm`.

**Adding translations:**
1. Add function to `I18n.elm` with `Language -> String` signature
2. Add to module's exposing list
3. Use in view: `I18n.newKey model.language`

**Interpolation (always use named arguments):**
```elm
stepOf : Language -> { current : Int, total : Int } -> String
stepOf lang { current, total } =
    case lang of
        En -> "Step " ++ String.fromInt current ++ " of " ++ String.fromInt total
        Ru -> "Шаг " ++ String.fromInt current ++ " из " ++ String.fromInt total
```

**Pluralization:**
- English: `pluralEn count "file" "files"` → "1 file", "2 files"
- Russian: `pluralRu count "файл" "файла" "файлов"` → "1 файл", "2 файла", "5 файлов"

**Rich text:** Use `elm-explorations/markdown` for translations with formatting:
```elm
import Markdown

welcomeMessage : Language -> Html msg
welcomeMessage lang =
    Markdown.toHtml [] (welcomeMessageText lang)

welcomeMessageText : Language -> String
welcomeMessageText lang =
    case lang of
        En -> "Welcome to **Scientific Assistant**!"
        Ru -> "Добро пожаловать в **Научный Ассистент**!"
```

**Design:**
- Hand-written Elm functions (not loaded data) — only `Language` in model
- Each layer owns its translations (no shared source)
- Missing translation = compile error
- Add translations as features are built (elm-review flags unused)
```

---

## Task 6: Commit

**Step 1: Commit changes**

```bash
git add -A
git commit -m "feat: add i18n with runtime language switching

- Create I18n.elm with Language type and translation functions
- Add pluralization helpers for English (2 forms) and Russian (3 forms)
- Add language toggle to Main with localStorage persistence
- Add language port and bridge integration
- All translations from legacy migrated

🤖 Generated with Claude Code"
```

**Step 2: Mark phase complete**

Edit `docs/plans/2025-12-13-elm-tauri-migration-design.md`:
- Change `| 5 | i18n | [ ] |` to `| 5 | i18n | [x] |`

---

## Verification Checklist

- [ ] `view/src/I18n.elm` compiles without errors
- [ ] Pluralization tests pass (`elm-test tests/I18nTest.elm`)
- [ ] Language toggle works in UI
- [ ] Language persists across page reload
- [ ] No hardcoded strings remain in Main.elm
