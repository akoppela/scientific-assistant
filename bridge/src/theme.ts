// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

export const STORAGE_KEY = 'theme';

export type Theme = 'light' | 'dark';

export function isTheme(value: string): value is Theme {
  return value === 'light' || value === 'dark';
}

export function set(theme: Theme): void {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem(STORAGE_KEY, theme);
}

export function load(): string | null {
  return localStorage.getItem(STORAGE_KEY);
}
