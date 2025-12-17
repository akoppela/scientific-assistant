// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as Theme from '../theme';

describe('Theme Management', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
    vi.clearAllMocks();
  });

  describe('Theme.set', () => {
    it('sets data-theme attribute on document element', () => {
      Theme.set('dark');

      expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    });

    it('saves theme to localStorage', () => {
      Theme.set('dark');

      expect(localStorage.getItem('theme')).toBe('dark');
    });

    it('handles light theme', () => {
      Theme.set('light');

      expect(document.documentElement.getAttribute('data-theme')).toBe('light');
      expect(localStorage.getItem('theme')).toBe('light');
    });
  });

  describe('Theme.load', () => {
    it('returns saved theme from localStorage', () => {
      localStorage.setItem('theme', 'dark');

      expect(Theme.load()).toBe('dark');
    });

    it('returns "light" as default when no theme is saved', () => {
      expect(Theme.load()).toBe('light');
    });

    it('returns saved light theme', () => {
      localStorage.setItem('theme', 'light');

      expect(Theme.load()).toBe('light');
    });
  });

  describe('Theme persistence', () => {
    it('persists theme across page reloads', () => {
      Theme.set('dark');

      document.documentElement.removeAttribute('data-theme');

      const savedTheme = Theme.load();
      Theme.set(savedTheme);

      expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    });
  });
});
