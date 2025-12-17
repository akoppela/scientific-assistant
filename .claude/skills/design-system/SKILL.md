---
name: design-system
description: Use when implementing UI components - provides design tokens, component specifications, and accessibility guidelines for consistent styling
---

# Scientific Assistant Design System

Guidelines for consistent UI implementation with Nature/Calm teal palette.

## Implementation References

| Guideline           | Implementation Location                           |
|---------------------|---------------------------------------------------|
| Design system pkg   | `infra/design-system/` (npm package)              |
| Color tokens        | `infra/design-system/styles/tokens.css`           |
| Utility classes     | `infra/design-system/styles/utilities.css`        |
| Component styles    | `infra/design-system/styles/components.css`       |
| Markdown styles     | `infra/design-system/styles/markdown.css`         |
| Base styles         | `infra/design-system/styles/base.css`             |
| Font declarations   | `infra/design-system/styles/fonts.css`            |
| Font files          | `infra/design-system/assets/fonts/` (WOFF2 files) |
| Icon library        | `view/src/UI/Icons.elm`                           |
| Theme module        | `view/src/UI/Theme.elm`                           |
| Chart data (JSON)   | `landing/data/charts/` (ECharts format)           |
| **Visual showcase** | `landing/design-system.html`                      |

## Design Intent

Users read scientific content for extended periods (30+ minutes). Eye strain from bright backgrounds or low contrast reduces focus. This design reduces strain through muted backgrounds and nature-inspired tones.

**Requirements:**
1. Text must meet WCAG AA contrast (4.5:1 for body, 3:1 for large text) in both light and dark modes
2. Cyrillic (Russian) character support required for all UI text
3. No external dependencies (fonts, icons) - app works offline
4. Consistent visual hierarchy across all components
5. Mobile-friendly: Responsive layout, touch targets ≥45px, readable on small screens
6. Full accessibility: Keyboard navigation, screen reader support, ARIA labels, focus management

**Constraints:**
- Light mode background cannot be pure white (`#ffffff`) - maximum lightness `#f8f8f8`
- Dark mode background must use warm gray (hue 80-140°), not blue-gray (hue 200-240°)
- Primary accent color must work on both light and dark backgrounds
- No transitions on interactive states (buttons, inputs, links) - only theme switching animates (300ms slow ease)

**Design Choices:**

| Element          | Value                           | Rationale                                                                                            |
|------------------|---------------------------------|------------------------------------------------------------------------------------------------------|
| Color Palette    | Teal/green (`hsl(174°, ...)`)   | Green hue reduces eye strain vs blue/white. Teal sits between scientific (blue) and natural (green). |
| Typography       | Nunito                          | Geometric sans-serif with Cyrillic support. Rounded terminals soften screen glare vs sharp serifs.   |
| Light Background | `#f0f3f2` (96% lightness)       | Reduces glare vs `#ffffff`. Subtle green tint (`174° hue`) ties to primary color.                    |
| Dark Background  | `#121412` (8% lightness, warm)  | High contrast with text (`#f2f5f2`). Warm hue prevents clinical blue-gray feel.                      |
| Accent (Light)   | `#0f766e`                       | Muted enough to not distract, bright enough for 4.5:1 contrast on light backgrounds.                 |
| Accent (Dark)    | `#14b8a6`                       | Brighter than light mode (perceptual compensation), maintains visibility on dark.                    |
| Icons            | Heroicons outline, 1.5px stroke | Monochrome, `currentColor` inheritance. LLMs have Heroicons paths in training data.                  |
| Spacing          | 3px base unit                   | Base-3 scale: 3px, 6px, 9px, 12px... up to 72px grid column unit. All values divisible by 3.         |

**Excluded:**
- Pure white backgrounds (`#ffffff`) in light mode
- Cold blue-grays (hue 200-240°) in dark mode
- Accent colors with saturation >60% (too aggressive)
- Transitions on interactive states (buttons, inputs, links)
- Emoji in UI chrome (allowed in user-generated content only)
- 1px borders for visual separation (use elevation instead)

## Design Tokens & Tailwind Integration

**Approach:** Work **with** Tailwind, not against it. Use `@theme` to configure Tailwind's base-3 system, then add semantic utility classes for theme-aware colors.

**In `@theme` (Tailwind uses natively):**
- `--spacing: 0.1875rem` (3px) - ALL Tailwind utilities use base-3 (`gap-8` = 24px, `p-4` = 12px, etc.)
- `--text-*` font sizes (12px, 15px, 18px, 24px, 30px, 36px, 48px, 60px, 72px)
- `--radius-*` border radius (3px, 6px, 9px, 12px, 15px, 18px, full) - enables `rounded-lg`, `rounded-xl`, etc.

**In `:root` / `[data-theme="dark"]` (theme-aware):**
- Color tokens that change between light/dark mode
- Shadow tokens (different opacity for dark mode)
- Custom spacing tokens (`--space-*`) for specific component use
- Z-index scale, typography, sizes, widths, opacity, etc.

**In `utilities.css` (Tailwind-style theme-aware classes):**
- Background utilities: `.bg-background`, `.bg-surface`, `.bg-muted`, `.bg-primary`, etc.
- Text utilities: `.text-foreground`, `.text-secondary`, `.text-tertiary`, `.text-primary`, etc.
- Border utilities: `.border-default`, `.border-strong`, `.border-primary`
- Shadow utilities: `.shadow-sm`, `.shadow-md`, `.shadow-lg`

**Token categories:**
- **Colors:** Backgrounds, text, primary accent, borders, semantic (error/success), message bubbles
- **Spacing:** Base-3 scale via Tailwind (`--spacing: 0.1875rem`) + custom tokens for components
- **Border radius:** Base-3 via Tailwind (`rounded-xs` through `rounded-2xl`)
- **Typography:** Font families, sizes, weights, line heights
- **Grid:** Use Tailwind utilities (`grid`, `grid-cols-{n}`, `gap-{n}`) + `.container` component
- **Elevation:** Shadows (via utilities) + Z-index scale (tokens only, no utilities)
- **Opacity:** Disabled (0.45), active (0.75), scrollbar (0.3, 0.6), pulse animation (0.3)
- **Borders:** Accent (3px solid teal) - ONLY for semantic emphasis, never separation
- **Transitions:** Fast (150ms), slow (300ms) - only for theme switching
- **Animations:** Fast (300ms), slow (1.5s), slide distance (9px)
- **Focus ring:** 3px outline with 3px offset

## Color Palette

Nature-inspired, calming palette with teal accent. Easy on eyes for extended use.

### Light Mode

```css
:root {
  /* Backgrounds */
  --color-bg: #f0f3f2;               /* Page background - soft gray-green */
  --color-bg-surface: #f8faf9;       /* Cards, elevated surfaces */
  --color-bg-muted: #e6ebe9;         /* Input backgrounds, subtle areas */

  /* Text */
  --color-text: #1a2e2e;             /* Primary text - dark teal */
  --color-text-secondary: #5a7070;   /* Secondary text */
  --color-text-muted: #7a9090;       /* Placeholder, disabled */
  --color-text-inverse: #f0f3f2;     /* Text on dark backgrounds - soft white */

  /* Primary accent - Teal */
  --color-primary: #0f766e;          /* Primary actions, links - teal-700 */
  --color-primary-hover: #115e59;    /* Primary hover state - teal-800 */
  --color-primary-subtle: #ccfbf1;   /* Primary backgrounds */

  /* Borders */
  --color-border: #d1dede;           /* Default borders */
  --color-border-strong: #a8bfbf;    /* Emphasized borders */

  /* Semantic */
  --color-error: #dc2626;
  --color-error-subtle: #fef2f2;
  --color-success: #16a34a;
  --color-success-subtle: #f0fdf4;

  /* Message bubbles */
  --color-bubble-user: #dce9e7;      /* User message background */
  --color-bubble-assistant: #f8faf9; /* Assistant message background */
}
```

### Dark Mode

```css
[data-theme="dark"] {
  /* Backgrounds */
  --color-bg: #121412;               /* Page background - deeper dark gray */
  --color-bg-surface: #1c1f1c;       /* Cards, elevated surfaces */
  --color-bg-muted: #262a26;         /* Input backgrounds, subtle areas */

  /* Text */
  --color-text: #f2f5f2;             /* Primary text - brighter white */
  --color-text-secondary: #b0b8b0;   /* Secondary text - lighter */
  --color-text-muted: #808880;       /* Placeholder, disabled */

  /* Primary accent - Teal (brighter for dark mode) */
  --color-primary: #14b8a6;          /* Primary actions, links - teal-500 */
  --color-primary-hover: #2dd4bf;    /* Primary hover state - teal-400 */
  --color-primary-subtle: #134e4a;   /* Primary backgrounds */

  /* Borders */
  --color-border: #3a3e3a;           /* Default borders - more visible */
  --color-border-strong: #4a4e4a;    /* Emphasized borders */

  /* Semantic */
  --color-error: #f87171;
  --color-error-subtle: #450a0a;
  --color-success: #4ade80;
  --color-success-subtle: #052e16;

  /* Message bubbles */
  --color-bubble-user: #262a26;      /* User message background */
  --color-bubble-assistant: #1c1f1c; /* Assistant message background */
}
```

### Color Usage Rules

1. **Never use raw hex values** - Always reference CSS variables
2. **Primary color** - Use sparingly for CTAs, links, active states
3. **Text hierarchy** - `text` → `text-secondary` → `text-muted`
4. **Backgrounds** - `bg` (page) → `bg-surface` (cards) → `bg-muted` (inputs)
5. **Text inverse** - Use for text on colored backgrounds (primary buttons)

### Global Styles

**Text Selection:**
- Background: `--color-primary` (teal)
- Text: `--color-bg` (page background color for contrast)
- Works on all backgrounds including subtle colors

**Theme Transitions:**
- No transitions by default (prevents animation on page load)
- JavaScript adds `.theme-transitions-enabled` class after load
- Only body background/color animate (300ms) when toggling theme

## Typography

### Font Stack

| Role    | Font           | Weights  | Fallback              |
|---------|----------------|----------|-----------------------|
| Display | Nunito         | 500, 600 | system-ui, sans-serif |
| Body    | Nunito         | 400, 500 | system-ui, sans-serif |
| Mono    | JetBrains Mono | 400, 500 | monospace             |

**Why Nunito:** Rounded geometric sans-serif, excellent readability, full Cyrillic support (Russian).

### Type Scale

| Name        | Size              | Weight | Line Height | Usage                                |
|-------------|-------------------|--------|-------------|--------------------------------------|
| display     | 2.25rem (36px)    | 600    | 1.2         | Welcome screen title                 |
| heading-1   | 1.5rem (24px)     | 600    | 1.2         | Page/modal headers                   |
| heading-2   | 1.125rem (18px)   | 600    | 1.2         | Section headers                      |
| body        | 0.9375rem (15px)  | 400    | 1.5         | Message content, paragraph text      |
| body-medium | 0.9375rem (15px)  | 500    | 1.5         | Button text, emphasized inline text  |
| small       | 0.9375rem (15px)  | 400    | 1.5         | Input labels, secondary descriptions |
| tiny        | 0.75rem (12px)    | 500    | 1.2         | Badges, metadata                     |
| mono        | 0.9375rem (15px)  | 400    | 1.5         | Code blocks, technical text          |

## Border Radius Scale

Consistent rounding based on element size and interaction level:

| Token           | Value  | Tailwind       | Usage                                                          |
|-----------------|--------|----------------|----------------------------------------------------------------|
| `--radius-xs`   | 3px    | `rounded-xs`   | Inline code, links (subtle, inline elements)                   |
| `--radius-sm`   | 6px    | `rounded-sm`   | Tables, code blocks, message bubble tails (content containers) |
| `--radius-md`   | 9px    | `rounded-md`   | Buttons, inputs (interactive controls)                         |
| `--radius-lg`   | 12px   | `rounded-lg`   | Cards (large surfaces)                                         |
| `--radius-xl`   | 15px   | `rounded-xl`   | Message bubbles, thinking indicator (emphasis)                 |
| `--radius-2xl`  | 18px   | `rounded-2xl`  | Reserved for future use                                        |
| `--radius-full` | 9999px | `rounded-full` | Badges, dots, pills (fully rounded)                            |

**Guidelines:**
- **Smaller elements/inline** → Smaller radius (xs, sm)
- **Standard UI components** → Medium radius (md, lg)
- **Chat/messaging elements** → Larger radius (xl) for friendliness
- **Pills/circular** → Full radius

## Grid System

**Architecture:** 12-column CSS Grid system based on 72px column unit with responsive breakpoints.

### Container

Responsive container with max-width and padding:

| Property          | Value                           | Usage                     |
|-------------------|---------------------------------|---------------------------|
| Max-width         | `--container-max` (1440px)      | 20 × 72px column units    |
| Padding (mobile)  | `--container-padding` (24px)    | Mobile/tablet padding     |
| Padding (desktop) | `--container-padding-lg` (48px) | Desktop padding (1024px+) |

**Usage:**
```html
<div class="container">
  <!-- Content automatically centered with responsive padding -->
</div>
```

### Grid & Columns

Use Tailwind's grid utilities with semantic gutter classes:

| Class               | Description                        |
|---------------------|------------------------------------|
| `.grid`             | Enable CSS Grid                    |
| `.grid-cols-{1-12}` | Number of equal columns            |
| `md:grid-cols-{n}`  | Responsive columns at 768px+       |
| `lg:grid-cols-{n}`  | Responsive columns at 1024px+      |
| `.gap-gutter`       | Default gutter both axes (24px)    |
| `.gap-x-gutter`     | Column gap only (24px horizontal)  |
| `.gap-y-gutter`     | Row gap only (24px vertical)       |
| `.gap-gutter-sm`    | Small gutter both axes (12px)      |
| `.gap-x-gutter-sm`  | Small column gap (12px horizontal) |
| `.gap-y-gutter-sm`  | Small row gap (12px vertical)      |

**Common Patterns:**
```html
<!-- Two equal columns with default gutter (24px) -->
<div class="grid grid-cols-2 gap-gutter">
  <div class="card">Left</div>
  <div class="card">Right</div>
</div>

<!-- Different horizontal/vertical gaps -->
<div class="grid grid-cols-2 gap-x-gutter gap-y-gutter-sm">
  <div class="card">Card 1</div>
  <div class="card">Card 2</div>
  <div class="card">Card 3</div>
  <div class="card">Card 4</div>
</div>

<!-- Three columns with small gutter (12px) -->
<div class="grid grid-cols-3 gap-gutter-sm">
  <div class="card">Card 1</div>
  <div class="card">Card 2</div>
  <div class="card">Card 3</div>
</div>

<!-- Responsive: 1 column mobile, 2 tablet, 3 desktop -->
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-gutter">
  <div class="card">Card 1</div>
  <div class="card">Card 2</div>
  <div class="card">Card 3</div>
</div>
```

### Flex Column Layouts

Use flex column with gutter gaps instead of margins between elements:

| Class                         | Description                          |
|-------------------------------|--------------------------------------|
| `flex flex-col gap-gutter-lg` | Sections within a page (30px gap)    |
| `flex flex-col gap-gutter-sm` | Elements within a section (12px gap) |
| `flex flex-col gap-gutter-xs` | Tight spacing within cards (6px gap) |

**When to use flex column vs margins:**
- **Use flex column + gap:** For consistent spacing between sibling elements (sections, headings with content, card internals)
- **Use margins:** For one-off spacing adjustments or asymmetric spacing

**Common Patterns:**
```html
<!-- Page layout: sections with large gaps -->
<main class="flex flex-col gap-gutter-lg">
  <section class="flex flex-col gap-gutter-sm">
    <h2>Section Title</h2>
    <p>Description text</p>
    <div class="grid grid-cols-2 gap-gutter">...</div>
  </section>
  <section class="flex flex-col gap-gutter-sm">
    <h2>Another Section</h2>
    <p>More content</p>
  </section>
</main>

<!-- Card with tight internal spacing -->
<div class="card flex flex-col gap-gutter-xs">
  <div class="h-24 bg-primary rounded-lg"></div>
  <p class="font-mono">Token name</p>
  <p class="text-xs text-tertiary">Description</p>
</div>
```

**Benefits:**
- Eliminates margin collapse issues
- Consistent spacing without remembering `mb-*` values
- Easier to maintain and refactor
- Visual rhythm is defined by container, not individual elements

### Breakpoints

Mobile-first responsive breakpoints (hardcoded in media queries - CSS custom properties cannot be used in `@media` rules):

| Name      | Min-width | Rem Value | Typical Device   | Media Query                 |
|-----------|-----------|-----------|------------------|-----------------------------|
| (default) | 0px       | 0rem      | Mobile portrait  | (no media query)            |
| `sm`      | 640px     | 40rem     | Mobile landscape | `@media (min-width: 40rem)` |
| `md`      | 768px     | 48rem     | Tablet           | `@media (min-width: 48rem)` |
| `lg`      | 1024px    | 64rem     | Laptop           | `@media (min-width: 64rem)` |
| `xl`      | 1280px    | 80rem     | Desktop          | `@media (min-width: 80rem)` |
| `2xl`     | 1536px    | 96rem     | Large desktop    | `@media (min-width: 96rem)` |

**Important:** Use rem values in media queries (e.g., `40rem` not `640px`) to respect user browser font size settings for accessibility.

### Utility Classes

Theme-aware utility classes that automatically adapt to light/dark mode:

**Background Utilities:**
- `.bg-background` - Page background color
- `.bg-surface` - Card/surface background
- `.bg-muted` - Input/muted backgrounds
- `.bg-primary` - Primary teal accent
- `.bg-primary-hover` - Primary hover state
- `.bg-primary-subtle` - Light primary background

**Text Utilities:**
- `.text-foreground` - Primary text color
- `.text-secondary` - Secondary text
- `.text-tertiary` - Muted/placeholder text
- `.text-inverse` - Text on dark/colored backgrounds
- `.text-primary` - Primary accent text

**Border Utilities:**
- `.border-default` - Default border color
- `.border-strong` - Emphasized border
- `.border-primary` - Primary accent border

**Shadow Utilities:**
- `.shadow-sm` - Small elevation (cards)
- `.shadow-md` - Medium elevation (dropdowns)
- `.shadow-lg` - Large elevation (modals)

**Gutter Utilities (both axes):**
- `.gap-gutter-xs` - Extra small gap (6px)
- `.gap-gutter-sm` - Small gap (12px)
- `.gap-gutter` - Default gap (24px)
- `.gap-gutter-lg` - Large gap (30px)

**Row Gap Utilities (vertical):**
- `.gap-y-gutter-xs` - Extra small row gap (6px)
- `.gap-y-gutter-sm` - Small row gap (12px)
- `.gap-y-gutter` - Default row gap (24px)
- `.gap-y-gutter-lg` - Large row gap (30px)

**Column Gap Utilities (horizontal):**
- `.gap-x-gutter-xs` - Extra small column gap (6px)
- `.gap-x-gutter-sm` - Small column gap (12px)
- `.gap-x-gutter` - Default column gap (24px)
- `.gap-x-gutter-lg` - Large column gap (30px)

### Grid Tokens

| Token                    | Value  | Usage               |
|--------------------------|--------|---------------------|
| `--grid-columns`         | 12     | Number of columns   |
| `--grid-gutter-xs`       | 6px    | Extra small gutter  |
| `--grid-gutter-sm`       | 12px   | Small gutter        |
| `--grid-gutter`          | 24px   | Default gutter      |
| `--grid-gutter-lg`       | 30px   | Large gutter        |
| `--width-grid-column`    | 72px   | Single column unit  |
| `--container-max`        | 1440px | Max container width |
| `--container-padding`    | 24px   | Mobile padding      |
| `--container-padding-lg` | 48px   | Desktop padding     |

## Elevation System

**Design Philosophy:** Use elevation (shadows + z-index), not 1px borders, for visual separation. Borders are ONLY for semantic emphasis (accent bars on blockquotes, assistant messages, horizontal rules).

### Shadows

Three elevation levels using subtle shadows:

| Level  | Token         | Usage                    | Light Mode Shadow                                                   | Dark Mode Shadow                                                |
|--------|---------------|--------------------------|---------------------------------------------------------------------|-----------------------------------------------------------------|
| Small  | `--shadow-sm` | Cards, elevated surfaces | `0 3px 3px rgba(26, 46, 46, 0.06)`                                  | `0 3px 3px rgba(0, 0, 0, 0.21)`                                 |
| Medium | `--shadow-md` | Dropdowns, popovers      | `0 6px 6px -3px rgba(26, 46, 46, 0.09), 0 3px 6px -3px rgba(...)`   | `0 6px 6px -3px rgba(0, 0, 0, 0.27), 0 3px 6px -3px rgba(...)`  |
| Large  | `--shadow-lg` | Modals, dialogs          | `0 12px 15px -3px rgba(26, 46, 46, 0.09), 0 6px 9px -3px rgba(...)` | `0 12px 15px -3px rgba(0, 0, 0, 0.3), 0 6px 9px -3px rgba(...)` |

**Rationale:**
- Subtle shadows (6% opacity in light mode) create depth without visual noise
- Dark mode uses darker shadows (21-30% opacity) for contrast on dark backgrounds
- All shadow offsets are base-3 multiples (3px, 6px, 9px, 12px, 15px)

### Z-Index Scale

Predictable stacking order using base-100 increments:

| Layer    | Token          | Z-Index | Usage                                      |
|----------|----------------|---------|--------------------------------------------|
| Base     | `--z-base`     | 0       | Default layer - page content               |
| Elevated | `--z-elevated` | 100     | Cards, surfaces (with shadow-sm)           |
| Sticky   | `--z-sticky`   | 200     | Sticky headers, fixed navigation           |
| Dropdown | `--z-dropdown` | 300     | Dropdowns, popovers, context menus         |
| Overlay  | `--z-overlay`  | 400     | Modal backdrops (semi-transparent overlay) |
| Modal    | `--z-modal`    | 500     | Modal dialogs, lightboxes                  |
| Toast    | `--z-toast`    | 600     | Toast notifications                        |
| Tooltip  | `--z-tooltip`  | 700     | Tooltips (highest priority)                |

**Usage Rules:**
1. **Never use arbitrary z-index values** - Always use tokens
2. **Pair z-index with appropriate shadow** - Higher z-index = larger shadow (usually)
3. **Only use z-index when stacking context is needed** - Don't add it by default
4. **Modals use `--z-modal` + `--shadow-lg`**
5. **Position context required** - Add `position: relative/fixed/absolute` when using z-index

**Example:**
```css
/* Basic card - no z-index needed */
.card {
  box-shadow: var(--shadow-sm);
}

/* Modal - needs z-index for stacking */
.modal {
  position: fixed;
  z-index: var(--z-modal);
  box-shadow: var(--shadow-lg);
}

/* Dropdown - needs to overlay content */
.dropdown {
  position: absolute;
  z-index: var(--z-dropdown);
  box-shadow: var(--shadow-md);
}
```

### Borders (Semantic Only)

Borders are ONLY for semantic emphasis, never for separation:

| Token                  | Value                                             | Usage                                       |
|------------------------|---------------------------------------------------|---------------------------------------------|
| `--border-accent`      | `0.1875rem solid var(--color-primary)` (3px teal) | Blockquotes, assistant message left bar, hr |
| `--border-width-thick` | `0.375rem` (6px)                                  | Future use (strong emphasis)                |

**Examples of correct border usage:**
- ✅ Assistant message left accent bar (`border-left: var(--border-accent)`)
- ✅ Blockquote left accent bar (`border-left: var(--border-accent)`)
- ✅ Horizontal rule (`border-top: var(--border-accent)`)

**Examples of incorrect border usage:**
- ❌ Card separation (use shadow instead)
- ❌ Input outlines (use focus ring instead)
- ❌ Section dividers (use background color contrast or shadow instead)
- ❌ Table cell borders (use zebra striping instead)

## Animation Library

Reusable animations for entrance, exit, and feedback. All use base-3 timing and distances.

### Available Animations

| Animation | Class                | Duration | Use Case                   |
|-----------|----------------------|----------|----------------------------|
| Fade In   | `.animate-fade-in`   | 300ms    | Modals, overlays, toasts   |
| Fade Out  | `.animate-fade-out`  | 300ms    | Dismissing elements        |
| Scale In  | `.animate-scale-in`  | 300ms    | Dropdowns, popovers        |
| Scale Out | `.animate-scale-out` | 300ms    | Closing dropdowns          |
| Shake     | `.animate-shake`     | 300ms    | Form validation error      |
| Slide Up  | (on `.message`)      | 300ms    | Message entrance           |
| Pulse     | (on `.thinking-dot`) | 1.5s     | Loading/thinking indicator |
| Spin      | `.animate-spin`      | 1.5s     | Loading spinner, refresh   |

### Animation Tokens

| Token                       | Value | Usage                         |
|-----------------------------|-------|-------------------------------|
| `--duration-animation-fast` | 300ms | Entrance/exit, feedback       |
| `--duration-animation-slow` | 1.5s  | Continuous (pulse, loading)   |
| `--distance-slide`          | 9px   | Slide/shake distance (base-3) |

### Usage

```html
<!-- Entrance animation -->
<div class="modal animate-fade-in">...</div>

<!-- Exit animation (use forwards to keep final state) -->
<div class="dropdown animate-scale-out">...</div>

<!-- Error feedback -->
<input class="input animate-shake" />
```

### Guidelines

1. **Entrance:** Use `fade-in` or `scale-in` for appearing elements
2. **Exit:** Use `fade-out` or `scale-out` with `forwards` fill mode (already applied in classes)
3. **Feedback:** Use `shake` sparingly for validation errors
4. **No transitions on interactive states** - Animations are for element appearance/disappearance only

### Spinner

Circular loading indicator with three size variants.

**Structure:**
```html
<div class="spinner"></div>
<div class="spinner spinner-sm"></div>
<div class="spinner spinner-lg"></div>
```

**Specifications:**
- Default size: 24px × 24px (`var(--space-8)`)
- Small size: 15px × 15px (`var(--space-5)`)
- Large size: 36px × 36px (`var(--space-12)`)
- Border: `var(--color-border)` with `var(--color-primary)` top
- Animation: 1.5s linear infinite spin

**Usage:**
- Loading states in buttons, cards, or containers
- `ds-chart` elements show spinner automatically via `:empty::before` pseudo-element

## Icons

**Library:** Heroicons (outline) - defined in `view/src/UI/Icons.elm`

**Icon sizes** (custom type):
```elm
type Size
    = Small   -- 15px - compact UI, chevrons
    | Medium  -- 18px - standard buttons, toolbar
    | Large   -- 24px - emphasis, empty states
```

Each function accepts `Size` parameter (explicit sizing required):

| Function      | Usage                 | Typical Size  |
|---------------|-----------------------|---------------|
| `send`        | Send message button   | Medium (18px) |
| `attach`      | File attachment       | Medium (18px) |
| `settings`    | Settings button       | Medium (18px) |
| `sun`         | Light theme toggle    | Medium (18px) |
| `moon`        | Dark theme toggle     | Medium (18px) |
| `trash`       | Clear conversation    | Medium (18px) |
| `copy`        | Copy to clipboard     | Medium (18px) |
| `check`       | Success, copied state | Small (15px)  |
| `close`       | Close, dismiss        | Medium (18px) |
| `plus`        | Add, new item         | Medium (18px) |
| `search`      | Search toggle         | Medium (18px) |
| `help`        | Help button           | Medium (18px) |
| `export`      | Export session        | Medium (18px) |
| `import_`     | Import session        | Medium (18px) |
| `chevronDown` | Expand section        | Small (15px)  |
| `chevronUp`   | Collapse section      | Small (15px)  |

### Usage in Elm

```elm
import UI.Icons as Icons exposing (Size(..))

-- Button with icon (standard size)
button [ class "btn btn-primary", onClick SendMessage ]
    [ Icons.send Medium
    , text "Отправить"
    ]

-- Icon-only button
button [ class "btn btn-icon btn-ghost", onClick ShowHelp ]
    [ Icons.help Medium ]
```

## Components

**Location:** Component styles defined in `infra/design-system/styles/components.css`

### Button

**Variants:**
- **btn-primary:** Primary action (send message, confirm). Uses `--color-primary` background.
- **btn-secondary:** Alternate action (cancel, dismiss). Uses `--color-bg-muted` background.
- **btn-ghost:** Toolbar icons, non-critical actions. Transparent background, visible on hover.
- **btn-icon:** Icon-only modifier. Reduces padding, adds `min-width: 45px`.
- **btn-sm:** Small size modifier. Compact buttons for dense UI areas.

**Specifications (default):**
- Padding: 9px × 12px (`var(--space-3)` × `var(--space-4)`)
- Font size: 15px (`var(--font-size-sm)`), weight 500 (`var(--font-weight-medium)`)
- Border radius: 9px (`var(--radius-md)`)
- Min height: 45px (`var(--size-touch-target)`)
- Gap: 6px (`var(--space-2)`) between icon and text
- No transitions (instant state changes)

**Specifications (btn-sm):**
- Padding: 6px × 9px (`var(--space-2)` × `var(--space-3)`)
- Font size: 12px (`var(--font-size-xs)`)
- Min height: auto (no minimum)
- Gap: 3px (`var(--space-1)`) between icon and text

**States:**
- **Hover:** Background color changes per variant
- **Active:** Opacity 0.75 (instant press feedback)

### Input

**Specifications:**
- Padding: 9px × 12px (`var(--space-3)` × `var(--space-4)`)
- Font size: 15px (`var(--font-size-base)`)
- Border radius: 9px (`var(--radius-md)`)
- Background: `--color-bg-muted` (contrast with page background provides visual separation)
- Border: none
- Min height: 45px (`var(--size-touch-target)`)

**States:**
- **Focus:** Text color outline with 3px gap (border stays unchanged, no transition)
- **Disabled:** Opacity 0.45 (faded appearance)

### Message Bubble

**Variants:**
- **message-user:** Right-aligned, user's sent message. Background: `--color-bubble-user`
- **message-assistant:** Left-aligned, AI response. Background: `--color-bubble-assistant`, 3px left accent bar

**Specifications:**
- Max width: 75% (`var(--width-message-max)`)
- Padding:
  - User: 9px × 12px (`var(--space-3)` × `var(--space-4)`)
  - Assistant: 12px × 15px (`var(--space-4)` × `var(--space-5)`)
- Border radius: 15px (`var(--radius-xl)`) except tail corner: 6px (`var(--radius-sm)`)
- Line height: 1.5 (`var(--line-height-normal)`)
- Animation: 300ms (`var(--duration-animation-fast)`) slide-up (fade in from 9px below on message arrival)

### Card

Convenient utility class that combines elevation styling.

**Specifications:**
- Background: `--color-bg-surface` (`.bg-surface`)
- Border: none
- Border radius: 12px (`var(--radius-lg)` or `.rounded-lg`)
- Padding: 18px (`var(--space-6)` or `.p-6`)
- Shadow: `--shadow-sm` (`.shadow-sm`)

**Equivalent Tailwind classes:**
```html
<div class="bg-surface rounded-lg shadow-sm p-6">
  <!-- Same as .card -->
</div>
```

**When to use `.card` vs Tailwind utilities:**
- Use `.card` for consistent card styling with one class
- Use Tailwind utilities when you need variations (different padding, radius, etc.)

### Badge

**Variants:**
- **badge (default):** Neutral. Uses `--color-bg-muted`
- **badge-primary:** Attention-drawing. Uses `--color-primary-subtle`

**Specifications:**
- Padding: 3px × 12px (`var(--space-1)` × `var(--space-4)`)
- Font size: 12px (`var(--font-size-xs)`), weight 500 (`var(--font-weight-medium)`)
- Border radius: Full pill (`var(--radius-full)`)

### Thinking Indicator

**Specifications:**
- Display: `inline-flex` with `align-self: flex-start` (shrinks to content width)
- Background: `--color-bg-surface`
- Border: none
- Border radius: 15px (`var(--radius-xl)`)
- Padding: 9px × 12px (`var(--space-3)` × `var(--space-4)`)
- Font size: 15px (`var(--font-size-sm)`)
- Color: `--color-text-muted`
- Gap: 9px (`var(--space-3)`) between dot and text
- Animated dot: 6px (`var(--space-2)`) circle with pulse animation (1.5s ease-in-out infinite, opacity 1 → 0.3 → 1)

### Textarea

**Extends `.input` base styles with:**
- Min height: 45px (`var(--size-touch-target)`)
- Max height: 204px (`var(--size-textarea-max)`) - approximately 8 lines
- Resize: none (use JavaScript auto-grow pattern)
- Line height: 1.5 (`var(--line-height-normal)`)

### Checkbox

**Structure:**
```html
<label class="checkbox">
  <input type="checkbox" class="checkbox-input" />
  <span class="checkbox-label">Label text</span>
</label>
```

**Specifications:**
- Control size: 18px × 18px (`var(--size-checkbox)`)
- Check mark: 3px × 6px rotated border (45°)
- Border radius: 3px (`var(--radius-xs)`)
- Gap: 9px (`var(--space-3)`) between control and label
- Background: `--color-bg-muted` (unchecked) → `--color-primary` (checked)
- Min height: 45px (`var(--size-touch-target)`) for click area

**States:**
- **Unchecked:** Muted background, no check mark
- **Checked:** Primary background with white check mark
- **Disabled:** Opacity 0.45 on both control and label
- **Error:** Error subtle background with error border

### Radio

**Structure:**
```html
<label class="radio">
  <input type="radio" name="group" class="radio-input" />
  <span class="radio-label">Label text</span>
</label>
```

**Specifications:**
- Control size: 18px × 18px (`var(--size-checkbox)`)
- Inner dot: 9px (`var(--size-checkbox-mark)`) when selected
- Border radius: Full circle (`var(--radius-full)`)
- Gap: 9px (`var(--space-3)`) between control and label
- Background: `--color-bg-muted` (unselected) → `--color-primary` (selected)
- Min height: 45px (`var(--size-touch-target)`) for click area

**States:**
- **Unselected:** Muted background, no dot
- **Selected:** Primary background with white centered dot
- **Disabled:** Opacity 0.45 on both control and label
- **Error:** Error subtle background with error border

### Range Slider

**Structure:**
```html
<input type="range" class="range" min="0" max="100" value="50" />
```

**Specifications:**
- Track height: 6px (`var(--space-2)`)
- Track background: `--color-bg-muted`
- Track border radius: Full pill (`var(--radius-full)`)
- Thumb size: 18px (`var(--size-checkbox)`)
- Thumb background: `--color-primary`
- Thumb border radius: Full circle (`var(--radius-full)`)

**States:**
- **Default:** Muted track, teal thumb
- **Disabled:** Opacity 0.45

### Select

**Structure:**
```html
<select class="select">
  <option value="">Select an option...</option>
  <option value="1">Option 1</option>
</select>
```

**Specifications:**
- Padding: 9px right-30px left-12px (`var(--space-3)` × `var(--space-10)` × `var(--space-4)`)
- Font size: 15px (`var(--font-size-base)`)
- Border radius: 9px (`var(--radius-md)`)
- Background: `--color-bg-muted`
- Arrow: Chevron down SVG (18px), positioned 9px from right
- Min height: 45px (`var(--size-touch-target)`)

**States:**
- **Default:** Muted background with chevron arrow
- **Disabled:** Opacity 0.45, no pointer
- **Error:** Error subtle background with error border

### Form Validation

**Input states (add to `.input`, `.select`, `.checkbox-input`, `.radio-input`):**
- `.input-error`: Error subtle background with 3px error border (inset box-shadow)
- `.input-success`: Success subtle background with 3px success border (inset box-shadow)

**Helper text classes:**
- `.form-hint`: Muted text (12px) below input for guidance
- `.form-error`: Error text (12px) for validation messages
- `.form-success`: Success text (12px) for success feedback

**Form group structure:**
```html
<div class="form-group">
  <label class="form-label form-label-required">Email</label>
  <input type="email" class="input input-error" />
  <p class="form-error">Please enter a valid email address</p>
</div>
```

**Specifications:**
- `.form-group`: Flex column with 6px gap (`var(--space-2)`)
- `.form-label`: 15px medium weight text
- `.form-label-required`: Adds red asterisk after label
- Helper text: 12px, margin-top 3px

### Markdown

**Container class:** `.markdown`

**Purpose:** Styles rendered markdown content (AI responses, scientific papers, documentation).

**Supported elements:**
- **Headings (h1-h3):** 24px, 18px, 15px with proper spacing
- **Paragraphs:** Bottom margin for readability
- **Lists (ul, ol):** Disc/decimal markers, 18px left indent
- **Code:** Inline (`code`) with muted background, blocks (`pre`) with scroll
- **Blockquotes:** Teal accent bar, italic secondary text
- **Tables:** Full-width with header background
- **Horizontal rules:** Teal accent line
- **Text formatting:** Bold, italic, strikethrough, links

**Specifications:**
- Container: Apply `.markdown` class to wrapping div
- Spacing: All first-child elements have no top margin, all last-child have no bottom margin
- Headings: h1 (24px), h2 (18px), h3 (15px) with proper vertical rhythm
- Code: 12px monospace with muted background, 3px border radius (inline), 6px border radius (blocks)
- Blockquote: 3px left accent bar, 12px left padding
- Table: 6px border radius, headers use `--color-border` background, zebra striping on even rows, no borders between rows
- All spacing: Base-3 tokens

**Table specifications:**
- Min-width: 600px (ensures readability, triggers horizontal scroll on mobile)
- Header background: `--color-border` (subtle gray)
- Zebra striping: Even rows use `--color-table-stripe` (2.7% semi-transparent overlay - adapts to any background)
- Row hover: Background changes to `--color-primary-subtle` (teal highlight for interactivity)
- **Mobile:** Always wrap tables in `<div class="overflow-x-auto">` for horizontal scrolling

**Usage:**
```html
<div class="markdown">
  <h1>Title</h1>
  <p>Content with <code>inline code</code>.</p>
  <pre><code>Block code</code></pre>

  <!-- Table with mobile scrolling -->
  <div class="overflow-x-auto">
    <table>
      <thead>
        <tr><th>Column 1</th><th>Column 2</th></tr>
      </thead>
      <tbody>
        <tr><td>Data 1</td><td>Data 2</td></tr>
      </tbody>
    </table>
  </div>
</div>
```

### Link

**Default behavior:**
- All `<a>` elements automatically styled (no class required)
- Color: `--color-primary` (teal)
- Text decoration: underline
- No transitions (instant state changes)

**States:**
- **Default:** Teal color with underline
- **Hover:** Darker teal (`--color-primary-hover`), no underline
- **Active:** Opacity 0.75 (instant press feedback)
- **Focus:** Text color outline with 6px gap, no underline

**Specifications:**
- Color: `var(--color-primary)`
- Hover color: `var(--color-primary-hover)`
- No transitions (instant feedback)
- Focus ring: 3px solid text color with 3px offset (universal contrast)
- Border radius: 3px (`var(--radius-xs)`)

### Anchor Link

**Class:** `.header-anchor`

**Purpose:** Linkable section headers with `#` indicator positioned outside content flow.

**Structure:**
```html
<h2 id="section-name" class="...">
  <a href="#section-name" class="header-anchor">Section Title</a>
</h2>
```

**States:**
- **Default:** `#` hidden, text inherits heading color
- **Hover (header or link):** `#` visible, text and `#` turn teal
- **Focus:** `#` visible

**Specifications:**
- `#` position: Absolute, left of text (`right: 100%`), vertically centered
- `#` spacing: 6px (`var(--space-2)`) from text
- `#` color: `--color-text-muted` → `--color-primary` on hover
- `#` visibility: Opacity 0 → 1 with 150ms transition (`var(--duration-fast)`)
- Text color: Inherit → `--color-primary` on hover
- ID format: kebab-case on heading element (e.g., `id="color-palette"`)

### Focus Ring

**Design Goal:**
Universal focus indicator that works on all backgrounds (light, dark, colored buttons) without clipping or artifacts.

**Utility class:** `.focus-ring`

**Applied automatically to:**
- All focusable elements (`:focus-visible`)
- Links (`a:focus-visible`)
- Inputs (`.input:focus`)
- Buttons (all variants)

**Specifications:**
- Outline: 3px solid text color (`--color-text`)
- Outline offset: 6px (gap between element and ring)
- No shadow/glow (prevents artifacts and clipping)
- No transitions (instant appearance for immediate feedback)
- Uses `outline` (not `box-shadow`) to prevent clipping at container edges

**Why text color:**
- Light mode: Dark teal (`#1a2e2e`) shows clearly on light backgrounds
- Dark mode: Light gray (`#f2f5f2`) shows clearly on dark backgrounds
- Provides contrast on colored buttons (teal primary buttons get visible dark/light ring)
- Meets WCAG 3:1 contrast requirement against adjacent colors

**CSS Tokens:**
```css
--focus-ring-outline: 0.1875rem solid var(--color-text); /* 3px */
--focus-ring-offset: 0.375rem; /* 6px */
--focus-ring-shadow: none;
```

**Implementation:**
```css
:focus-visible {
  outline: var(--focus-ring-outline);
  outline-offset: var(--focus-ring-offset);
  box-shadow: var(--focus-ring-shadow);
}
```

**Manual usage:**
```html
<div tabindex="0" class="focus-ring">Custom focusable element</div>
```

**Rationale:**
- `outline` never gets clipped (unlike `box-shadow`)
- Text color adapts to theme (dark/light) automatically
- 3px offset (base-3) keeps focus ring tight to element
- 3px outline (base-3) provides strong visibility
- Simple implementation = no visual glitches or corner artifacts

### Charts

**Purpose:** Data visualization for scientific graphs and charts using ECharts library.

**Library:** [ECharts](https://echarts.apache.org/) (Apache ECharts 5.x)

**Implementation:**
- Chart data stored as JSON files in `landing/data/charts/`
- ECharts options format with `colorIndex` for theme-aware colors
- Runtime color application from CSS variables (light/dark mode support)
- 18 chart types supported: line, bar, pie, donut, scatter, area, histogram, boxplot, heatmap, radar, errorbar, bubble, violin, waterfall, funnel, gauge, treemap, sankey

**Container structure:**
```html
<div class="chart">
  <div id="chart-line" class="chart-canvas" style="height: 260px"></div>
</div>
```

**Container specifications:**
- `.chart`: Card-like container with surface background, 12px radius, small shadow, 18px padding
- `.chart-canvas`: Full width wrapper with explicit height for ECharts

**Data color palette (9 colors, theme-aware):**

| Token            | Light Mode | Dark Mode | Name           |
|------------------|------------|-----------|----------------|
| `--color-data-1` | `#0f766e`  | `#14b8a6` | Teal (primary) |
| `--color-data-2` | `#d97706`  | `#fbbf24` | Amber          |
| `--color-data-3` | `#4f46e5`  | `#818cf8` | Indigo         |
| `--color-data-4` | `#e11d48`  | `#fb7185` | Rose           |
| `--color-data-5` | `#059669`  | `#34d399` | Emerald        |
| `--color-data-6` | `#7c3aed`  | `#a78bfa` | Purple         |
| `--color-data-7` | `#0284c7`  | `#38bdf8` | Sky            |
| `--color-data-8` | `#ea580c`  | `#fb923c` | Orange         |
| `--color-data-9` | `#db2777`  | `#f472b6` | Pink           |

**ECharts color mapping:**
Use `colorIndex` property (0-8) in JSON data. Runtime applies CSS variable colors:
```json
{
  "series": [
    { "name": "Moscow", "type": "line", "data": [20, 40, 35], "colorIndex": 0 },
    { "name": "Sochi", "type": "line", "data": [10, 25, 50], "colorIndex": 1 }
  ]
}
```

**Theme integration:**
- Colors read from CSS variables at runtime via `getComputedStyle()`
- MutationObserver watches `data-theme` attribute for live theme switching
- Title, legend, axis labels, grid lines all use theme colors

**Chart data location:** `landing/data/charts/*.json`

## Responsive Design Patterns

**Mobile-first approach:** Design for mobile (320px+) first, then enhance for larger screens.

**Common responsive patterns:**

```html
<!-- Color swatches: 1 col mobile → 2 cols tablet → 4 cols desktop -->
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-gutter">
  <div class="card">Swatch 1</div>
  <div class="card">Swatch 2</div>
  <div class="card">Swatch 3</div>
  <div class="card">Swatch 4</div>
</div>

<!-- Cards: 1 col mobile → 2 cols tablet+ -->
<div class="grid grid-cols-1 md:grid-cols-2 gap-gutter">
  <div class="card">Card 1</div>
  <div class="card">Card 2</div>
</div>

<!-- Icons: 4 cols mobile → 8 cols tablet+ -->
<div class="grid grid-cols-4 md:grid-cols-8 gap-gutter">
  <div class="card">Icon 1</div>
  <!-- ... -->
</div>
```

**Tables on mobile:**
- Always wrap tables in `<div class="overflow-x-auto">`
- Table has `min-width: 600px` to maintain readability
- Table scrolls horizontally on narrow screens

**Container usage:**
- Automatically responsive (24px padding mobile, 48px desktop)
- Max-width: 1440px, centered with `margin: auto`

## Implementation Checklist

Every new UI component must satisfy:

### Visual Design
- [ ] Uses CSS variables from `tokens.css` (no raw hex/rgb values)
- [ ] Component renders correctly in both `data-theme="light"` and `data-theme="dark"`
- [ ] All spacing values are multiples of 3px (base-3 system)
- [ ] Border radius matches design system (3px, 6px, 9px, 12px, 15px, 18px, or full)

### Elevation
- [ ] NO 1px borders for separation (use shadows + background contrast instead)
- [ ] Borders ONLY for semantic emphasis (blockquotes, assistant messages, hr)
- [ ] Cards use `box-shadow: var(--shadow-sm)` (no z-index unless overlaying)
- [ ] Z-index uses scale tokens (never arbitrary values)
- [ ] Only add z-index when stacking context is needed (modals, dropdowns, tooltips)

### Typography
- [ ] All text uses Nunito or JetBrains Mono (no fallback-only rendering)
- [ ] Font sizes use `rem` units (not `px`)

### Icons
- [ ] Icons imported from `UI.Icons` module (no inline SVG paths in view code)
- [ ] Icons use `Size` type parameter (Small, Medium, or Large - no defaults)
- [ ] Icon SVGs use `stroke="currentColor"` (verify color inheritance)

### Interactive States
- [ ] Interactive elements have `:hover` and `:focus-visible` states
- [ ] Focus outlines use text color (`var(--color-text)`), not browser default blue
- [ ] Disabled states use `opacity: 0.45` and `pointer-events: none`

### Accessibility
- [ ] Touch targets ≥45px × 45px (verify on mobile)
- [ ] Text contrast meets WCAG AA (4.5:1 for body, 3:1 for large)
- [ ] Icon-only buttons have `aria-label`
- [ ] Form inputs have associated labels
- [ ] Keyboard navigation works (Tab, Enter, Escape)

### Mobile
- [ ] Responsive: Works on 320px width minimum
- [ ] Input font size ≥15px (prevents iOS zoom)
- [ ] Textareas implement auto-grow (45px min, 204px max)
