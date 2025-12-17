// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import './main.css';

import * as TauriCore from '@tauri-apps/api/core';
import * as Theme from './theme';

declare global {
  interface Window {
    Elm: {
      Main: {
        init: (options: { node: HTMLElement }) => ElmApp;
      };
    };
  }
}

interface ElmPorts {
  setTheme: {
    subscribe: (callback: (theme: string) => void) => void;
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

  // Load saved theme
  const savedTheme = Theme.load();
  Theme.set(savedTheme);

  // Initialize Elm (loaded via script tag)
  const app = window.Elm.Main.init({ node: root });

  // Subscribe to theme changes
  app.ports.setTheme.subscribe(Theme.set);

  // Test Tauri command
  const greeting = await TauriCore.invoke<string>('greet', { name: 'Elm' });
  console.log(greeting);
}

document.addEventListener('DOMContentLoaded', initApp);
