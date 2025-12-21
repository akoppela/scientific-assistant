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
class MockResizeObserver {
  callback: ResizeObserverCallback;
  disconnect = vi.fn();
  observe = vi.fn();
  unobserve = vi.fn();

  constructor(callback: ResizeObserverCallback) {
    this.callback = callback;
    allResizeObservers.push(this);
  }

  triggerResize(): void {
    this.callback([], this);
  }
}

const allResizeObservers: MockResizeObserver[] = [];

// Tracks all instances for testing
export const resizeObserverMock = {
  get instances(): MockResizeObserver[] {
    return allResizeObservers;
  },
  reset: (): void => {
    allResizeObservers.length = 0;
  },
};

vi.stubGlobal('ResizeObserver', MockResizeObserver);

// Mock IntersectionObserver (not available in jsdom)
export const intersectionObserverMock = {
  triggerIntersection: (_entries: IntersectionObserverEntry[]): void => {},
  disconnect: vi.fn(),
};

class MockIntersectionObserver implements IntersectionObserver {
  callback: IntersectionObserverCallback;
  disconnect = vi.fn();
  observe = vi.fn();
  unobserve = vi.fn();
  takeRecords = vi.fn(() => []);

  readonly root: Element | Document | null = null;
  readonly rootMargin: string = '0px';
  readonly thresholds: readonly number[] = [0];

  constructor(callback: IntersectionObserverCallback) {
    this.callback = callback;
    intersectionObserverMock.triggerIntersection = (entries: IntersectionObserverEntry[]) => {
      this.callback(entries, this);
    };
    intersectionObserverMock.disconnect = this.disconnect;
  }
}

vi.stubGlobal('IntersectionObserver', MockIntersectionObserver);

// Mock ToggleEvent (not available in jsdom)
class MockToggleEvent extends Event {
  newState: string;
  oldState: string;

  constructor(type: string, init?: { newState?: string; oldState?: string }) {
    super(type, { bubbles: true });
    this.newState = init?.newState ?? '';
    this.oldState = init?.oldState ?? '';
  }
}

vi.stubGlobal('ToggleEvent', MockToggleEvent);

// Mock Popover API (not available in jsdom)
// Implements full browser behavior for testing open/close interactions
Object.defineProperties(HTMLElement.prototype, {
  popover: {
    value: 'auto',
    configurable: true,
    enumerable: true,
    writable: true,
  },
  showPopover: {
    value() {
      // display: block is important for getting tests to see the popover
      // this is also how the popover is revealed in the browser
      this.style.display = 'block';
      this.setAttribute('popover-open', '');
      const showEvent = new window.Event('show', { bubbles: true });
      this.dispatchEvent(showEvent);
      return undefined;
    },
    configurable: true,
    writable: true,
  },
  hidePopover: {
    value() {
      // display: none is also how popovers are hidden in the browser
      this.style.display = 'none';
      this.removeAttribute('popover-open');
      const hideEvent = new window.Event('hide', { bubbles: true });
      this.dispatchEvent(hideEvent);
      return undefined;
    },
    configurable: true,
    writable: true,
  },
  togglePopover: {
    value(force?: boolean) {
      const isOpen = this.matches('[popover-open]');

      if (force === undefined) {
        if (isOpen) {
          this.hidePopover();
        } else {
          this.showPopover();
        }
      } else if (force) {
        this.showPopover();
      } else {
        this.hidePopover();
      }

      return undefined;
    },
    configurable: true,
    writable: true,
  },
});
