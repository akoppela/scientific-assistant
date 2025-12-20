// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

export const STORAGE_KEY = 'language';

export function set(lang: string): void {
  document.documentElement.setAttribute('lang', lang);
  localStorage.setItem(STORAGE_KEY, lang);
}

export function load(): string | null {
  return localStorage.getItem(STORAGE_KEY);
}
