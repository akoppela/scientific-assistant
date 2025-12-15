# E2E Tests Implementation Plan

**Goal:** Create comprehensive Playwright E2E tests covering critical user paths, real API integration, and Tauri-specific features.

**Architecture:** Playwright tests run against the Tauri dev server. Tests use `data-testid` selectors exclusively. Helper functions abstract common actions. Real API calls for integration tests, mocked for unit-style E2E.

**Tech Stack:** Playwright, TypeScript, Tauri dev server

**Reference:** `docs/plans/2025-12-13-elm-tauri-migration-design.md`

---

## Before Execution

1. **Invoke brainstorming skill** — Review this plan and existing E2E tests
2. **Analyze** — Check `../legacy/e2e/` for existing test patterns and helpers
3. **Analyze** — Review all `data-testid` attributes in Elm components
4. **Confirm** — User confirms test coverage and scenarios
5. **Proceed** — Use executing-plans + test-driven-development skills

---

## Prerequisites

- Tutorial phase complete
- All features implemented
- Application fully functional

---

## Task 1: Set Up Playwright

**Files:**
- Create: `playwright.config.ts`
- Create: `e2e/helpers.ts`
- Modify: `package.json`

**Step 1: Create Playwright config**

```typescript
// playwright.config.ts
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e/specs",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",
  use: {
    baseURL: "http://localhost:5173",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:5173",
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
```

**Step 2: Create helpers**

```typescript
// e2e/helpers.ts
import { Page, expect } from "@playwright/test";

export async function sendMessage(page: Page, message: string): Promise<void> {
  await page.getByTestId("message-input").fill(message);
  await page.getByTestId("send-button").click();
}

export async function waitForResponse(page: Page): Promise<void> {
  // Wait for loading indicator to appear
  await expect(page.getByTestId("loading-indicator")).toBeVisible({ timeout: 5000 });
  // Wait for loading indicator to disappear
  await expect(page.getByTestId("loading-indicator")).not.toBeVisible({ timeout: 120000 });
}

export async function getLastAssistantMessage(page: Page): Promise<string> {
  const messages = page.locator('[data-testid^="message-assistant-"]');
  const count = await messages.count();
  if (count === 0) return "";
  const lastMessage = messages.nth(count - 1);
  return await lastMessage.innerText();
}

export async function toggleTheme(page: Page): Promise<void> {
  await page.getByTestId("theme-toggle").click();
}

export async function toggleLanguage(page: Page): Promise<void> {
  await page.getByTestId("language-toggle").click();
}

export async function selectModel(page: Page, model: "fast" | "thinking" | "creative"): Promise<void> {
  await page.getByTestId("model-selector").selectOption(model);
}

export async function toggleSearchGrounding(page: Page): Promise<void> {
  await page.getByTestId("search-toggle").click();
}

export async function clearSession(page: Page): Promise<void> {
  await page.getByTestId("clear-button").click();
  await page.getByTestId("confirm-ok").click();
}

export async function startTutorial(page: Page): Promise<void> {
  await page.getByTestId("help-button").click();
}

export async function completeTutorial(page: Page): Promise<void> {
  while (await page.getByTestId("tutorial-next").isVisible()) {
    await page.getByTestId("tutorial-next").click();
  }
  await page.getByTestId("tutorial-finish").click();
}
```

**Step 3: Update package.json**

```json
{
  "scripts": {
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:headed": "playwright test --headed"
  },
  "devDependencies": {
    "@playwright/test": "^1.49.0"
  }
}
```

**Step 4: Install Playwright**

```bash
npm install
npx playwright install
```

---

## Task 2: Create Chat Flow Tests

**Files:**
- Create: `e2e/specs/chat.spec.ts`

**Step 1: Write chat tests**

```typescript
// e2e/specs/chat.spec.ts
import { test, expect } from "@playwright/test";
import { sendMessage, waitForResponse, getLastAssistantMessage } from "../helpers";

test.describe("Chat", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("displays app title", async ({ page }) => {
    await expect(page.getByTestId("app-title")).toBeVisible();
  });

  test("send button is disabled when input is empty", async ({ page }) => {
    await expect(page.getByTestId("send-button")).toBeDisabled();
  });

  test("send button is enabled when input has text", async ({ page }) => {
    await page.getByTestId("message-input").fill("Hello");
    await expect(page.getByTestId("send-button")).toBeEnabled();
  });

  test("sends message and receives response", async ({ page }) => {
    await sendMessage(page, "Say hello");
    await waitForResponse(page);

    // Check user message appears
    await expect(page.getByTestId("message-user-0")).toBeVisible();

    // Check assistant response appears
    const response = await getLastAssistantMessage(page);
    expect(response.length).toBeGreaterThan(0);
  });

  test("clears input after sending", async ({ page }) => {
    await sendMessage(page, "Test message");
    await expect(page.getByTestId("message-input")).toHaveValue("");
  });

  test("shows loading indicator while waiting", async ({ page }) => {
    await sendMessage(page, "Hello");
    await expect(page.getByTestId("loading-indicator")).toBeVisible();
    await waitForResponse(page);
    await expect(page.getByTestId("loading-indicator")).not.toBeVisible();
  });

  test("Enter key sends message", async ({ page }) => {
    await page.getByTestId("message-input").fill("Hello");
    await page.getByTestId("message-input").press("Enter");
    await expect(page.getByTestId("message-user-0")).toBeVisible();
  });

  test("Shift+Enter adds newline", async ({ page }) => {
    await page.getByTestId("message-input").fill("Line 1");
    await page.getByTestId("message-input").press("Shift+Enter");
    await page.getByTestId("message-input").type("Line 2");
    await expect(page.getByTestId("message-input")).toHaveValue("Line 1\nLine 2");
  });
});
```

---

## Task 3: Create Theme and Language Tests

**Files:**
- Create: `e2e/specs/settings.spec.ts`

**Step 1: Write settings tests**

```typescript
// e2e/specs/settings.spec.ts
import { test, expect } from "@playwright/test";
import { toggleTheme, toggleLanguage } from "../helpers";

test.describe("Settings", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test.describe("Theme", () => {
    test("defaults to light theme", async ({ page }) => {
      await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
    });

    test("toggles to dark theme", async ({ page }) => {
      await toggleTheme(page);
      await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    });

    test("persists theme across reload", async ({ page }) => {
      await toggleTheme(page);
      await page.reload();
      await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    });
  });

  test.describe("Language", () => {
    test("defaults to Russian", async ({ page }) => {
      await expect(page.locator("html")).toHaveAttribute("lang", "ru");
    });

    test("toggles to English", async ({ page }) => {
      await toggleLanguage(page);
      await expect(page.locator("html")).toHaveAttribute("lang", "en");
    });

    test("persists language across reload", async ({ page }) => {
      await toggleLanguage(page);
      await page.reload();
      await expect(page.locator("html")).toHaveAttribute("lang", "en");
    });

    test("updates UI text when language changes", async ({ page }) => {
      // Start with Russian
      await expect(page.getByTestId("send-button")).toHaveText("Отправить");

      // Switch to English
      await toggleLanguage(page);
      await expect(page.getByTestId("send-button")).toHaveText("Send");
    });
  });
});
```

---

## Task 4: Create Session Tests

**Files:**
- Create: `e2e/specs/session.spec.ts`

**Step 1: Write session tests**

```typescript
// e2e/specs/session.spec.ts
import { test, expect } from "@playwright/test";
import { sendMessage, waitForResponse, clearSession } from "../helpers";

test.describe("Session", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test.describe("Clear", () => {
    test("clear button is disabled with empty history", async ({ page }) => {
      await expect(page.getByTestId("clear-button")).toBeDisabled();
    });

    test("clear button is enabled with messages", async ({ page }) => {
      await sendMessage(page, "Hello");
      await waitForResponse(page);
      await expect(page.getByTestId("clear-button")).toBeEnabled();
    });

    test("shows confirmation dialog", async ({ page }) => {
      await sendMessage(page, "Hello");
      await waitForResponse(page);
      await page.getByTestId("clear-button").click();
      await expect(page.getByTestId("confirm-dialog")).toBeVisible();
    });

    test("cancelling keeps messages", async ({ page }) => {
      await sendMessage(page, "Hello");
      await waitForResponse(page);
      await page.getByTestId("clear-button").click();
      await page.getByTestId("confirm-cancel").click();
      await expect(page.getByTestId("message-user-0")).toBeVisible();
    });

    test("confirming clears messages", async ({ page }) => {
      await sendMessage(page, "Hello");
      await waitForResponse(page);
      await clearSession(page);
      await expect(page.getByTestId("message-user-0")).not.toBeVisible();
    });
  });

  test.describe("Export", () => {
    test("export button is disabled with empty history", async ({ page }) => {
      await expect(page.getByTestId("export-button")).toBeDisabled();
    });

    test("export button is enabled with messages", async ({ page }) => {
      await sendMessage(page, "Hello");
      await waitForResponse(page);
      await expect(page.getByTestId("export-button")).toBeEnabled();
    });
  });
});
```

---

## Task 5: Create Tutorial Tests

**Files:**
- Create: `e2e/specs/tutorial.spec.ts`

**Step 1: Write tutorial tests**

```typescript
// e2e/specs/tutorial.spec.ts
import { test, expect } from "@playwright/test";
import { startTutorial, completeTutorial } from "../helpers";

test.describe("Tutorial", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("opens tutorial from help button", async ({ page }) => {
    await startTutorial(page);
    await expect(page.getByTestId("tutorial-dialog")).toBeVisible();
  });

  test("shows first step on open", async ({ page }) => {
    await startTutorial(page);
    await expect(page.getByTestId("tutorial-dialog")).toContainText("Добро пожаловать");
  });

  test("navigates forward through steps", async ({ page }) => {
    await startTutorial(page);
    await page.getByTestId("tutorial-next").click();
    // Should show second step
    await expect(page.getByTestId("tutorial-prev")).toBeVisible();
  });

  test("navigates backward through steps", async ({ page }) => {
    await startTutorial(page);
    await page.getByTestId("tutorial-next").click();
    await page.getByTestId("tutorial-prev").click();
    // Should be back at first step
    await expect(page.getByTestId("tutorial-prev")).not.toBeVisible();
  });

  test("skip closes tutorial", async ({ page }) => {
    await startTutorial(page);
    await page.getByTestId("tutorial-skip").click();
    await expect(page.getByTestId("tutorial-dialog")).not.toBeVisible();
  });

  test("finish closes tutorial", async ({ page }) => {
    await startTutorial(page);
    await completeTutorial(page);
    await expect(page.getByTestId("tutorial-dialog")).not.toBeVisible();
  });

  test("shows demo messages during tutorial", async ({ page }) => {
    await startTutorial(page);
    // Demo messages should be visible
    await expect(page.getByTestId("message-user-0")).toBeVisible();
    await expect(page.getByTestId("message-assistant-1")).toBeVisible();
  });
});
```

---

## Task 6: Create Model Selector Tests

**Files:**
- Create: `e2e/specs/model-selector.spec.ts`

**Step 1: Write model selector tests**

```typescript
// e2e/specs/model-selector.spec.ts
import { test, expect } from "@playwright/test";
import { selectModel } from "../helpers";

test.describe("Model Selector", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("defaults to fast model", async ({ page }) => {
    await expect(page.getByTestId("model-selector")).toHaveValue("fast");
  });

  test("can select thinking model", async ({ page }) => {
    await selectModel(page, "thinking");
    await expect(page.getByTestId("model-selector")).toHaveValue("thinking");
  });

  test("can select creative model", async ({ page }) => {
    await selectModel(page, "creative");
    await expect(page.getByTestId("model-selector")).toHaveValue("creative");
  });

  test("persists selection across reload", async ({ page }) => {
    await selectModel(page, "thinking");
    await page.reload();
    await expect(page.getByTestId("model-selector")).toHaveValue("thinking");
  });
});
```

---

## Task 7: Create Search Grounding Tests

**Files:**
- Create: `e2e/specs/search-grounding.spec.ts`

**Step 1: Write search grounding tests**

```typescript
// e2e/specs/search-grounding.spec.ts
import { test, expect } from "@playwright/test";
import { toggleSearchGrounding } from "../helpers";

test.describe("Search Grounding", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("defaults to disabled", async ({ page }) => {
    await expect(page.getByTestId("search-toggle")).toHaveAttribute(
      "aria-pressed",
      "false"
    );
  });

  test("can be enabled", async ({ page }) => {
    await toggleSearchGrounding(page);
    await expect(page.getByTestId("search-toggle")).toHaveAttribute(
      "aria-pressed",
      "true"
    );
  });

  test("persists across reload", async ({ page }) => {
    await toggleSearchGrounding(page);
    await page.reload();
    await expect(page.getByTestId("search-toggle")).toHaveAttribute(
      "aria-pressed",
      "true"
    );
  });
});
```

---

## Task 8: Update CLAUDE.md with E2E Info

**Files:**
- Modify: `CLAUDE.md`

**Step 1: Add E2E section**

```markdown
## E2E Testing

Tests live in `e2e/specs/`. Helpers in `e2e/helpers.ts`.

**Run tests:**
```bash
npm run test:e2e       # Headless
npm run test:e2e:ui    # Interactive UI
npm run test:e2e:headed # Headed browser
```

**Rules:**
1. Use `data-testid` only — never CSS classes or text content
2. Use helpers for common actions — `sendMessage`, `waitForResponse`, etc.
3. Semantic assertions — `toHaveAttribute`, `toBeDisabled`, `toBeVisible`

**Test IDs:**
- `app-title`, `theme-toggle`, `language-toggle`, `help-button`
- `message-input`, `send-button`, `attach-button`, `search-toggle`
- `model-selector`, `clear-button`, `export-button`, `import-button`
- `message-user-{n}`, `message-assistant-{n}`
- `loading-indicator`, `error-message`, `retry-button`
- `tutorial-dialog`, `tutorial-next`, `tutorial-prev`, `tutorial-skip`
- `confirm-dialog`, `confirm-ok`, `confirm-cancel`
```

---

## Task 9: Commit and Mark Complete

**Step 1: Run all E2E tests**

```bash
npm run test:e2e
```

**Step 2: Commit**

```bash
git add -A
git commit -m "feat: add comprehensive E2E test suite

- Set up Playwright with config
- Create test helpers for common actions
- Add chat flow tests
- Add theme/language settings tests
- Add session management tests
- Add tutorial tests
- Add model selector tests
- Add search grounding tests

🤖 Generated with Claude Code"
```

**Step 3: Mark phase complete**

Edit `docs/plans/2025-12-13-elm-tauri-migration-design.md`:

Change line 23 from:
```
| 11 | E2E Tests | [ ] | `11-e2e-tests-plan.md` |
```
To:
```
| 11 | E2E Tests | [x] | `11-e2e-tests-plan.md` |
```

---

## Verification Checklist

- [ ] `npm run test:e2e` passes all tests
- [ ] Chat flow tests pass (send, receive, loading)
- [ ] Theme toggle tests pass (switch, persist)
- [ ] Language toggle tests pass (switch, persist, UI update)
- [ ] Session tests pass (clear, export, import)
- [ ] Tutorial tests pass (open, navigate, skip, finish)
- [ ] Model selector tests pass (select, persist)
- [ ] Search grounding tests pass (toggle, persist)
- [ ] All helpers work correctly
- [ ] CLAUDE.md updated with E2E info
