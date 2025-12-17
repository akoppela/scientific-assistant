// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import { vi } from 'vitest';

// CSS custom properties for testing (matches light theme tokens)
export const cssProperties: Record<string, string> = {
  '--color-text': '#1a2e2e',
  '--color-text-secondary': '#5a7070',
  '--color-text-muted': '#8a9a9a',
  '--color-text-inverse': '#f0f3f2',
  '--color-border': '#d1dede',
  '--color-border-strong': '#a8bfbf',
  '--color-bg-surface': '#f8faf9',
  '--color-data-1': '#0f766e',
  '--color-data-2': '#d97706',
  '--color-data-3': '#4f46e5',
  '--color-data-4': '#dc2626',
  '--color-data-5': '#7c3aed',
  '--color-data-6': '#0891b2',
  '--color-data-7': '#65a30d',
  '--color-data-8': '#c026d3',
  '--color-data-9': '#ea580c',
  '--font-sans': 'Nunito, sans-serif',
  '--font-size-xs': '0.75rem',
  '--font-size-lg': '1.125rem',
  '--font-weight-normal': '400',
  '--font-weight-medium': '500',
  '--font-weight-semibold': '600',
  '--space-1': '3px',
  '--space-2': '6px',
  '--space-3': '9px',
  '--space-4': '12px',
  '--space-6': '18px',
  '--space-7': '21px',
  '--space-8': '24px',
  '--space-10': '30px',
  '--space-12': '36px',
  '--space-14': '42px',
  '--space-16': '48px',
  '--space-20': '60px',
  '--border-width': '3px',
  '--opacity-disabled': '0.5',
  '--opacity-active': '0.8',
  '--opacity-subtle': '0.3',
};

// Apply CSS properties to document for tests that need them
export function setupCssProperties(): void {
  Object.entries(cssProperties).forEach(([k, v]) => {
    document.documentElement.style.setProperty(k, v);
  });
}

// Mock ResizeObserver (not available in jsdom)
// Exposes methods for testing the most recently created instance
export const resizeObserverMock = {
  triggerResize: (): void => {},
  disconnect: vi.fn(),
};

class MockResizeObserver {
  callback: ResizeObserverCallback;
  disconnect = vi.fn();

  constructor(callback: ResizeObserverCallback) {
    this.callback = callback;
    // Expose for testing
    resizeObserverMock.triggerResize = () => {
      this.callback([], this);
    };
    resizeObserverMock.disconnect = this.disconnect;
  }

  observe = vi.fn();
  unobserve = vi.fn();
}

vi.stubGlobal('ResizeObserver', MockResizeObserver);
