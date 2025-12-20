// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as Language from '../language';

describe('Language Management', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('lang');
    vi.clearAllMocks();
  });

  describe('Language.set', () => {
    it('sets lang attribute on document element', () => {
      Language.set('en');

      expect(document.documentElement.getAttribute('lang')).toBe('en');
    });

    it('saves language to localStorage', () => {
      Language.set('en');

      expect(localStorage.getItem(Language.STORAGE_KEY)).toBe('en');
    });

    it('handles Russian language', () => {
      Language.set('ru');

      expect(document.documentElement.getAttribute('lang')).toBe('ru');
      expect(localStorage.getItem(Language.STORAGE_KEY)).toBe('ru');
    });
  });

  describe('Language.load', () => {
    it('returns saved language from localStorage', () => {
      localStorage.setItem(Language.STORAGE_KEY, 'en');

      expect(Language.load()).toBe('en');
    });

    it('returns null when no language is saved', () => {
      expect(Language.load()).toBe(null);
    });

    it('returns saved Russian language', () => {
      localStorage.setItem(Language.STORAGE_KEY, 'ru');

      expect(Language.load()).toBe('ru');
    });
  });

  describe('Language persistence', () => {
    it('persists language across page reloads', () => {
      Language.set('en');

      document.documentElement.removeAttribute('lang');

      const savedLanguage = Language.load();
      if (savedLanguage) {
        Language.set(savedLanguage);
      }

      expect(document.documentElement.getAttribute('lang')).toBe('en');
    });
  });
});
