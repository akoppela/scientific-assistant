// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

export const STORAGE_KEY = 'language';

export type Language = 'en' | 'ru';

const TITLES: Record<Language, string> = {
  en: 'Scientific Assistant',
  ru: 'Научный Ассистент',
};

export function isLanguage(value: string): value is Language {
  return value === 'en' || value === 'ru';
}

export function set(lang: Language): void {
  document.documentElement.setAttribute('lang', lang);
  document.title = TITLES[lang];
  localStorage.setItem(STORAGE_KEY, lang);
}

export function load(): string | null {
  return localStorage.getItem(STORAGE_KEY);
}
