# Redesign Implementation Plan

**Goal:** Implement design system with Nature/Calm palette (teal accent), Nunito typography, and Tailwind CSS 4 for consistent, accessible styling.

**Design:** Nature-inspired calm palette. Soft gray-green light mode, warm dark mode. Teal accent. Nunito font with Cyrillic support. Full mobile and accessibility coverage. **Elevation-based** visual separation (shadows + z-index), not 1px borders.

**Architecture:** Design system as npm package (`infra/design-system/`). Tailwind CSS 4 for utilities. CSS custom properties for colors/spacing/elevation. Light/dark theme via `data-theme` attribute.

**Tech Stack:** Tailwind CSS 4.x, PostCSS, CSS custom properties, self-hosted fonts (Nunito + JetBrains Mono)

**Reference:** `docs/design-system.md`, `docs/plans/2025-12-13-elm-tauri-migration-design.md`

---

## Before Execution

1. ✅ **Invoke brainstorming skill** — Reviewed legacy UI (DaisyUI, Tailwind 4)
2. ✅ **Invoke frontend-design skill** — Analyzed Claude UI, created "Nature/Calm" direction
3. ✅ **Invoke theme-factory skill** — Defined teal/green palette, Nunito typography
4. ✅ **Analyze** — Reviewed legacy patterns (OKLCH colors, theme switching)
5. ✅ **Confirm** — User approved design (Nunito font, teal palette, better contrast)
6. ✅ **Apply writing-standard** — Design system doc follows writing standard
7. **Proceed** — Use executing-plans + test-driven-development skills

---

## Prerequisites

- Bootstrap phase complete
- Infrastructure phase complete
- Fonts downloaded (10 WOFF2 files, 112KB) in `bridge/src/assets/fonts/`
- `fonts.css` created in `bridge/src/assets/styles/`
- `docs/design-system.md` finalized

---

## Task 1: Create Design System Package

**Goal:** Set up `infra/design-system/` as npm package with CSS and fonts.

**Files:**
- Create: `infra/design-system/` directory
- Create: `infra/design-system/package.json`
- Move: `bridge/src/assets/fonts/` → `infra/design-system/assets/fonts/`
- Move: `bridge/src/assets/styles/fonts.css` → `infra/design-system/styles/fonts.css`

**Step 1: Create directory structure**

```bash
mkdir -p infra/design-system/styles
mkdir -p infra/design-system/assets/fonts
```

**Step 2: Move existing assets**

```bash
mv bridge/src/assets/fonts/* infra/design-system/assets/fonts/
mv bridge/src/assets/styles/fonts.css infra/design-system/styles/
```

**Step 3: Create package.json**

```json
{
  "name": "@scientific-assistant/design-system",
  "version": "1.0.0",
  "description": "Design system CSS and assets for Scientific Assistant",
  "main": "styles/main.css",
  "files": [
    "styles/**/*.css",
    "assets/**/*.woff2"
  ],
  "author": "Andrey Koppel",
  "license": "UNLICENSED",
  "private": true
}
```

**Step 4: Install as npm dependency in bridge**

Update `bridge/package.json`:
```json
{
  "dependencies": {
    "@scientific-assistant/design-system": "file:../../infra/design-system",
    "@tauri-apps/api": "^2.9.1"
  }
}
```

Install:
```bash
cd bridge
npm install
```

Expected: Package appears in `bridge/node_modules/@scientific-assistant/design-system/`

---

## Task 2: Create Design System CSS Files

**Goal:** Create tokens, base styles, and component classes in design system package.

**Files:**
- Create: `infra/design-system/styles/tokens.css`
- Create: `infra/design-system/styles/base.css`
- Create: `infra/design-system/styles/components.css`
- Create: `infra/design-system/styles/main.css`

**Step 1: Create tokens.css**

Define CSS custom properties for light and dark modes. See `docs/design-system.md` Color Palette section for exact values.

Required tokens:
- Backgrounds: `--color-bg`, `--color-bg-surface`, `--color-bg-muted`
- Text: `--color-text`, `--color-text-secondary`, `--color-text-muted`
- Primary: `--color-primary`, `--color-primary-hover`, `--color-primary-subtle`
- Borders: `--color-border`, `--color-border-strong` (ONLY for semantic emphasis, not separation)
- Semantic: `--color-error`, `--color-success` (with `-subtle` variants)
- Message bubbles: `--color-bubble-user`, `--color-bubble-assistant`
- **Elevation:** `--shadow-sm`, `--shadow-md`, `--shadow-lg` (replaces 1px borders for separation)
- **Z-index scale:** `--z-base`, `--z-elevated`, `--z-sticky`, `--z-dropdown`, `--z-overlay`, `--z-modal`, `--z-toast`, `--z-tooltip`
- Spacing, radius, transitions

Both `:root` (light) and `[data-theme="dark"]` (dark) modes.

**Step 2: Create base.css**

Base styles:
- Typography defaults: `font-family: 'Nunito'`, line-height, antialiasing
- Focus outline: Text color (not blue, works on all backgrounds)
- Scrollbar styling
- Selection color
- `prefers-reduced-motion` support
- **NO default border-color** (removed `*` selector with `border-color: var(--color-border)`)

**Step 3: Create components.css**

Component classes (see `docs/design-system.md` Components section):
- `.btn`, `.btn-primary`, `.btn-secondary`, `.btn-ghost`, `.btn-icon` (no borders)
- `.input`, `.textarea` (no borders, uses background contrast)
- `.message`, `.message-user`, `.message-assistant` (assistant has 3px left accent border ONLY)
- `.card` (with `z-index: var(--z-elevated)` and `box-shadow: var(--shadow-sm)`)
- `.badge`, `.badge-primary` (no borders)
- `.thinking` (thinking indicator, no borders)

**Elevation principle:** Use shadows + z-index for separation. Borders ONLY for semantic emphasis (blockquotes, assistant messages, hr).

**Step 4: Create main.css (entry point)**

```css
/* infra/design-system/styles/main.css */
@import './fonts.css';
@import './tokens.css';

/* Tailwind directives */
@import 'tailwindcss';

@import './base.css';
@import './components.css';
```

---

## Task 3: Configure Tailwind CSS

**Goal:** Set up Tailwind CSS 4 with PostCSS in design system package.

**Files:**
- Update: `bridge/package.json` (add Tailwind deps)
- Create: `infra/design-system/postcss.config.js`

**Step 1: Add Tailwind to bridge package.json**

```json
{
  "devDependencies": {
    "@eslint/js": "^9.16.0",
    "eslint-config-prettier": "^10.1.0",
    "typescript": "^5.9.3",
    "typescript-eslint": "^8.17.0",
    "vite": "^7.2.7",
    "vitest": "^4.0.15",
    "tailwindcss": "^4.0.0",
    "postcss": "^8.4.0",
    "autoprefixer": "^10.4.0"
  }
}
```

**Step 2: Create postcss.config.js in design-system**

```javascript
// infra/design-system/postcss.config.js
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
```

**Step 3: Install dependencies**

```bash
cd bridge
npm install
```

Expected: Tailwind, PostCSS, autoprefixer installed.

---

## Task 4: Update HTML and Vite Config

**Goal:** Import design system CSS in bridge app, configure Vite to process it.

**Files:**
- Create: `bridge/src/main.css`
- Modify: `bridge/src/main.ts`
- Modify: `bridge/index.html`
- Modify: `bridge/vite.config.ts`

**Step 1: Create bridge entry CSS**

```css
/* bridge/src/main.css */
@import '@scientific-assistant/design-system/styles/main.css';

/* App-specific styles (if needed) */
```

**Step 2: Import CSS in main.ts**

```typescript
// bridge/src/main.ts
import './main.css';  // Import CSS (Vite will process)

import * as TauriCore from '@tauri-apps/api/core';

// ... rest of existing code
```

**Step 3: Update index.html**

```html
<!DOCTYPE html>
<html lang="ru" data-theme="light">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Научный Ассистент</title>
  </head>
  <body>
    <div id="app"></div>
    <script src="/elm.js"></script>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
```

Note: Vite auto-injects CSS when imported in JS/TS.

**Step 4: Update vite.config.ts**

Add PostCSS config path:

```typescript
export default defineConfig({
  clearScreen: false,
  publicDir: "build",
  server: {
    port: 5173,
    strictPort: true,
    watch: {
      ignored: ["**/platform/**", "**/*.elm"],
    },
  },
  envPrefix: ["VITE_", "TAURI_"],
  build: {
    target: "esnext",
    minify: !process.env.TAURI_DEBUG ? "esbuild" : false,
    sourcemap: !!process.env.TAURI_DEBUG,
    outDir: "dist",
    rollupOptions: {
      external: (id) => id.endsWith(".elm"),
    },
  },
  css: {
    postcss: '../../infra/design-system/postcss.config.js',
  },
});
```

**Step 5: Test**

```bash
npm run dev
```

Expected: Dev server starts, CSS loads, no errors in console.

---

## Task 5: Create Theme.elm Module with Tests (TDD)

**Goal:** Create `view/src/Shared/Theme.elm` following test-driven development.

**Files:**
- Create: `view/tests/ThemeTest.elm`
- Create: `view/src/Shared/Theme.elm`

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
cd view
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

## Task 6: Create Shared/Icons.elm Module

**Goal:** Create icon library with 16 Heroicons and Size type.

**Files:**
- Create: `view/src/Shared/Icons.elm`

**Step 1: Define Size type and helper**

```elm
module Shared.Icons exposing
    ( Size(..)
    , send
    , attach
    , settings
    , sun
    , moon
    , trash
    , copy
    , check
    , close
    , plus
    , search
    , help
    , export
    , import_
    , chevronDown
    , chevronUp
    )

import Html exposing (Html)
import Svg exposing (svg, path)
import Svg.Attributes exposing (..)


type Size
    = Small
    | Medium
    | Large


sizeToClass : Size -> String
sizeToClass size =
    case size of
        Small ->
            "w-4 h-4"

        Medium ->
            "w-5 h-5"

        Large ->
            "w-6 h-6"
```

**Step 2: Implement icon functions**

Implement all 16 icon functions following this pattern:

```elm
send : Size -> Html msg
send size =
    svg
        [ fill "none"
        , viewBox "0 0 24 24"
        , strokeWidth "1.5"
        , stroke "currentColor"
        , class (sizeToClass size)
        ]
        [ path
            [ strokeLinecap "round"
            , strokeLinejoin "round"
            , d "M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5"
            ]
            []
        ]
```

Get SVG path data from Heroicons (https://heroicons.com) for:
- send, attach, settings, sun, moon, trash, copy, check, close, plus, search, help, export, import (rename to `import_`), chevronDown, chevronUp

**Note:** `import` is Elm keyword, use `import_` instead.

---

## Task 7: Update Main.elm with Styling

**Goal:** Update Main.elm to use design system classes and Theme module.

**Files:**
- Modify: `view/src/Main.elm`

**Step 1: Import modules**

```elm
port module Main exposing (main)

import Browser
import Html exposing (Html, button, div, h1, p, text)
import Html.Attributes exposing (class)
import Html.Events exposing (onClick)
import Shared.Theme as Theme
import Shared.Icons as Icons exposing (Size(..))
```

**Step 2: Update Model**

```elm
type alias Model =
    { message : String
    , theme : Theme.Theme
    }


init : () -> ( Model, Cmd Msg )
init _ =
    ( { message = "Научный Ассистент"
      , theme = Theme.Light
      }
    , Cmd.none
    )
```

**Step 3: Update Msg and update**

```elm
type Msg
    = ToggleTheme


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

**Step 4: Add port**

```elm
port setTheme : String -> Cmd msg
```

**Step 5: Update view with design system classes**

```elm
view : Model -> Html Msg
view model =
    div [ class "flex flex-col items-center justify-center h-screen gap-6 bg-background text-foreground" ]
        [ h1 [ class "text-4xl font-semibold" ]
            [ text model.message ]
        , p [ class "text-muted-foreground" ]
            [ text "Elm + Tauri + Tailwind" ]
        , button
            [ class "btn btn-primary flex items-center gap-2"
            , onClick ToggleTheme
            ]
            [ case model.theme of
                Theme.Light ->
                    Icons.moon Medium

                Theme.Dark ->
                    Icons.sun Medium
            , text
                (case model.theme of
                    Theme.Light ->
                        "Тёмная тема"

                    Theme.Dark ->
                        "Светлая тема"
                )
            ]
        , div [ class "flex gap-4" ]
            [ div [ class "card p-4" ]
                [ p [ class "text-sm" ] [ text "Card component" ] ]
            , div [ class "badge badge-primary" ] [ text "Badge" ]
            ]
        ]
```

---

## Task 8: Add Theme Port for JS Sync

**Goal:** Wire Elm theme changes to JavaScript for DOM attribute and localStorage.

**Files:**
- Modify: `bridge/src/main.ts`

**Step 1: Update TypeScript types**

```typescript
interface ElmPorts {
  setTheme: {
    subscribe: (callback: (theme: string) => void) => void;
  };
}

interface ElmApp {
  ports: ElmPorts;
}
```

**Step 2: Add theme functions**

```typescript
function setTheme(theme: string): void {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('theme', theme);
}

function loadTheme(): string {
  return localStorage.getItem('theme') || 'light';
}
```

**Step 3: Update initApp**

```typescript
async function initApp(): Promise<void> {
  const root = document.getElementById('app');
  if (!root) {
    throw new Error('Root element #app not found');
  }

  // Load saved theme
  const savedTheme = loadTheme();
  setTheme(savedTheme);

  // Initialize Elm
  const app = window.Elm.Main.init({ node: root });

  // Subscribe to theme changes
  app.ports.setTheme.subscribe(setTheme);

  // Test Tauri command
  const greeting = await TauriCore.invoke<string>('greet', { name: 'Elm' });
  console.log(greeting);
}
```

**Step 4: Test**

```bash
npm run dev
```

Expected:
- App loads with saved theme from localStorage
- Theme toggle button works
- Theme persists on reload

---

## Task 9: Create Documentation Site

**Goal:** Build static docs site with welcome page and design system showcase.

**Files:**
- Create: `docs/site/` directory
- Create: `docs/site/package.json`
- Create: `docs/site/default.nix`
- Create: `docs/site/src/index.html`
- Create: `docs/site/src/design-system.html`
- Create: `docs/site/src/styles.css`

**Step 1: Create directory structure**

```bash
mkdir -p docs/site/src
mkdir -p docs/site/dist
```

**Step 2: Create package.json**

```json
{
  "name": "@scientific-assistant/docs-site",
  "version": "1.0.0",
  "private": true,
  "dependencies": {
    "@scientific-assistant/design-system": "file:../../infra/design-system"
  }
}
```

**Step 3: Create welcome page**

Create `docs/site/src/index.html`:
- Header: "Научный Ассистент"
- Description: Desktop chat application for scientific work
- Navigation: Link to design system page
- Tech stack overview
- Links to GitHub, installation

**Step 4: Create design system showcase page**

Create `docs/site/src/design-system.html`:
- All color swatches (light + dark mode)
- Typography samples (all type scales with Russian text)
- All 16 icons (show Small, Medium, Large variants)
- Component showcase (buttons, inputs, messages, badges, cards with examples)
- Full chat interface mockup
- Theme toggle button

**Step 5: Create site styles**

```css
/* docs/site/src/styles.css */
@import '@scientific-assistant/design-system/styles/main.css';

/* Site navigation */
.docs-nav {
  display: flex;
  gap: 1rem;
  padding: 1rem 2rem;
  border-bottom: 1px solid var(--color-border);
  background: var(--color-bg-surface);
}

.docs-nav a {
  color: var(--color-primary);
  text-decoration: none;
  font-weight: 500;
}

.docs-nav a:hover {
  text-decoration: underline;
}
```

**Step 6: Create default.nix**

```nix
{ stdenv, nodejs }:
stdenv.mkDerivation {
  name = "scientific-assistant-docs-site";
  src = ./.;

  buildInputs = [ nodejs ];

  buildPhase = ''
    npm install
    mkdir -p $out
    cp -r src/* $out/
    cp -r node_modules $out/
  '';
}
```

**Step 7: Add to flake.nix packages**

```nix
packages.x86_64-linux.site = import ./docs/site { inherit (pkgs) stdenv nodejs; };
```

**Step 8: Install and test**

```bash
cd docs/site
npm install
xdg-open src/index.html
xdg-open src/design-system.html
```

Expected: Both pages load, design system styles applied, fonts work, theme toggle functions.

---

## Task 10: Convert Design System to Claude Skill

**Goal:** Create Claude skill from design-system.md for automatic LLM reference.

**Files:**
- Create: `.claude/skills/design-system/skill.md`

**Step 1: Create skill directory**

```bash
mkdir -p .claude/skills/design-system
```

**Step 2: Create skill.md**

```markdown
# Design System

Use when implementing UI components for Scientific Assistant.

## Scope

**Apply when:** Implementing new UI features, creating components, styling views, making design decisions.

**Do not apply when:** Working on non-UI code (Rust backend, TypeScript logic, build configuration).

## Process

1. Read design intent and constraints
2. Review component specifications
3. Implement following guidelines
4. Verify against implementation checklist

---

[Copy entire content of docs/design-system.md here]
```

**Step 3: Test skill**

In a new Claude session:
```
User: "Add a settings button to the header"
Claude: *invokes design-system skill*
        *uses correct colors, icons, spacing from guidelines*
```

---

## Task 11: Setup GitHub Pages Deployment

**Goal:** Deploy docs site to GitHub Pages with GitHub Actions.

**Files:**
- Create: `.github/workflows/deploy-docs.yml`

**Step 1: Create workflow**

```yaml
name: Deploy Documentation Site

on:
  push:
    branches: [main]
    paths:
      - 'docs/site/**'
      - 'infra/design-system/**'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Install Nix
        uses: cachix/install-nix-action@v31
        with:
          extra_nix_config: |
            experimental-features = nix-command flakes

      - name: Setup Cachix
        uses: cachix/cachix-action@v15
        with:
          name: scientific-assistant
          authToken: '${{ secrets.CACHIX_AUTH_TOKEN }}'

      - name: Build docs site
        run: nix build .#site

      - name: Deploy to GitHub Pages
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./result
```

**Step 2: Enable GitHub Pages**

Repository Settings → Pages → Source: `gh-pages` branch.

**Step 3: Test deployment**

```bash
git push
```

Expected: Workflow runs, deploys to `https://[username].github.io/scientific-assistant/`

---

## Task 12: Commit and Mark Complete

**Step 1: Commit**

```bash
git add -A
git commit -m "feat: implement design system with Nature/Calm palette

- Create infra/design-system npm package (CSS + fonts)
- Implement teal/green Nature/Calm color palette
- Self-host Nunito + JetBrains Mono fonts (112KB, Cyrillic support)
- Configure Tailwind CSS 4 with design tokens
- Create Shared.Theme module (Light/Dark with tests)
- Create Shared.Icons module (16 Heroicons, Size type)
- Wire theme changes via port to localStorage
- Create docs/site documentation website (2 pages)
- Add Claude skill for design system (.claude/skills/design-system/)
- Setup GitHub Pages deployment workflow
- Full mobile and accessibility support

🤖 Generated with Claude Code

Co-Authored-By: Claude <noreply@anthropic.com>"
```

**Step 2: Mark phase complete**

Edit `docs/plans/2025-12-13-elm-tauri-migration-design.md`:

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

### App Functionality
- [ ] `npm run dev` starts without CSS errors
- [ ] Light theme displays correctly (soft gray-green `#f0f3f2` background)
- [ ] Dark theme displays correctly (warm dark gray `#121412`, high contrast)
- [ ] Theme toggle button switches themes
- [ ] Theme persists in localStorage across reloads
- [ ] All Elm tests pass (`elm-test`)
- [ ] ThemeTest passes (toggle, toString, fromString)
- [ ] No Tailwind warnings in console

### Design System
- [ ] Design system package installed: `node_modules/@scientific-assistant/design-system/`
- [ ] Component classes work (`.btn-primary`, `.card`, `.badge`, `.message`)
- [ ] Fonts load offline from design-system package
- [ ] Icons render correctly using `Shared.Icons` module
- [ ] Icons use `Size` type (Small, Medium, Large - no defaults)
- [ ] `docs/site/src/index.html` loads (welcome page)
- [ ] `docs/site/src/design-system.html` showcases all components
- [ ] Docs site works offline (file:// protocol)
- [ ] Theme toggle works in docs site
- [ ] Nix build succeeds: `nix build .#site`

### Accessibility
- [ ] All interactive elements have 45px × 45px minimum touch targets
- [ ] Focus rings use text color (`var(--color-text)`), not browser default blue
- [ ] Icon-only buttons have `aria-label`
- [ ] Keyboard navigation works (Tab, Enter, Escape, Ctrl+Enter for send)
- [ ] Text contrast meets WCAG AA (verify with contrast checker)
- [ ] Focus management: Tab order follows visual layout

### Mobile
- [ ] Works on 320px width minimum
- [ ] Input text size ≥15px (no iOS zoom)
- [ ] Touch targets feel comfortable on mobile device
- [ ] Scrolling is smooth (momentum scrolling)

### Claude Skill
- [ ] `.claude/skills/design-system/skill.md` created
- [ ] Skill loads in new Claude session
- [ ] LLM can reference design guidelines when invoked
