// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import { describe, it, expect, beforeAll } from 'vitest';

interface ErrorResponse {
  error?: string;
}

interface GeminiResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
  }>;
}

// Mock environment
const mockEnv = {
  GEMINI_API_KEY: 'test-gemini-key',
  PROXY_API_KEY: 'test-proxy-key',
};

// Import handler after defining mocks
let handleRequest: (request: Request, env: typeof mockEnv) => Promise<Response>;

beforeAll(async () => {
  const module = await import('../index');
  handleRequest = module.handleRequest;
});

describe('Gemini Proxy', () => {
  it('rejects requests without Authorization header', async () => {
    const request = new Request('https://proxy.example.com/', {
      method: 'POST',
      body: JSON.stringify({ contents: [] }),
    });

    const response = await handleRequest(request, mockEnv);

    expect(response.status).toBe(401);
    const body: ErrorResponse = await response.json();
    expect(body.error).toBe('Missing Authorization header');
  });

  it('rejects requests with invalid API key', async () => {
    const request = new Request('https://proxy.example.com/', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer wrong-key',
      },
      body: JSON.stringify({ contents: [] }),
    });

    const response = await handleRequest(request, mockEnv);

    expect(response.status).toBe(403);
    const body: ErrorResponse = await response.json();
    expect(body.error).toBe('Invalid API key');
  });

  it('handles OPTIONS preflight requests', async () => {
    const request = new Request('https://proxy.example.com/', {
      method: 'OPTIONS',
    });

    const response = await handleRequest(request, mockEnv);

    expect(response.status).toBe(200);
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
    expect(response.headers.get('Access-Control-Allow-Methods')).toContain('POST');
  });

  it('rejects non-POST methods', async () => {
    const request = new Request('https://proxy.example.com/', {
      method: 'GET',
      headers: {
        Authorization: 'Bearer test-proxy-key',
      },
    });

    const response = await handleRequest(request, mockEnv);

    expect(response.status).toBe(405);
  });
});

describe('Gemini Proxy - Integration', () => {
  it('forwards valid requests to Gemini API', async () => {
    // Mock global fetch
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async (url: string | URL | Request) => {
      const urlStr = url.toString();
      if (urlStr.includes('generativelanguage.googleapis.com')) {
        return new Response(
          JSON.stringify({
            candidates: [
              {
                content: {
                  parts: [{ text: 'Hello from Gemini!' }],
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
      const request = new Request('https://proxy.example.com/?model=gemini-2.5-flash', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer test-proxy-key',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: 'Hi' }] }],
        }),
      });

      const response = await handleRequest(request, mockEnv);

      expect(response.status).toBe(200);
      const body: GeminiResponse = await response.json();
      expect(body.candidates?.[0]?.content?.parts?.[0]?.text).toBe('Hello from Gemini!');
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it('uses model from query parameter', async () => {
    let capturedUrl = '';
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async (url: string | URL | Request) => {
      capturedUrl = url.toString();
      return new Response(JSON.stringify({ candidates: [] }), { status: 200 });
    };

    try {
      const request = new Request('https://proxy.example.com/?model=gemini-2.5-flash', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer test-proxy-key',
        },
        body: JSON.stringify({ contents: [] }),
      });

      await handleRequest(request, mockEnv);

      expect(capturedUrl).toContain('gemini-2.5-flash');
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
