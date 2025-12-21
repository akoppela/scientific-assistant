# Main Shell Implementation Plan

**Goal:** Create the main application shell with Header (title + settings menu) and basic chat input area.

**Architecture:**
- `<ds-menu>` Web Component using native HTML `popover` attribute
- Trigger button outside component, linked by ID
- Menu items passed as JSON property (icon as SVG string)
- `item-click` custom event for handling selections
- ARIA managed by Web Component (`aria-expanded` on trigger)
- CSS handles responsive design: bottom sheet on mobile, dropdown on desktop
- No Elm state needed for menu open/close (native popover handles it)
- Icons use `zwilias/elm-html-string` for single source of truth

**Tech Stack:** Elm 0.19.1, TypeScript, Tailwind CSS, Web Components

**Reference:** `docs/plans/2025-12-13-elm-tauri-migration-design.md`

---

## Before Execution

1. **Invoke brainstorming skill** — Review this plan and existing shell implementation
2. **Analyze** — Check `../legacy/src/components/Header.tsx` for header structure
3. **Analyze** — Check `../legacy/src/components/InputArea.tsx` for input patterns
4. **Confirm** — User confirms plan accuracy before proceeding
5. **Proceed** — Use executing-plans + test-driven-development skills

---

## Prerequisites

- Bootstrap phase complete
- Redesign phase complete
- i18n phase complete
- Menu CSS added to design system (completed)

---

## Task 1: Install zwilias/elm-html-string

**Files:**
- Modify: `view/elm.json`

**Step 1: Install package**

```bash
cd view && elm install zwilias/elm-html-string
```

---

## Task 2: Refactor UI.Icons to use Html.String

**Files:**
- Modify: `view/src/UI/Icons.elm`

**Step 1: Update imports and types**

```elm
{- This Source Code Form is subject to the terms of the Mozilla Public
   License, v. 2.0. If a copy of the MPL was not distributed with this
   file, You can obtain one at https://mozilla.org/MPL/2.0/.
-}


module UI.Icons exposing
    ( Icon
    , Size(..)
    , chevronDown
    , chevronUp
    , globe
    , help
    , moon
    , send
    , settings
    , sun
    , toHtml
    , toString
    )

{-| Icon library using Heroicons (outline, 1.5px stroke).

Icons are defined using Html.String for dual output:
- `toHtml` for regular Elm views
- `toString` for Web Components (e.g., ds-menu)

-}

import Html
import Html.String as HS
import Html.String.Attributes as HSA


{-| Icon type using Html.String for serialization support.
-}
type alias Icon =
    HS.Html Never


{-| Icon size variants.
-}
type Size
    = Small -- 15px
    | Medium -- 18px
    | Large -- 24px


{-| Convert icon to Html for Elm views.
-}
toHtml : Size -> Icon -> Html.Html msg
toHtml size icon =
    icon
        |> HS.map never
        |> HS.toHtml
        |> wrapWithSize size


{-| Convert icon to String for Web Components.
-}
toString : Size -> Icon -> String
toString size icon =
    HS.toString 0 (wrapSvg size icon)


wrapWithSize : Size -> Html.Html msg -> Html.Html msg
wrapWithSize size html =
    -- The SVG already has width/height from wrapSvg
    html


wrapSvg : Size -> Icon -> HS.Html Never
wrapSvg size icon =
    let
        sizeValue =
            case size of
                Small ->
                    "15"

                Medium ->
                    "18"

                Large ->
                    "24"
    in
    HS.node "svg"
        [ HSA.attribute "xmlns" "http://www.w3.org/2000/svg"
        , HSA.attribute "fill" "none"
        , HSA.attribute "viewBox" "0 0 24 24"
        , HSA.attribute "stroke-width" "1.5"
        , HSA.attribute "stroke" "currentColor"
        , HSA.attribute "width" sizeValue
        , HSA.attribute "height" sizeValue
        ]
        [ icon ]
```

**Step 2: Define icons as path elements**

```elm
{-| Moon icon (dark mode).
-}
moon : Icon
moon =
    HS.node "path"
        [ HSA.attribute "stroke-linecap" "round"
        , HSA.attribute "stroke-linejoin" "round"
        , HSA.attribute "d" "M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z"
        ]
        []


{-| Sun icon (light mode).
-}
sun : Icon
sun =
    HS.node "path"
        [ HSA.attribute "stroke-linecap" "round"
        , HSA.attribute "stroke-linejoin" "round"
        , HSA.attribute "d" "M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z"
        ]
        []


{-| Globe icon (language).
-}
globe : Icon
globe =
    HS.node "path"
        [ HSA.attribute "stroke-linecap" "round"
        , HSA.attribute "stroke-linejoin" "round"
        , HSA.attribute "d" "M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5a17.92 17.92 0 0 1-8.716-2.247m0 0A8.966 8.966 0 0 1 3 12c0-1.97.633-3.794 1.708-5.282"
        ]
        []


{-| Help icon (question mark).
-}
help : Icon
help =
    HS.node "path"
        [ HSA.attribute "stroke-linecap" "round"
        , HSA.attribute "stroke-linejoin" "round"
        , HSA.attribute "d" "M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 5.25h.008v.008H12v-.008Z"
        ]
        []


{-| Settings icon (gear).
-}
settings : Icon
settings =
    HS.node "path"
        [ HSA.attribute "stroke-linecap" "round"
        , HSA.attribute "stroke-linejoin" "round"
        , HSA.attribute "d" "M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28ZM15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
        ]
        []


{-| Send icon (paper plane).
-}
send : Icon
send =
    HS.node "path"
        [ HSA.attribute "stroke-linecap" "round"
        , HSA.attribute "stroke-linejoin" "round"
        , HSA.attribute "d" "M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5"
        ]
        []


{-| Chevron down icon.
-}
chevronDown : Icon
chevronDown =
    HS.node "path"
        [ HSA.attribute "stroke-linecap" "round"
        , HSA.attribute "stroke-linejoin" "round"
        , HSA.attribute "d" "m19.5 8.25-7.5 7.5-7.5-7.5"
        ]
        []


{-| Chevron up icon.
-}
chevronUp : Icon
chevronUp =
    HS.node "path"
        [ HSA.attribute "stroke-linecap" "round"
        , HSA.attribute "stroke-linejoin" "round"
        , HSA.attribute "d" "m4.5 15.75 7.5-7.5 7.5 7.5"
        ]
        []
```

**Step 3: Update existing code that uses Icons**

Update `Main.elm` and any other files using Icons to use new API:

```elm
-- Before:
Icons.settings Icons.Medium

-- After:
Icons.toHtml Icons.Medium Icons.settings
```

---

## Task 3: Create ds-menu Web Component

**Files:**
- Create: `infra/design-system/src/ts/menu.ts`
- Modify: `infra/design-system/src/ts/index.ts`

**Step 1: Create menu Web Component (no icon registry)**

Create `infra/design-system/src/ts/menu.ts`:

```typescript
// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

/**
 * Menu item configuration.
 * Icon is passed as SVG string (from Elm's Icons.toString).
 */
export interface MenuItem {
  id: string;
  type: 'action' | 'divider';
  icon?: string; // SVG string
  label?: string;
  suffix?: string;
}

/**
 * ds-menu Web Component.
 *
 * Uses native HTML popover for open/close behavior.
 * Manages ARIA attributes on the associated trigger.
 * Renders menu items from the `items` property.
 * Dispatches `item-click` custom event when an item is clicked.
 *
 * @example
 * ```html
 * <button id="settings-trigger" popovertarget="settings-menu">Settings</button>
 * <ds-menu id="settings-menu" popover trigger="settings-trigger"></ds-menu>
 * ```
 */
export class DsMenu extends HTMLElement {
  private _items: MenuItem[] = [];
  private _trigger: HTMLElement | null = null;

  static get observedAttributes(): string[] {
    return ['trigger'];
  }

  connectedCallback(): void {
    this.setupTrigger();
    this.setupPopover();
    this.render();
  }

  disconnectedCallback(): void {
    this.removeEventListener('toggle', this.handleToggle);
  }

  attributeChangedCallback(name: string, _oldValue: string, newValue: string): void {
    if (name === 'trigger') {
      this.setupTrigger(newValue);
    }
  }

  get items(): MenuItem[] {
    return this._items;
  }

  set items(value: MenuItem[]) {
    this._items = value;
    this.render();
  }

  private setupTrigger(triggerId?: string): void {
    const id = triggerId ?? this.getAttribute('trigger');
    if (!id) return;

    this._trigger = document.getElementById(id);
    if (this._trigger) {
      this._trigger.setAttribute('aria-haspopup', 'menu');
      this._trigger.setAttribute('aria-expanded', 'false');
    }
  }

  private setupPopover(): void {
    this.addEventListener('toggle', this.handleToggle);
  }

  private handleToggle = (event: Event): void => {
    const toggleEvent = event as ToggleEvent;
    if (this._trigger) {
      this._trigger.setAttribute(
        'aria-expanded',
        toggleEvent.newState === 'open' ? 'true' : 'false'
      );
    }
  };

  private render(): void {
    this.setAttribute('role', 'menu');
    this.className = 'menu';

    this.innerHTML = `
      <div class="menu-header">
        <div class="menu-handle"></div>
      </div>
      ${this._items.map(item => this.renderItem(item)).join('')}
    `;

    // Add click handlers to action items
    this.querySelectorAll('[data-item-id]').forEach(el => {
      el.addEventListener('click', () => {
        const itemId = (el as HTMLElement).dataset.itemId;
        this.hidePopover();
        this.dispatchEvent(new CustomEvent('item-click', {
          detail: { id: itemId },
          bubbles: true,
        }));
      });
    });
  }

  private renderItem(item: MenuItem): string {
    if (item.type === 'divider') {
      return '<div class="menu-divider" role="separator"></div>';
    }

    // Icon is already an SVG string from Elm
    const iconHtml = item.icon
      ? `<span class="menu-item-icon">${item.icon}</span>`
      : '';

    const suffixHtml = item.suffix
      ? `<span class="menu-item-suffix">${item.suffix}</span>`
      : '';

    return `
      <button class="menu-item" role="menuitem" data-item-id="${item.id}">
        ${iconHtml}
        <span class="menu-item-text">${item.label ?? ''}</span>
        ${suffixHtml}
      </button>
    `;
  }
}

/**
 * Register the ds-menu custom element.
 */
export function registerMenu(): void {
  if (!customElements.get('ds-menu')) {
    customElements.define('ds-menu', DsMenu);
  }
}
```

**Step 2: Export from design system**

Update `infra/design-system/src/ts/index.ts` to export menu:

```typescript
export * from './menu';
```

**Step 3: Add tests**

Create `infra/design-system/src/ts/__tests__/menu.test.ts`:

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { DsMenu, registerMenu } from '../menu';

describe('DsMenu', () => {
  beforeEach(() => {
    registerMenu();
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('registers as custom element', () => {
    expect(customElements.get('ds-menu')).toBe(DsMenu);
  });

  it('sets aria-haspopup on trigger', () => {
    document.body.innerHTML = `
      <button id="trigger">Open</button>
      <ds-menu id="menu" popover trigger="trigger"></ds-menu>
    `;
    const trigger = document.getElementById('trigger');
    expect(trigger?.getAttribute('aria-haspopup')).toBe('menu');
  });

  it('renders menu items with SVG icons', () => {
    document.body.innerHTML = `
      <button id="trigger">Open</button>
      <ds-menu id="menu" popover trigger="trigger"></ds-menu>
    `;
    const menu = document.getElementById('menu') as DsMenu;
    menu.items = [
      { id: 'theme', type: 'action', icon: '<svg><path d="M1 2"/></svg>', label: 'Dark theme' },
      { id: 'divider', type: 'divider' },
      { id: 'help', type: 'action', icon: '<svg><path d="M3 4"/></svg>', label: 'Help' },
    ];

    expect(menu.querySelectorAll('.menu-item').length).toBe(2);
    expect(menu.querySelectorAll('.menu-divider').length).toBe(1);
    expect(menu.querySelector('.menu-item-icon svg')).toBeTruthy();
  });

  it('dispatches item-click event', async () => {
    document.body.innerHTML = `
      <button id="trigger">Open</button>
      <ds-menu id="menu" popover trigger="trigger"></ds-menu>
    `;
    const menu = document.getElementById('menu') as DsMenu;
    menu.items = [{ id: 'test-action', type: 'action', label: 'Test' }];

    const clickPromise = new Promise<string>(resolve => {
      menu.addEventListener('item-click', (e: Event) => {
        resolve((e as CustomEvent).detail.id);
      });
    });

    const button = menu.querySelector('[data-item-id="test-action"]') as HTMLElement;
    button.click();

    expect(await clickPromise).toBe('test-action');
  });
});
```

**Step 4: Verify tests pass**

```bash
cd infra/design-system && npm test
```

---

## Task 4: Add Menu Showcase to design-system.html

**Files:**
- Modify: `landing/design-system.html`
- Modify: `landing/src/design-system.ts`

**Step 1: Add menu showcase section**

Add after the existing component sections in `design-system.html`:

```html
<!-- Menu -->
<section class="flex flex-col gap-gutter-sm">
  <h2 id="menu" class="text-xl font-semibold">
    <a href="#menu" class="header-anchor">Menu</a>
  </h2>
  <p class="text-secondary">
    Dropdown menu (desktop) / bottom sheet (mobile) using native popover.
  </p>

  <div class="flex gap-gutter items-start">
    <!-- Settings menu example -->
    <div class="relative">
      <button
        id="demo-settings-trigger"
        popovertarget="demo-settings-menu"
        class="btn btn-ghost btn-icon"
        aria-label="Settings"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-[18px] h-[18px]">
          <path stroke-linecap="round" stroke-linejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
          <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
        </svg>
      </button>
      <ds-menu
        id="demo-settings-menu"
        popover
        trigger="demo-settings-trigger"
      ></ds-menu>
    </div>
  </div>
</section>
```

**Step 2: Initialize menu in TypeScript**

Update `landing/src/design-system.ts` to set menu items:

```typescript
import { registerMenu, type MenuItem } from '@scientific-assistant/design-system';

// Register menu component
registerMenu();

// SVG icons for demo (in real app, these come from Elm)
const moonSvg = '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" width="18" height="18"><path stroke-linecap="round" stroke-linejoin="round" d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z" /></svg>';
const globeSvg = '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" width="18" height="18"><path stroke-linecap="round" stroke-linejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5a17.92 17.92 0 0 1-8.716-2.247m0 0A8.966 8.966 0 0 1 3 12c0-1.97.633-3.794 1.708-5.282" /></svg>';
const helpSvg = '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" width="18" height="18"><path stroke-linecap="round" stroke-linejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 5.25h.008v.008H12v-.008Z" /></svg>';

// Initialize demo menu
document.addEventListener('DOMContentLoaded', () => {
  const menu = document.getElementById('demo-settings-menu') as HTMLElement & { items: MenuItem[] };
  if (menu) {
    menu.items = [
      { id: 'theme', type: 'action', icon: moonSvg, label: 'Dark theme' },
      { id: 'language', type: 'action', icon: globeSvg, label: 'Russian', suffix: 'RU' },
      { id: 'divider', type: 'divider' },
      { id: 'help', type: 'action', icon: helpSvg, label: 'Help' },
    ];

    menu.addEventListener('item-click', (e: Event) => {
      console.log('Menu item clicked:', (e as CustomEvent).detail.id);
    });
  }
});
```

---

## Task 5: Create UI/Menu.elm Helper Module

**Files:**
- Create: `view/src/UI/Menu.elm`

**Step 1: Create Menu helper module**

```elm
{- This Source Code Form is subject to the terms of the Mozilla Public
   License, v. 2.0. If a copy of the MPL was not distributed with this
   file, You can obtain one at https://mozilla.org/MPL/2.0/.
-}


module UI.Menu exposing (Item(..), view)

{-| Menu component using ds-menu Web Component.

Uses native HTML popover for open/close behavior.
ARIA managed by Web Component.

-}

import Html
import Html.Attributes as Attrs
import Html.Events as Events
import Json.Decode as Decode
import Json.Encode as Encode
import UI.Icons as Icons


{-| Menu item configuration.
-}
type Item
    = Action
        { id : String
        , icon : Icons.Icon
        , label : String
        , suffix : Maybe String
        }
    | Divider


{-| Render a menu with associated trigger.

The trigger must be rendered separately with matching IDs.

    -- Trigger (render separately)
    Html.button
        [ Attrs.id "settings-trigger"
        , Attrs.attribute "popovertarget" "settings-menu"
        ]
        [ Icons.toHtml Icons.Medium Icons.settings ]

    -- Menu
    Menu.view
        { id = "settings-menu"
        , triggerId = "settings-trigger"
        , onItemClick = MenuItemClicked
        , items = [ ... ]
        }

-}
view :
    { id : String
    , triggerId : String
    , onItemClick : String -> msg
    , items : List Item
    }
    -> Html.Html msg
view config =
    Html.node "ds-menu"
        [ Attrs.id config.id
        , Attrs.attribute "popover" ""
        , Attrs.attribute "trigger" config.triggerId
        , Attrs.property "items" (encodeItems config.items)
        , Events.on "item-click" (decodeItemClick config.onItemClick)
        ]
        []


{-| Encode menu items to JSON for the Web Component.
-}
encodeItems : List Item -> Encode.Value
encodeItems items =
    Encode.list encodeItem items


encodeItem : Item -> Encode.Value
encodeItem item =
    case item of
        Action { id, icon, label, suffix } ->
            Encode.object
                ([ ( "id", Encode.string id )
                 , ( "type", Encode.string "action" )
                 , ( "icon", Encode.string (Icons.toString Icons.Medium icon) )
                 , ( "label", Encode.string label )
                 ]
                    ++ (case suffix of
                            Just s ->
                                [ ( "suffix", Encode.string s ) ]

                            Nothing ->
                                []
                       )
                )

        Divider ->
            Encode.object
                [ ( "id", Encode.string "divider" )
                , ( "type", Encode.string "divider" )
                ]


{-| Decode item-click custom event.
-}
decodeItemClick : (String -> msg) -> Decode.Decoder msg
decodeItemClick toMsg =
    Decode.at [ "detail", "id" ] Decode.string
        |> Decode.map toMsg
```

---

## Task 6: Add i18n Translations (COMPLETED)

Translations already added in previous session:
- `help` / "Помощь"
- `settings` / "Настройки"
- `askQuestion` / "Задайте вопрос..."
- `send` / "Отправить"

---

## Task 7: Refactor Main.elm with Shell Layout

**Files:**
- Modify: `view/src/Main.elm`

**Step 1: Update Model (no menuOpen needed)**

```elm
type alias Model =
    { theme : Theme.Theme
    , language : I18n.Language
    , inputText : String
    }
```

**Step 2: Add new messages**

```elm
type Msg
    = ToggleTheme
    | ToggleLanguage
    | MenuItemClicked String
    | InputChanged String
    | SendClicked
```

**Step 3: Update init**

```elm
init : Flags -> ( Model, Cmd Msg )
init flags =
    let
        theme =
            flags.savedTheme
                |> Maybe.andThen Theme.fromString
                |> Maybe.withDefault Theme.default

        language =
            flags.savedLanguage
                |> Maybe.andThen I18n.languageFromString
                |> Maybe.withDefault I18n.defaultLanguage
    in
    ( { theme = theme
      , language = language
      , inputText = ""
      }
    , Cmd.none
    )
```

**Step 4: Update update function**

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

        ToggleLanguage ->
            let
                newLanguage =
                    I18n.toggleLanguage model.language
            in
            ( { model | language = newLanguage }
            , setLanguage (I18n.languageToString newLanguage)
            )

        MenuItemClicked itemId ->
            case itemId of
                "toggle-theme" ->
                    update ToggleTheme model

                "toggle-language" ->
                    update ToggleLanguage model

                "help" ->
                    -- TODO: Show help overlay in future phase
                    ( model, Cmd.none )

                _ ->
                    ( model, Cmd.none )

        InputChanged text ->
            ( { model | inputText = text }, Cmd.none )

        SendClicked ->
            if canSend model then
                -- TODO: Send message to API in future phase
                ( { model | inputText = "" }, Cmd.none )

            else
                ( model, Cmd.none )


canSend : Model -> Bool
canSend model =
    String.trim model.inputText /= ""
```

**Step 5: Subscriptions (simplified - no Escape needed)**

```elm
subscriptions : Model -> Sub Msg
subscriptions _ =
    Sub.none
```

**Step 6: Add imports**

```elm
import Json.Decode as Decode
import UI.Menu as Menu
```

**Step 7: Implement view**

```elm
view : Model -> Html.Html Msg
view model =
    Html.div [ Attrs.class "flex flex-col h-screen" ]
        [ viewHeader model
        , viewMain model
        , viewInput model
        ]
```

**Step 8: Implement header with settings menu**

```elm
viewHeader : Model -> Html.Html Msg
viewHeader model =
    Html.header [ Attrs.class "flex items-center justify-between px-6 py-3 border-b border-default" ]
        [ -- Left: Title with icon
          Html.h1
            [ Attrs.class "text-xl font-medium flex items-center gap-2"
            , Attrs.testId "app-title"
            ]
            [ Html.img
                [ Attrs.src "/favicon.svg"
                , Attrs.alt ""
                , Attrs.class "w-5 h-5"
                ]
                []
            , Html.text (I18n.scientificAssistant model.language)
            ]

        -- Right: Settings menu
        , Html.div [ Attrs.class "relative" ]
            [ Html.button
                [ Attrs.id "settings-trigger"
                , Attrs.attribute "popovertarget" "settings-menu"
                , Attrs.class "btn btn-ghost btn-icon"
                , Attrs.attribute "aria-label" (I18n.settings model.language)
                , Attrs.testId "settings-button"
                ]
                [ Icons.toHtml Icons.Medium Icons.settings ]
            , Menu.view
                { id = "settings-menu"
                , triggerId = "settings-trigger"
                , onItemClick = MenuItemClicked
                , items = settingsMenuItems model
                }
            ]
        ]


settingsMenuItems : Model -> List Menu.Item
settingsMenuItems model =
    [ Menu.Action
        { id = "toggle-theme"
        , icon =
            case model.theme of
                Theme.Light ->
                    Icons.moon

                Theme.Dark ->
                    Icons.sun
        , label =
            case model.theme of
                Theme.Light ->
                    I18n.darkTheme model.language

                Theme.Dark ->
                    I18n.lightTheme model.language
        , suffix = Nothing
        }
    , Menu.Action
        { id = "toggle-language"
        , icon = Icons.globe
        , label =
            case model.language of
                I18n.En ->
                    I18n.russian model.language

                I18n.Ru ->
                    I18n.english model.language
        , suffix =
            Just
                (case model.language of
                    I18n.En ->
                        "RU"

                    I18n.Ru ->
                        "EN"
                )
        }
    , Menu.Divider
    , Menu.Action
        { id = "help"
        , icon = Icons.help
        , label = I18n.help model.language
        , suffix = Nothing
        }
    ]
```

**Step 9: Implement main content area**

```elm
viewMain : Model -> Html.Html Msg
viewMain model =
    Html.main_ [ Attrs.class "flex-1 overflow-y-auto p-6" ]
        [ Html.div [ Attrs.class "max-w-4xl mx-auto text-center text-secondary py-20" ]
            [ Html.text (I18n.askQuestion model.language) ]
        ]
```

**Step 10: Implement input area with Ctrl+Enter**

```elm
viewInput : Model -> Html.Html Msg
viewInput model =
    Html.div [ Attrs.class "p-4 px-6 border-t border-default" ]
        [ Html.div [ Attrs.class "relative max-w-4xl mx-auto" ]
            [ Html.textarea
                [ Attrs.class "input w-full resize-none pr-12"
                , Attrs.placeholder (I18n.askQuestion model.language)
                , Attrs.value model.inputText
                , Attrs.rows 1
                , Attrs.testId "message-input"
                , Events.onInput InputChanged
                , onCtrlEnter SendClicked
                ]
                []
            , Html.button
                [ Attrs.class "btn btn-ghost btn-icon btn-sm absolute right-2 bottom-2"
                , Attrs.attribute "aria-label" (I18n.send model.language)
                , Attrs.attribute "title" (I18n.send model.language)
                , Attrs.testId "send-button"
                , Attrs.disabled (not (canSend model))
                , Events.onClick SendClicked
                ]
                [ Icons.toHtml Icons.Small Icons.send ]
            ]
        ]


onCtrlEnter : Msg -> Html.Attribute Msg
onCtrlEnter msg =
    Events.preventDefaultOn "keydown"
        (Decode.map2 Tuple.pair
            (Decode.field "key" Decode.string)
            (Decode.field "ctrlKey" Decode.bool)
            |> Decode.andThen
                (\( key, ctrl ) ->
                    if key == "Enter" && ctrl then
                        Decode.succeed ( msg, True )

                    else
                        Decode.fail "not ctrl+enter"
                )
        )
```

---

## Task 8: Register Menu in Bridge

**Files:**
- Modify: `bridge/src/main.ts`

**Step 1: Import and register menu**

```typescript
import { registerMenu } from '@scientific-assistant/design-system';

// Register Web Components
registerMenu();
```

---

## Task 9: Run Tests and Verify

**Step 1: Run design system tests**

```bash
cd infra/design-system && npm test
```

Expected: All tests pass.

**Step 2: Run all Elm tests**

```bash
cd view && elm-test
```

Expected: All tests pass.

**Step 3: Run elm-review**

```bash
cd view && elm-review
```

Expected: No errors.

**Step 4: Visual verification**

```bash
dev
```

Verify:
- [ ] Header displays title with icon and settings button
- [ ] Settings button opens menu (bottom sheet on mobile, dropdown on desktop)
- [ ] Menu shows theme toggle, language toggle, help
- [ ] Theme toggle switches between light/dark
- [ ] Language toggle switches between EN/RU
- [ ] Help button closes menu (placeholder for now)
- [ ] Escape key closes menu (native popover)
- [ ] Click outside closes menu (native popover)
- [ ] `aria-expanded` toggles on trigger button
- [ ] Input area accepts text
- [ ] Send button is disabled when input empty
- [ ] Ctrl+Enter submits (clears input)
- [ ] All test IDs present in DOM

**Step 5: Verify design-system.html showcase**

```bash
dev:landing
```

Visit `/design-system.html` and verify menu demo works.

---

## Task 10: Commit and Mark Complete

**Step 1: Commit**

```bash
git add -A
git commit -m "feat: add main shell with header, settings menu, and input area

- Install zwilias/elm-html-string for icon serialization
- Refactor UI.Icons to use Html.String (single source of truth)
- Add ds-menu Web Component using native HTML popover
- Web Component manages ARIA (aria-expanded on trigger)
- Add UI/Menu.elm helper for Elm integration
- Add header with title and settings menu button
- Implement responsive menu (bottom sheet mobile, dropdown desktop)
- Add menu items: theme toggle, language toggle, help
- Add input area with textarea and send button
- Add Ctrl+Enter keyboard shortcut for send
- Add menu showcase to design-system.html

🤖 Generated with Claude Code"
```

**Step 2: Mark phase complete**

Edit `docs/plans/2025-12-13-elm-tauri-migration-design.md`:

Change:
```
| 6 | Main Shell | [ ] | `06-main-shell-plan.md` |
```
To:
```
| 6 | Main Shell | [x] | `06-main-shell-plan.md` |
```

---

## Test IDs

| ID                | Element               |
|-------------------|-----------------------|
| `app-title`       | Header title          |
| `settings-button` | Settings menu trigger |
| `message-input`   | Chat input textarea   |
| `send-button`     | Send message button   |

---

## Verification Checklist

- [ ] `zwilias/elm-html-string` installed
- [ ] `npm test` passes in design-system
- [ ] `elm-test` passes all tests
- [ ] `elm-review` passes
- [ ] Header displays title with settings button
- [ ] Settings menu opens/closes correctly (native popover)
- [ ] Menu is bottom sheet on mobile (<768px)
- [ ] Menu is dropdown on desktop (≥768px)
- [ ] `aria-expanded` toggles correctly
- [ ] Theme toggle works
- [ ] Language toggle works
- [ ] Escape closes menu (native)
- [ ] Click outside closes menu (native)
- [ ] Input area accepts text
- [ ] Send button is disabled when input empty
- [ ] Ctrl+Enter submits
- [ ] All data-testid attributes present
- [ ] design-system.html menu showcase works
