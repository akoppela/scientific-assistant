# Redesign Implementation Plan

**Goal:** Set up Tailwind CSS with shadcn design tokens for consistent, accessible styling across the application.

**Architecture:** Tailwind CSS for utility classes. shadcn design tokens (CSS variables) for colors, radii, shadows. Light/dark theme via `data-theme` attribute on `<html>`. No JavaScript CSS framework dependencies.

**Tech Stack:** Tailwind CSS 4.x, PostCSS, CSS custom properties

**Reference:** `.claude/docs/plans/2025-12-13-elm-tauri-migration-design.md`

---

## Before Execution

1. **Invoke brainstorming skill** — Review existing UI design in `legacy/src/components/`
2. **Invoke frontend-design skill** — Create distinctive, production-grade UI design
3. **Invoke theme-factory skill** — Generate custom theme with colors/fonts
4. **Analyze** — Check `legacy/src/` for existing Tailwind/DaisyUI patterns
5. **Confirm** — User confirms design direction before proceeding
6. **Proceed** — Use executing-plans + test-driven-development skills

---

## Prerequisites

- Bootstrap phase complete
- Infrastructure phase complete

---

## Task 1: Configure Tailwind CSS

**Files:**
- Create: `tailwind.config.js`
- Create: `postcss.config.js`
- Modify: `package.json`

**Step 1: Create tailwind.config.js**

```javascript
// tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.elm", "./ts/**/*.ts"],
  darkMode: ["selector", '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [],
};
```

**Step 2: Create postcss.config.js**

```javascript
// postcss.config.js
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
```

**Step 3: Update package.json**

Add to devDependencies:

```json
{
  "devDependencies": {
    "tailwindcss": "^3.4.0",
    "postcss": "^8.4.0",
    "autoprefixer": "^10.4.0"
  }
}
```

**Step 4: Install dependencies**

```bash
npm install
```

Expected: Dependencies installed successfully.

---

## Task 2: Create shadcn Design Tokens

**Files:**
- Create: `styles/tokens.css`

**Step 1: Create design tokens**

```css
/* styles/tokens.css */

/* Light theme (default) */
:root {
  --background: 0 0% 100%;
  --foreground: 240 10% 3.9%;
  --card: 0 0% 100%;
  --card-foreground: 240 10% 3.9%;
  --popover: 0 0% 100%;
  --popover-foreground: 240 10% 3.9%;
  --primary: 240 5.9% 10%;
  --primary-foreground: 0 0% 98%;
  --secondary: 240 4.8% 95.9%;
  --secondary-foreground: 240 5.9% 10%;
  --muted: 240 4.8% 95.9%;
  --muted-foreground: 240 3.8% 46.1%;
  --accent: 240 4.8% 95.9%;
  --accent-foreground: 240 5.9% 10%;
  --destructive: 0 84.2% 60.2%;
  --destructive-foreground: 0 0% 98%;
  --border: 240 5.9% 90%;
  --input: 240 5.9% 90%;
  --ring: 240 5.9% 10%;
  --radius: 0.5rem;
}

/* Dark theme */
[data-theme="dark"] {
  --background: 240 10% 3.9%;
  --foreground: 0 0% 98%;
  --card: 240 10% 3.9%;
  --card-foreground: 0 0% 98%;
  --popover: 240 10% 3.9%;
  --popover-foreground: 0 0% 98%;
  --primary: 0 0% 98%;
  --primary-foreground: 240 5.9% 10%;
  --secondary: 240 3.7% 15.9%;
  --secondary-foreground: 0 0% 98%;
  --muted: 240 3.7% 15.9%;
  --muted-foreground: 240 5% 64.9%;
  --accent: 240 3.7% 15.9%;
  --accent-foreground: 0 0% 98%;
  --destructive: 0 62.8% 30.6%;
  --destructive-foreground: 0 0% 98%;
  --border: 240 3.7% 15.9%;
  --input: 240 3.7% 15.9%;
  --ring: 240 4.9% 83.9%;
}
```

---

## Task 3: Create Main Stylesheet

**Files:**
- Create: `styles/main.css`

**Step 1: Create main.css**

```css
/* styles/main.css */
@import "./tokens.css";

@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  * {
    @apply border-border;
  }

  body {
    @apply bg-background text-foreground;
    font-feature-settings: "rlig" 1, "calt" 1;
  }

  /* Focus ring styles */
  :focus-visible {
    @apply outline-none ring-2 ring-ring ring-offset-2 ring-offset-background;
  }

  /* Scrollbar styling */
  ::-webkit-scrollbar {
    @apply w-2 h-2;
  }

  ::-webkit-scrollbar-track {
    @apply bg-muted;
  }

  ::-webkit-scrollbar-thumb {
    @apply bg-muted-foreground/30 rounded-full;
  }

  ::-webkit-scrollbar-thumb:hover {
    @apply bg-muted-foreground/50;
  }
}

@layer components {
  /* Button base */
  .btn {
    @apply inline-flex items-center justify-center rounded-md text-sm font-medium
           transition-colors focus-visible:outline-none focus-visible:ring-2
           focus-visible:ring-ring focus-visible:ring-offset-2
           disabled:pointer-events-none disabled:opacity-50;
  }

  .btn-primary {
    @apply btn bg-primary text-primary-foreground hover:bg-primary/90;
  }

  .btn-secondary {
    @apply btn bg-secondary text-secondary-foreground hover:bg-secondary/80;
  }

  .btn-ghost {
    @apply btn hover:bg-accent hover:text-accent-foreground;
  }

  .btn-destructive {
    @apply btn bg-destructive text-destructive-foreground hover:bg-destructive/90;
  }

  /* Input base */
  .input {
    @apply flex h-10 w-full rounded-md border border-input bg-background px-3 py-2
           text-sm ring-offset-background placeholder:text-muted-foreground
           focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring
           focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50;
  }

  /* Card */
  .card {
    @apply rounded-lg border bg-card text-card-foreground shadow-sm;
  }

  /* Badge */
  .badge {
    @apply inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs
           font-semibold transition-colors;
  }

  .badge-primary {
    @apply badge border-transparent bg-primary text-primary-foreground;
  }

  .badge-secondary {
    @apply badge border-transparent bg-secondary text-secondary-foreground;
  }

  /* Spinner */
  .spinner {
    @apply animate-spin h-5 w-5 border-2 border-current border-t-transparent rounded-full;
  }
}
```

---

## Task 4: Update HTML and Vite Config

**Files:**
- Modify: `index.html`
- Modify: `vite.config.ts`

**Step 1: Update index.html**

```html
<!DOCTYPE html>
<html lang="ru" data-theme="light">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Scientific Assistant</title>
    <link rel="stylesheet" href="/styles/main.css" />
    <script src="/dist/elm.js"></script>
  </head>
  <body class="antialiased">
    <div id="app"></div>
    <script type="module" src="/ts/main.ts"></script>
  </body>
</html>
```

**Step 2: Update vite.config.ts**

```typescript
// vite.config.ts
import { defineConfig } from "vite";

export default defineConfig({
  clearScreen: false,
  server: {
    port: 5173,
    strictPort: true,
    watch: {
      ignored: ["**/src-tauri/**"],
    },
  },
  envPrefix: ["VITE_", "TAURI_"],
  build: {
    target: "esnext",
    minify: !process.env.TAURI_DEBUG ? "esbuild" : false,
    sourcemap: !!process.env.TAURI_DEBUG,
    outDir: "dist",
  },
  css: {
    postcss: "./postcss.config.js",
  },
});
```

---

## Task 5: Create Test for Theme Switching

**Files:**
- Create: `tests/ThemeTest.elm`
- Create: `src/Shared/Theme.elm`

**Step 1: Write failing test**

```elm
module ThemeTest exposing (..)

import Expect
import Shared.Theme as Theme
import Test exposing (Test, describe, test)


suite : Test
suite =
    describe "Theme"
        [ test "toggle switches light to dark" <|
            \_ ->
                Theme.Light
                    |> Theme.toggle
                    |> Expect.equal Theme.Dark
        , test "toggle switches dark to light" <|
            \_ ->
                Theme.Dark
                    |> Theme.toggle
                    |> Expect.equal Theme.Light
        , test "toString returns correct string for light" <|
            \_ ->
                Theme.Light
                    |> Theme.toString
                    |> Expect.equal "light"
        , test "toString returns correct string for dark" <|
            \_ ->
                Theme.Dark
                    |> Theme.toString
                    |> Expect.equal "dark"
        , test "fromString parses light" <|
            \_ ->
                "light"
                    |> Theme.fromString
                    |> Expect.equal (Just Theme.Light)
        , test "fromString parses dark" <|
            \_ ->
                "dark"
                    |> Theme.fromString
                    |> Expect.equal (Just Theme.Dark)
        , test "fromString returns Nothing for invalid" <|
            \_ ->
                "invalid"
                    |> Theme.fromString
                    |> Expect.equal Nothing
        ]
```

**Step 2: Verify test fails**

```bash
elm-test tests/ThemeTest.elm
```

Expected: FAIL with "I cannot find a `Shared.Theme` module".

**Step 3: Implement Theme module**

```elm
module Shared.Theme exposing (Theme(..), toggle, toString, fromString)


type Theme
    = Light
    | Dark


toggle : Theme -> Theme
toggle theme =
    case theme of
        Light ->
            Dark

        Dark ->
            Light


toString : Theme -> String
toString theme =
    case theme of
        Light ->
            "light"

        Dark ->
            "dark"


fromString : String -> Maybe Theme
fromString str =
    case str of
        "light" ->
            Just Light

        "dark" ->
            Just Dark

        _ ->
            Nothing
```

**Step 4: Verify test passes**

```bash
elm-test tests/ThemeTest.elm
```

Expected: All tests pass.

---

## Task 6: Update Main.elm with Styling

**Files:**
- Modify: `src/Main.elm`

**Step 1: Update Main.elm view**

```elm
module Main exposing (main)

import Browser
import Html exposing (Html, button, div, h1, p, text)
import Html.Attributes exposing (class, type_)
import Html.Events exposing (onClick)
import Shared.Theme as Theme


main : Program () Model Msg
main =
    Browser.element
        { init = init
        , update = update
        , subscriptions = subscriptions
        , view = view
        }



-- MODEL


type alias Model =
    { message : String
    , theme : Theme.Theme
    }


init : () -> ( Model, Cmd Msg )
init _ =
    ( { message = "Scientific Assistant"
      , theme = Theme.Light
      }
    , Cmd.none
    )



-- UPDATE


type Msg
    = ToggleTheme


update : Msg -> Model -> ( Model, Cmd Msg )
update msg model =
    case msg of
        ToggleTheme ->
            ( { model | theme = Theme.toggle model.theme }
            , Cmd.none
            )



-- SUBSCRIPTIONS


subscriptions : Model -> Sub Msg
subscriptions _ =
    Sub.none



-- VIEW


view : Model -> Html Msg
view model =
    div [ class "flex flex-col items-center justify-center h-screen gap-6" ]
        [ h1 [ class "text-4xl font-bold text-foreground" ]
            [ text model.message ]
        , p [ class "text-muted-foreground" ]
            [ text "Elm + Tauri" ]
        , button
            [ class "btn-primary px-4 py-2"
            , type_ "button"
            , onClick ToggleTheme
            ]
            [ text
                (case model.theme of
                    Theme.Light ->
                        "Switch to Dark"

                    Theme.Dark ->
                        "Switch to Light"
                )
            ]
        , div [ class "flex gap-4" ]
            [ div [ class "card p-4" ]
                [ p [ class "text-sm" ] [ text "Card component" ] ]
            , div [ class "badge-primary" ] [ text "Badge" ]
            ]
        ]
```

---

## Task 7: Add Theme Port for JS Sync

**Files:**
- Modify: `src/Main.elm`
- Modify: `ts/main.ts`

**Step 1: Add port to Main.elm**

Add at top of file:

```elm
port module Main exposing (main)
```

Add port declaration:

```elm
port setTheme : String -> Cmd msg
```

Update `update` function:

```elm
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
```

**Step 2: Update main.ts**

```typescript
// ts/main.ts
import { invoke } from "@tauri-apps/api/core";

declare global {
  interface Window {
    Elm: {
      Main: {
        init: (options: { node: HTMLElement }) => ElmApp;
      };
    };
  }
}

interface ElmPorts {
  setTheme: {
    subscribe: (callback: (theme: string) => void) => void;
  };
}

interface ElmApp {
  ports: ElmPorts;
}

function setTheme(theme: string): void {
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem("theme", theme);
}

async function initApp(): Promise<void> {
  const root = document.getElementById("app");
  if (!root) {
    throw new Error("Root element #app not found");
  }

  // Load saved theme
  const savedTheme = localStorage.getItem("theme") || "light";
  setTheme(savedTheme);

  // Initialize Elm
  const app = window.Elm.Main.init({ node: root });

  // Subscribe to theme changes
  app.ports.setTheme.subscribe(setTheme);

  // Test Tauri command
  const greeting = await invoke<string>("greet", { name: "Elm" });
  console.log(greeting);
}

document.addEventListener("DOMContentLoaded", initApp);
```

**Step 3: Verify build and theme switching**

```bash
npm run elm:build
npm run dev
```

Expected: App displays with styled components, theme toggle works.

---

## Task 8: Commit and Mark Complete

**Step 1: Commit**

```bash
git add -A
git commit -m "feat: add Tailwind CSS with shadcn design tokens

- Configure Tailwind with custom color tokens
- Add light/dark theme support via data-theme
- Create component classes (btn, input, card, badge)
- Add Theme module with toggle/fromString/toString
- Wire theme changes to JS via port

🤖 Generated with Claude Code"
```

**Step 2: Mark phase complete**

Edit `.claude/docs/plans/2025-12-13-elm-tauri-migration-design.md`:

Change line 16 from:
```
| 4 | Re-design | [ ] | `04-redesign-plan.md` |
```
To:
```
| 4 | Re-design | [x] | `04-redesign-plan.md` |
```

---

## Verification Checklist

- [ ] `npm run dev` starts without CSS errors
- [ ] Light theme displays correctly (light background)
- [ ] Dark theme displays correctly (dark background)
- [ ] Theme toggle button switches themes
- [ ] Theme persists in localStorage
- [ ] `.btn-primary`, `.card`, `.badge` classes work
- [ ] All Elm tests pass including ThemeTest
- [ ] No Tailwind warnings in console
