# Cloudflare Proxy Implementation Plan

**Goal:** Deploy authenticated Cloudflare Worker that proxies requests to Gemini API, validating API keys before forwarding.

**Architecture:** Client sends request with `Authorization` header containing `PROXY_API_KEY`. Worker validates key, strips it, adds `GEMINI_API_KEY`, forwards to Gemini. CORS headers added for browser access.

**Tech Stack:** Cloudflare Workers, Wrangler CLI, TypeScript

**Reference:** `.claude/docs/plans/2025-12-13-elm-tauri-migration-design.md`

---

## Before Execution

1. **Invoke brainstorming skill** — Review this plan and existing proxy at `legacy/` (Cloudflare Worker)
2. **Analyze** — Check `legacy/src/effects.ts` for current API usage patterns
3. **Confirm** — User confirms plan accuracy before proceeding
4. **Proceed** — Use executing-plans + test-driven-development skills

---

## Prerequisites

- Cloudflare account with Workers enabled
- Wrangler CLI installed (via npm)
- `GEMINI_API_KEY` from Google AI Studio
- `PROXY_API_KEY` (generate random string for client auth)

---

## Task 1: Initialize Cloudflare Worker Project

**Files:**
- Create: `cloudflare/package.json`
- Create: `cloudflare/wrangler.toml`
- Create: `cloudflare/tsconfig.json`

**Step 1: Create package.json**

```json
{
  "name": "gemini-proxy",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "wrangler dev",
    "deploy": "wrangler deploy",
    "tail": "wrangler tail"
  },
  "devDependencies": {
    "@cloudflare/workers-types": "^4.20241127.0",
    "typescript": "^5.7.0",
    "wrangler": "^3.93.0"
  }
}
```

**Step 2: Create wrangler.toml**

```toml
name = "gemini-proxy"
main = "src/index.ts"
compatibility_date = "2024-12-01"

[vars]
# Non-secret config (if any)

# Secrets are set via: wrangler secret put GEMINI_API_KEY
# and: wrangler secret put PROXY_API_KEY
```

**Step 3: Create tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "lib": ["ES2022"],
    "types": ["@cloudflare/workers-types"],
    "strict": true,
    "noEmit": true,
    "skipLibCheck": true,
    "isolatedModules": true
  },
  "include": ["src/**/*"]
}
```

**Step 4: Install dependencies**

```bash
cd cloudflare
npm install
cd ..
```

Expected: Dependencies installed successfully.

---

## Task 2: Write Failing Test for Auth Validation

**Files:**
- Create: `cloudflare/src/index.test.ts`

**Step 1: Write test**

```typescript
// cloudflare/src/index.test.ts
import { describe, it, expect, beforeAll } from "vitest";

// Mock environment
const mockEnv = {
  GEMINI_API_KEY: "test-gemini-key",
  PROXY_API_KEY: "test-proxy-key",
};

// Import handler after defining mocks
let handleRequest: (request: Request, env: typeof mockEnv) => Promise<Response>;

beforeAll(async () => {
  const module = await import("./index");
  handleRequest = module.handleRequest;
});

describe("Gemini Proxy", () => {
  it("rejects requests without Authorization header", async () => {
    const request = new Request("https://proxy.example.com/", {
      method: "POST",
      body: JSON.stringify({ contents: [] }),
    });

    const response = await handleRequest(request, mockEnv);

    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.error).toBe("Missing Authorization header");
  });

  it("rejects requests with invalid API key", async () => {
    const request = new Request("https://proxy.example.com/", {
      method: "POST",
      headers: {
        Authorization: "Bearer wrong-key",
      },
      body: JSON.stringify({ contents: [] }),
    });

    const response = await handleRequest(request, mockEnv);

    expect(response.status).toBe(403);
    const body = await response.json();
    expect(body.error).toBe("Invalid API key");
  });

  it("handles OPTIONS preflight requests", async () => {
    const request = new Request("https://proxy.example.com/", {
      method: "OPTIONS",
    });

    const response = await handleRequest(request, mockEnv);

    expect(response.status).toBe(200);
    expect(response.headers.get("Access-Control-Allow-Origin")).toBe("*");
    expect(response.headers.get("Access-Control-Allow-Methods")).toContain(
      "POST"
    );
  });

  it("rejects non-POST methods", async () => {
    const request = new Request("https://proxy.example.com/", {
      method: "GET",
      headers: {
        Authorization: "Bearer test-proxy-key",
      },
    });

    const response = await handleRequest(request, mockEnv);

    expect(response.status).toBe(405);
  });
});
```

**Step 2: Add vitest to package.json**

Update `cloudflare/package.json`:

```json
{
  "name": "gemini-proxy",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "wrangler dev",
    "deploy": "wrangler deploy",
    "tail": "wrangler tail",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "devDependencies": {
    "@cloudflare/workers-types": "^4.20241127.0",
    "typescript": "^5.7.0",
    "vitest": "^2.1.0",
    "wrangler": "^3.93.0"
  }
}
```

**Step 3: Verify test fails**

```bash
cd cloudflare
npm install
npm test
```

Expected: FAIL with "Cannot find module './index'" or similar.

---

## Task 3: Implement Proxy Worker

**Files:**
- Create: `cloudflare/src/index.ts`

**Step 1: Implement worker**

```typescript
// cloudflare/src/index.ts
export interface Env {
  GEMINI_API_KEY: string;
  PROXY_API_KEY: string;
}

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

function jsonResponse(
  body: Record<string, unknown>,
  status: number
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...CORS_HEADERS,
    },
  });
}

export async function handleRequest(
  request: Request,
  env: Env
): Promise<Response> {
  // Handle CORS preflight
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: CORS_HEADERS,
    });
  }

  // Only allow POST
  if (request.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  // Validate Authorization header
  const authHeader = request.headers.get("Authorization");
  if (!authHeader) {
    return jsonResponse({ error: "Missing Authorization header" }, 401);
  }

  // Extract and validate API key
  const apiKey = authHeader.replace("Bearer ", "");
  if (apiKey !== env.PROXY_API_KEY) {
    return jsonResponse({ error: "Invalid API key" }, 403);
  }

  // Get model from query params
  const url = new URL(request.url);
  const model = url.searchParams.get("model") || "gemini-2.0-flash";

  // Forward to Gemini
  const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${env.GEMINI_API_KEY}`;

  try {
    const geminiResponse = await fetch(geminiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: request.body,
    });

    // Clone response and add CORS headers
    const responseBody = await geminiResponse.text();
    return new Response(responseBody, {
      status: geminiResponse.status,
      headers: {
        "Content-Type": "application/json",
        ...CORS_HEADERS,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return jsonResponse({ error: `Proxy error: ${message}` }, 502);
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    return handleRequest(request, env);
  },
};
```

**Step 2: Verify tests pass**

```bash
cd cloudflare
npm test
```

Expected: All tests pass.

---

## Task 4: Add Integration Test

**Files:**
- Modify: `cloudflare/src/index.test.ts`

**Step 1: Add integration test (mocked fetch)**

Add to existing test file:

```typescript
describe("Gemini Proxy - Integration", () => {
  it("forwards valid requests to Gemini API", async () => {
    // Mock global fetch
    const originalFetch = global.fetch;
    global.fetch = async (url: string | URL | Request) => {
      const urlStr = url.toString();
      if (urlStr.includes("generativelanguage.googleapis.com")) {
        return new Response(
          JSON.stringify({
            candidates: [
              {
                content: {
                  parts: [{ text: "Hello from Gemini!" }],
                },
              },
            ],
          }),
          { status: 200 }
        );
      }
      return originalFetch(url);
    };

    try {
      const request = new Request("https://proxy.example.com/?model=gemini-2.0-flash", {
        method: "POST",
        headers: {
          Authorization: "Bearer test-proxy-key",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: "Hi" }] }],
        }),
      });

      const response = await handleRequest(request, mockEnv);

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.candidates[0].content.parts[0].text).toBe(
        "Hello from Gemini!"
      );
      expect(response.headers.get("Access-Control-Allow-Origin")).toBe("*");
    } finally {
      global.fetch = originalFetch;
    }
  });

  it("uses model from query parameter", async () => {
    let capturedUrl = "";
    const originalFetch = global.fetch;
    global.fetch = async (url: string | URL | Request) => {
      capturedUrl = url.toString();
      return new Response(JSON.stringify({ candidates: [] }), { status: 200 });
    };

    try {
      const request = new Request(
        "https://proxy.example.com/?model=gemini-2.5-flash",
        {
          method: "POST",
          headers: {
            Authorization: "Bearer test-proxy-key",
          },
          body: JSON.stringify({ contents: [] }),
        }
      );

      await handleRequest(request, mockEnv);

      expect(capturedUrl).toContain("gemini-2.5-flash");
    } finally {
      global.fetch = originalFetch;
    }
  });
});
```

**Step 2: Verify all tests pass**

```bash
cd cloudflare
npm test
```

Expected: All tests pass.

---

## Task 5: Configure Deployment Secrets

**Step 1: Login to Cloudflare**

```bash
cd cloudflare
npx wrangler login
```

Expected: Browser opens for authentication.

**Step 2: Set secrets**

```bash
npx wrangler secret put GEMINI_API_KEY
# Enter your Gemini API key when prompted

npx wrangler secret put PROXY_API_KEY
# Enter a secure random string (e.g., generate with: openssl rand -hex 32)
```

Expected: Secrets saved successfully.

**Step 3: Deploy**

```bash
npx wrangler deploy
```

Expected: Worker deployed, URL printed (e.g., `https://gemini-proxy.<your-subdomain>.workers.dev`).

---

## Task 6: Update CLAUDE.md with Proxy Info

**Files:**
- Modify: `CLAUDE.md`

**Step 1: Add proxy section**

Add after "## Commands" section:

```markdown
## Cloudflare Proxy

Worker at `cloudflare/` proxies Gemini API calls with authentication.

**Deployment:**
```bash
cd cloudflare
npx wrangler deploy
```

**Secrets (set once):**
```bash
npx wrangler secret put GEMINI_API_KEY  # From Google AI Studio
npx wrangler secret put PROXY_API_KEY   # Random string for client auth
```

**Usage:**
```typescript
const response = await fetch("https://gemini-proxy.xxx.workers.dev/?model=gemini-2.0-flash", {
  method: "POST",
  headers: {
    "Authorization": `Bearer ${PROXY_API_KEY}`,
    "Content-Type": "application/json"
  },
  body: JSON.stringify({ contents: [...] })
});
```

**Testing:**
```bash
cd cloudflare && npm test
```
```

---

## Task 7: Commit and Mark Complete

**Step 1: Commit**

```bash
git add cloudflare/
git add CLAUDE.md
git commit -m "feat: add authenticated Cloudflare proxy for Gemini API

- Validate PROXY_API_KEY before forwarding requests
- Strip client auth, add GEMINI_API_KEY to backend
- Handle CORS preflight
- Model selection via query parameter
- Unit tests for auth validation and forwarding

🤖 Generated with Claude Code"
```

**Step 2: Mark phase complete**

Edit `.claude/docs/plans/2025-12-13-elm-tauri-migration-design.md`:

Change line 14 from:
```
| 2 | Cloudflare Proxy | [ ] | `02-cloudflare-proxy-plan.md` |
```
To:
```
| 2 | Cloudflare Proxy | [x] | `02-cloudflare-proxy-plan.md` |
```

---

## Verification Checklist

- [ ] `cd cloudflare && npm test` passes all tests
- [ ] `npx wrangler deploy` succeeds
- [ ] Secrets configured via `wrangler secret put`
- [ ] Manual test: curl with valid key returns 200
- [ ] Manual test: curl without key returns 401
- [ ] Manual test: curl with wrong key returns 403
- [ ] CLAUDE.md updated with proxy documentation

## Manual Verification Commands

```bash
# Test missing auth (should return 401)
curl -X POST https://gemini-proxy.xxx.workers.dev/ \
  -H "Content-Type: application/json" \
  -d '{"contents":[]}' \
  -w "\nStatus: %{http_code}\n"

# Test invalid auth (should return 403)
curl -X POST https://gemini-proxy.xxx.workers.dev/ \
  -H "Authorization: Bearer wrong-key" \
  -H "Content-Type: application/json" \
  -d '{"contents":[]}' \
  -w "\nStatus: %{http_code}\n"

# Test valid request (should return 200)
curl -X POST "https://gemini-proxy.xxx.workers.dev/?model=gemini-2.0-flash" \
  -H "Authorization: Bearer YOUR_PROXY_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"contents":[{"role":"user","parts":[{"text":"Say hello"}]}]}' \
  -w "\nStatus: %{http_code}\n"
```
