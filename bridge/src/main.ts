// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import './main.css';

import * as TauriCore from '@tauri-apps/api/core';
import * as Language from './language';
import * as Theme from './theme';

interface Flags {
  savedTheme: string | null;
  savedLanguage: string | null;
}

declare global {
  interface Window {
    Elm: {
      Main: {
        init: (options: { node: HTMLElement; flags: Flags }) => ElmApp;
      };
    };
  }
}

interface ElmPorts {
  setTheme: {
    subscribe: (callback: (theme: string) => void) => void;
  };
  setLanguage: {
    subscribe: (callback: (lang: string) => void) => void;
  };
}

interface ElmApp {
  ports: ElmPorts;
}

async function initApp(): Promise<void> {
  const root = document.getElementById('app');
  if (!root) {
    throw new Error('Root element #app not found');
  }

  // Load saved preferences
  const savedTheme = Theme.load();
  const savedLanguage = Language.load();

  // Apply preferences to document (only if previously saved)
  if (savedTheme) {
    Theme.set(savedTheme);
  }
  if (savedLanguage) {
    Language.set(savedLanguage);
  }

  // Initialize Elm with flags
  const app = window.Elm.Main.init({
    node: root,
    flags: {
      savedTheme,
      savedLanguage,
    },
  });

  // Subscribe to preference changes
  app.ports.setTheme.subscribe(Theme.set);
  app.ports.setLanguage.subscribe(Language.set);

  // Test Tauri command
  const greeting = await TauriCore.invoke<string>('greet', { name: 'Elm' });
  console.log(greeting);
}

document.addEventListener('DOMContentLoaded', initApp);
