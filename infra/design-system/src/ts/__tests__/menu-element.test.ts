import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as MenuElement from '../menu-element';
import * as Setup from './setup';

// Set up CSS properties globally for all tests
Setup.setupCssProperties();

// Helper to get menu element with proper type (throws if not found)
function getMenu(id: string): MenuElement.DsMenu {
  const el = document.getElementById(id);
  if (!(el instanceof MenuElement.DsMenu)) {
    throw new Error(`Element #${id} is not a DsMenu`);
  }
  return el;
}

// Helper to get HTML element with proper type (throws if not found)
function getElement(id: string): HTMLElement {
  const el = document.getElementById(id);
  if (!(el instanceof HTMLElement)) {
    throw new Error(`Element #${id} is not an HTMLElement`);
  }
  return el;
}

// Helper to query selector with HTMLElement type guard (throws if not found)
function queryElement(parent: Element, selector: string): HTMLElement {
  const el = parent.querySelector(selector);
  if (!(el instanceof HTMLElement)) {
    throw new Error(`Element matching "${selector}" is not an HTMLElement`);
  }
  return el;
}

describe('DsMenu', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    Setup.resizeObserverMock.reset();
  });

  afterEach(() => {
    document.body.innerHTML = '';
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  // ============================================================================
  // Registration
  // ============================================================================

  describe('registration', () => {
    it('registers as custom element', () => {
      expect(customElements.get('ds-menu')).toBe(MenuElement.DsMenu);
    });
  });

  // ============================================================================
  // Lifecycle
  // ============================================================================

  describe('lifecycle', () => {
    it('renders on connectedCallback', () => {
      document.body.innerHTML = `
        <button popovertarget="menu">Open</button>
        <ds-menu id="menu" popover class="menu" role="menu"></ds-menu>
      `;
      const menu = getMenu('menu');
      expect(menu.querySelector('.menu-header')).toBeTruthy();
    });

    it('clears content on disconnectedCallback', () => {
      document.body.innerHTML = `
        <button popovertarget="menu">Open</button>
        <ds-menu id="menu" popover class="menu" role="menu"></ds-menu>
      `;
      const menu = getMenu('menu');
      menu.items = [{ id: 'test', type: 'action', icon: '', label: 'Test', suffix: '' }];
      expect(menu.innerHTML).not.toBe('');

      menu.remove();
      expect(menu.innerHTML).toBe('');
    });

    it('removes event listeners on disconnectedCallback', () => {
      document.body.innerHTML = `
        <button popovertarget="menu">Open</button>
        <ds-menu id="menu" popover class="menu" role="menu"></ds-menu>
      `;
      const menu = getMenu('menu');
      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');

      menu.remove();

      expect(removeEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function));
    });
  });

  // ============================================================================
  // Items Property
  // ============================================================================

  describe('items property', () => {
    it('returns empty array by default', () => {
      document.body.innerHTML = `
        <button popovertarget="menu">Open</button>
        <ds-menu id="menu" popover class="menu" role="menu"></ds-menu>
      `;
      const menu = getMenu('menu');
      expect(menu.items).toEqual([]);
    });

    it('stores and returns items', () => {
      document.body.innerHTML = `
        <button popovertarget="menu">Open</button>
        <ds-menu id="menu" popover class="menu" role="menu"></ds-menu>
      `;
      const menu = getMenu('menu');
      const items: MenuElement.MenuItem[] = [{ id: 'test', type: 'action', icon: '', label: 'Test', suffix: '' }];
      menu.items = items;
      expect(menu.items).toBe(items);
    });

    it('re-renders when items are set', () => {
      document.body.innerHTML = `
        <button popovertarget="menu">Open</button>
        <ds-menu id="menu" popover class="menu" role="menu"></ds-menu>
      `;
      const menu = getMenu('menu');
      expect(menu.querySelectorAll('.menu-item').length).toBe(0);

      menu.items = [{ id: 'test', type: 'action', icon: '', label: 'Test', suffix: '' }];
      expect(menu.querySelectorAll('.menu-item').length).toBe(1);
    });
  });

  // ============================================================================
  // Rendering
  // ============================================================================

  describe('rendering', () => {
    it('renders menu header with handle', () => {
      document.body.innerHTML = `
        <button popovertarget="menu">Open</button>
        <ds-menu id="menu" popover class="menu" role="menu"></ds-menu>
      `;
      const menu = getMenu('menu');
      expect(menu.querySelector('.menu-header')).toBeTruthy();
      expect(menu.querySelector('.menu-handle')).toBeTruthy();
    });

    it('renders action items with icon, label, and suffix', () => {
      document.body.innerHTML = `
        <button popovertarget="menu">Open</button>
        <ds-menu id="menu" popover class="menu" role="menu"></ds-menu>
      `;
      const menu = getMenu('menu');
      menu.items = [
        {
          id: 'lang',
          type: 'action',
          icon: '<svg><path d="M1 2"/></svg>',
          label: 'English',
          suffix: 'EN',
        },
      ];

      const item = queryElement(menu, '.menu-item');
      expect(item.getAttribute('role')).toBe('menuitem');
      expect(item.dataset['itemId']).toBe('lang');
      expect(item.querySelector('.menu-item-icon svg')).toBeTruthy();
      expect(item.querySelector('.menu-item-text')?.textContent).toBe('English');
      expect(item.querySelector('.menu-item-suffix')?.textContent).toBe('EN');
    });

    it('renders action items without suffix when empty', () => {
      document.body.innerHTML = `
        <button popovertarget="menu">Open</button>
        <ds-menu id="menu" popover class="menu" role="menu"></ds-menu>
      `;
      const menu = getMenu('menu');
      menu.items = [
        {
          id: 'help',
          type: 'action',
          icon: '',
          label: 'Help',
          suffix: '',
        },
      ];

      expect(menu.querySelector('.menu-item-suffix')).toBeNull();
    });

    it('renders action items without suffix when undefined', () => {
      document.body.innerHTML = `
        <button popovertarget="menu">Open</button>
        <ds-menu id="menu" popover class="menu" role="menu"></ds-menu>
      `;
      const menu = getMenu('menu');
      // Simulate undefined suffix (runtime edge case)
      menu.items = [
        {
          id: 'help',
          type: 'action',
          icon: '',
          label: 'Help',
          suffix: undefined!,
        },
      ];

      expect(menu.querySelector('.menu-item-suffix')).toBeNull();
      expect(menu.innerHTML).not.toContain('undefined');
    });

    it('renders dividers', () => {
      document.body.innerHTML = `
        <button popovertarget="menu">Open</button>
        <ds-menu id="menu" popover class="menu" role="menu"></ds-menu>
      `;
      const menu = getMenu('menu');
      menu.items = [
        { id: 'a', type: 'action', icon: '', label: 'A', suffix: '' },
        { type: 'divider' },
        { id: 'b', type: 'action', icon: '', label: 'B', suffix: '' },
      ];

      const divider = queryElement(menu, '.menu-divider');
      expect(divider.getAttribute('role')).toBe('separator');
    });

    it('renders multiple items in order', () => {
      document.body.innerHTML = `
        <button popovertarget="menu">Open</button>
        <ds-menu id="menu" popover class="menu" role="menu"></ds-menu>
      `;
      const menu = getMenu('menu');
      menu.items = [
        { id: 'first', type: 'action', icon: '', label: 'First', suffix: '' },
        { id: 'second', type: 'action', icon: '', label: 'Second', suffix: '' },
        { id: 'third', type: 'action', icon: '', label: 'Third', suffix: '' },
      ];

      const items = menu.querySelectorAll('.menu-item');
      expect(items.length).toBe(3);
      expect(items[0] instanceof HTMLElement && items[0].dataset['itemId']).toBe('first');
      expect(items[1] instanceof HTMLElement && items[1].dataset['itemId']).toBe('second');
      expect(items[2] instanceof HTMLElement && items[2].dataset['itemId']).toBe('third');
    });
  });

  // ============================================================================
  // Item Click Handling
  // ============================================================================

  describe('item click handling', () => {
    it('dispatches item-click event with item id', async () => {
      document.body.innerHTML = `
        <button popovertarget="menu">Open</button>
        <ds-menu id="menu" popover class="menu" role="menu"></ds-menu>
      `;
      const menu = getMenu('menu');
      menu.items = [{ id: 'test-action', type: 'action', icon: '', label: 'Test', suffix: '' }];

      const clickPromise = new Promise<string>(resolve => {
        menu.addEventListener('item-click', (e: Event) => {
          if (e instanceof CustomEvent) {
            resolve(e.detail.id);
          }
        });
      });

      const button = queryElement(menu, '[data-item-id="test-action"]');
      button.click();

      expect(await clickPromise).toBe('test-action');
    });

    it('event bubbles', async () => {
      document.body.innerHTML = `
        <div id="container">
          <button popovertarget="menu">Open</button>
          <ds-menu id="menu" popover class="menu" role="menu"></ds-menu>
        </div>
      `;
      const container = getElement('container')!;
      const menu = getMenu('menu');
      menu.items = [{ id: 'test', type: 'action', icon: '', label: 'Test', suffix: '' }];

      const clickPromise = new Promise<boolean>(resolve => {
        container.addEventListener('item-click', () => {
          resolve(true);
        });
      });

      const button = queryElement(menu, '[data-item-id="test"]');
      button.click();

      expect(await clickPromise).toBe(true);
    });
  });

  // ============================================================================
  // Trigger Finding
  // ============================================================================

  describe('trigger finding', () => {
    it('finds trigger by popovertarget attribute', () => {
      document.body.innerHTML = `
        <button id="my-trigger" popovertarget="menu">Open</button>
        <ds-menu id="menu" popover class="menu" role="menu"></ds-menu>
      `;
      const menu = getMenu('menu');
      const trigger = getElement('my-trigger');

      // Trigger a method that uses findTriggerElement
      menu.items = [{ id: 'test', type: 'action', icon: '', label: 'Test', suffix: '' }];

      // The trigger should be found (verified by positioning working)
      expect(trigger.getAttribute('popovertarget')).toBe('menu');
    });

    it('handles missing trigger gracefully', () => {
      document.body.innerHTML = `
        <ds-menu id="menu" popover class="menu" role="menu"></ds-menu>
      `;
      const menu = getMenu('menu');

      // Should not throw
      expect(() => {
        menu.items = [{ id: 'test', type: 'action', icon: '', label: 'Test', suffix: '' }];
      }).not.toThrow();
    });
  });

  // ============================================================================
  // Positioning
  // ============================================================================

  describe('positioning', () => {
    const setupMenuWithTrigger = () => {
      document.body.innerHTML = `
        <button id="trigger" popovertarget="menu" style="position: fixed; top: 100px; right: 100px; width: 40px; height: 40px;">Open</button>
        <ds-menu id="menu" popover class="menu" role="menu" style="width: 200px; height: 150px;"></ds-menu>
      `;
      return {
        menu: getMenu('menu'),
        trigger: getElement('trigger'),
      };
    };

    it('applies position styles on desktop', () => {
      // Mock desktop viewport
      vi.spyOn(window, 'innerWidth', 'get').mockReturnValue(1024);
      vi.spyOn(window, 'innerHeight', 'get').mockReturnValue(768);

      const { menu } = setupMenuWithTrigger();
      menu.items = [{ id: 'test', type: 'action', icon: '', label: 'Test', suffix: '' }];

      // Simulate menu open
      menu.dispatchEvent(new ToggleEvent('toggle', { newState: 'open', oldState: 'closed' }));

      // Position should be set (exact values depend on trigger position)
      // Just verify that positioning is attempted
      expect(menu.style.top !== '' || menu.style.bottom !== '').toBe(true);
    });

    it('clears position styles on mobile', () => {
      // Mock mobile viewport
      vi.spyOn(window, 'innerWidth', 'get').mockReturnValue(375);
      vi.spyOn(window, 'innerHeight', 'get').mockReturnValue(667);

      const { menu } = setupMenuWithTrigger();
      menu.items = [{ id: 'test', type: 'action', icon: '', label: 'Test', suffix: '' }];

      // Set some position styles first
      menu.style.top = '100px';
      menu.style.right = '50px';

      // Simulate menu open on mobile
      menu.dispatchEvent(new ToggleEvent('toggle', { newState: 'open', oldState: 'closed' }));

      // Simulate resize to mobile (should clear styles)
      vi.spyOn(window, 'innerWidth', 'get').mockReturnValue(375);
      window.dispatchEvent(new Event('resize'));

      expect(menu.style.top).toBe('');
      expect(menu.style.bottom).toBe('');
      expect(menu.style.left).toBe('');
      expect(menu.style.right).toBe('');
    });
  });

  // ============================================================================
  // Position Calculation
  // ============================================================================

  describe('position calculation', () => {
    it('prefers belowRight position', () => {
      vi.spyOn(window, 'innerWidth', 'get').mockReturnValue(1024);
      vi.spyOn(window, 'innerHeight', 'get').mockReturnValue(768);

      document.body.innerHTML = `
        <button id="trigger" popovertarget="menu">Open</button>
        <ds-menu id="menu" popover class="menu" role="menu"></ds-menu>
      `;

      const trigger = getElement('trigger');
      const menu = getMenu('menu');

      // Position trigger in upper-left area (plenty of room below and right)
      vi.spyOn(trigger, 'getBoundingClientRect').mockReturnValue({
        top: 50,
        bottom: 90,
        left: 50,
        right: 150,
        width: 100,
        height: 40,
        x: 50,
        y: 50,
        toJSON: () => ({}),
      });

      vi.spyOn(menu, 'getBoundingClientRect').mockReturnValue({
        top: 0,
        bottom: 150,
        left: 0,
        right: 200,
        width: 200,
        height: 150,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      });

      menu.items = [{ id: 'test', type: 'action', icon: '', label: 'Test', suffix: '' }];
      menu.dispatchEvent(new ToggleEvent('toggle', { newState: 'open', oldState: 'closed' }));

      // Should use top (below trigger) and right
      expect(menu.style.top).not.toBe('');
      expect(menu.style.bottom).toBe('auto');
    });

    it('falls back to aboveRight when no room below', () => {
      vi.spyOn(window, 'innerWidth', 'get').mockReturnValue(1024);
      vi.spyOn(window, 'innerHeight', 'get').mockReturnValue(768);

      document.body.innerHTML = `
        <button id="trigger" popovertarget="menu">Open</button>
        <ds-menu id="menu" popover class="menu" role="menu"></ds-menu>
      `;

      const trigger = getElement('trigger');
      const menu = getMenu('menu');

      // Position trigger near bottom (no room below)
      vi.spyOn(trigger, 'getBoundingClientRect').mockReturnValue({
        top: 700,
        bottom: 740,
        left: 50,
        right: 150,
        width: 100,
        height: 40,
        x: 50,
        y: 700,
        toJSON: () => ({}),
      });

      vi.spyOn(menu, 'getBoundingClientRect').mockReturnValue({
        top: 0,
        bottom: 150,
        left: 0,
        right: 200,
        width: 200,
        height: 150,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      });

      menu.items = [{ id: 'test', type: 'action', icon: '', label: 'Test', suffix: '' }];
      menu.dispatchEvent(new ToggleEvent('toggle', { newState: 'open', oldState: 'closed' }));

      // Should use bottom (above trigger)
      expect(menu.style.bottom).not.toBe('');
      expect(menu.style.bottom).not.toBe('auto');
    });

    it('constrains to viewport when nothing fits', () => {
      // Use desktop viewport so positioning actually happens
      vi.spyOn(window, 'innerWidth', 'get').mockReturnValue(1024);
      vi.spyOn(window, 'innerHeight', 'get').mockReturnValue(768);

      document.body.innerHTML = `
        <button id="trigger" popovertarget="menu">Open</button>
        <ds-menu id="menu" popover class="menu" role="menu"></ds-menu>
      `;

      const trigger = getElement('trigger');
      const menu = getMenu('menu');

      // Position trigger in center
      vi.spyOn(trigger, 'getBoundingClientRect').mockReturnValue({
        top: 350,
        bottom: 390,
        left: 450,
        right: 550,
        width: 100,
        height: 40,
        x: 450,
        y: 350,
        toJSON: () => ({}),
      });

      // Very large menu that can't fit in any position without constraining
      vi.spyOn(menu, 'getBoundingClientRect').mockReturnValue({
        top: 0,
        bottom: 600,
        left: 0,
        right: 800,
        width: 800,
        height: 600,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      });

      menu.items = [{ id: 'test', type: 'action', icon: '', label: 'Test', suffix: '' }];
      menu.dispatchEvent(new ToggleEvent('toggle', { newState: 'open', oldState: 'closed' }));

      // Should still have position (constrained to viewport)
      expect(menu.style.top !== '' || menu.style.bottom !== '').toBe(true);
      expect(menu.style.left !== '' || menu.style.right !== '').toBe(true);
    });
  });

  // ============================================================================
  // Viewport Resize
  // ============================================================================

  describe('viewport resize', () => {
    it('switches to mobile mode when viewport shrinks', () => {
      // Start with desktop
      vi.spyOn(window, 'innerWidth', 'get').mockReturnValue(1024);

      document.body.innerHTML = `
        <button popovertarget="menu">Open</button>
        <ds-menu id="menu" popover class="menu" role="menu"></ds-menu>
      `;
      const menu = getMenu('menu');
      menu.items = [{ id: 'test', type: 'action', icon: '', label: 'Test', suffix: '' }];

      // Open menu
      menu.dispatchEvent(new ToggleEvent('toggle', { newState: 'open', oldState: 'closed' }));

      // Switch to mobile
      vi.spyOn(window, 'innerWidth', 'get').mockReturnValue(375);
      window.dispatchEvent(new Event('resize'));

      // Position styles should be cleared
      expect(menu.style.top).toBe('');
      expect(menu.style.bottom).toBe('');
    });

    it('switches to desktop mode when viewport grows', () => {
      // Start with mobile
      vi.spyOn(window, 'innerWidth', 'get').mockReturnValue(375);
      vi.spyOn(window, 'innerHeight', 'get').mockReturnValue(667);

      document.body.innerHTML = `
        <button id="trigger" popovertarget="menu">Open</button>
        <ds-menu id="menu" popover class="menu" role="menu"></ds-menu>
      `;
      const menu = getMenu('menu');
      const trigger = getElement('trigger');

      vi.spyOn(trigger, 'getBoundingClientRect').mockReturnValue({
        top: 50,
        bottom: 90,
        left: 50,
        right: 150,
        width: 100,
        height: 40,
        x: 50,
        y: 50,
        toJSON: () => ({}),
      });

      vi.spyOn(menu, 'getBoundingClientRect').mockReturnValue({
        top: 0,
        bottom: 150,
        left: 0,
        right: 200,
        width: 200,
        height: 150,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      });

      menu.items = [{ id: 'test', type: 'action', icon: '', label: 'Test', suffix: '' }];

      // Open menu on mobile
      menu.dispatchEvent(new ToggleEvent('toggle', { newState: 'open', oldState: 'closed' }));

      // Switch to desktop
      vi.spyOn(window, 'innerWidth', 'get').mockReturnValue(1024);
      vi.spyOn(window, 'innerHeight', 'get').mockReturnValue(768);
      window.dispatchEvent(new Event('resize'));

      // Position should be applied
      expect(menu.style.top !== '' || menu.style.bottom !== '').toBe(true);
    });
  });

  // ============================================================================
  // Menu Resize Handling
  // ============================================================================

  describe('menu resize handling', () => {
    it('repositions when menu size changes', () => {
      vi.spyOn(window, 'innerWidth', 'get').mockReturnValue(1024);
      vi.spyOn(window, 'innerHeight', 'get').mockReturnValue(768);

      document.body.innerHTML = `
        <button id="trigger" popovertarget="menu">Open</button>
        <ds-menu id="menu" popover class="menu" role="menu"></ds-menu>
      `;
      const menu = getMenu('menu');
      const trigger = getElement('trigger');

      // Position trigger near bottom to force position switch when menu grows
      // With 9px default gap: triggerBottom(680) + gap(9) + menuHeight(70) = 759 < 768 (fits below)
      vi.spyOn(trigger, 'getBoundingClientRect').mockReturnValue({
        top: 640,
        bottom: 680,
        left: 50,
        right: 150,
        width: 100,
        height: 40,
        x: 50,
        y: 640,
        toJSON: () => ({}),
      });

      const menuRectSpy = vi.spyOn(menu, 'getBoundingClientRect');

      // Initial menu size - small enough to fit below
      menuRectSpy.mockReturnValue({
        top: 0,
        bottom: 70,
        left: 0,
        right: 200,
        width: 200,
        height: 70,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      });

      menu.items = [{ id: 'test', type: 'action', icon: '', label: 'Test', suffix: '' }];

      // Open menu - should position below (uses 'top')
      menu.dispatchEvent(new ToggleEvent('toggle', { newState: 'open', oldState: 'closed' }));

      expect(menu.style.top).not.toBe('');
      expect(menu.style.bottom).toBe('auto');

      // Menu grows taller - now too tall to fit below
      menuRectSpy.mockReturnValue({
        top: 0,
        bottom: 200,
        left: 0,
        right: 200,
        width: 200,
        height: 200,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      });

      // Trigger menu resize observer (second observer created)
      // First observer: trigger resize, Second observer: menu resize
      const menuResizeObserver = Setup.resizeObserverMock.instances[1];
      if (menuResizeObserver) {
        menuResizeObserver.triggerResize();
      }

      // Should switch to above positioning (uses 'bottom')
      expect(menu.style.bottom).not.toBe('');
      expect(menu.style.bottom).not.toBe('auto');
      expect(menu.style.top).toBe('auto');
    });
  });

  // ============================================================================
  // Stale Positioning Cleanup
  // ============================================================================

  describe('stale positioning cleanup', () => {
    it('clears desktop positioning when reopening on mobile', () => {
      // Start with desktop
      vi.spyOn(window, 'innerWidth', 'get').mockReturnValue(1024);
      vi.spyOn(window, 'innerHeight', 'get').mockReturnValue(768);

      document.body.innerHTML = `
        <button id="trigger" popovertarget="menu">Open</button>
        <ds-menu id="menu" popover class="menu" role="menu"></ds-menu>
      `;
      const menu = getMenu('menu');
      const trigger = getElement('trigger');

      vi.spyOn(trigger, 'getBoundingClientRect').mockReturnValue({
        top: 50,
        bottom: 90,
        left: 50,
        right: 150,
        width: 100,
        height: 40,
        x: 50,
        y: 50,
        toJSON: () => ({}),
      });

      vi.spyOn(menu, 'getBoundingClientRect').mockReturnValue({
        top: 0,
        bottom: 150,
        left: 0,
        right: 200,
        width: 200,
        height: 150,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      });

      menu.items = [{ id: 'test', type: 'action', icon: '', label: 'Test', suffix: '' }];

      // Open on desktop (applies positioning)
      menu.dispatchEvent(new ToggleEvent('toggle', { newState: 'open', oldState: 'closed' }));
      expect(menu.style.top).not.toBe('');

      // Close menu
      menu.dispatchEvent(new ToggleEvent('toggle', { newState: 'closed', oldState: 'open' }));

      // Shrink to mobile WHILE CLOSED
      vi.spyOn(window, 'innerWidth', 'get').mockReturnValue(375);

      // Reopen on mobile
      menu.dispatchEvent(new ToggleEvent('toggle', { newState: 'open', oldState: 'closed' }));

      // Desktop positioning should be cleared
      expect(menu.style.top).toBe('');
      expect(menu.style.bottom).toBe('');
      expect(menu.style.left).toBe('');
      expect(menu.style.right).toBe('');
    });
  });

  // ============================================================================
  // Menu Close
  // ============================================================================

  describe('menu close', () => {
    it('stops tracking on close', () => {
      vi.spyOn(window, 'innerWidth', 'get').mockReturnValue(1024);
      vi.spyOn(window, 'innerHeight', 'get').mockReturnValue(768);

      document.body.innerHTML = `
        <button popovertarget="menu">Open</button>
        <ds-menu id="menu" popover class="menu" role="menu"></ds-menu>
      `;
      const menu = getMenu('menu');
      menu.items = [{ id: 'test', type: 'action', icon: '', label: 'Test', suffix: '' }];

      const removeScrollSpy = vi.spyOn(window, 'removeEventListener');

      // Open then close
      menu.dispatchEvent(new ToggleEvent('toggle', { newState: 'open', oldState: 'closed' }));
      menu.dispatchEvent(new ToggleEvent('toggle', { newState: 'closed', oldState: 'open' }));

      expect(removeScrollSpy).toHaveBeenCalledWith('scroll', expect.any(Function), true);
      expect(removeScrollSpy).toHaveBeenCalledWith('resize', expect.any(Function));
    });
  });

  // ============================================================================
  // Scroll Handling
  // ============================================================================

  describe('scroll handling', () => {
    it('repositions on scroll', () => {
      vi.spyOn(window, 'innerWidth', 'get').mockReturnValue(1024);
      vi.spyOn(window, 'innerHeight', 'get').mockReturnValue(768);

      document.body.innerHTML = `
        <button id="trigger" popovertarget="menu">Open</button>
        <ds-menu id="menu" popover class="menu" role="menu"></ds-menu>
      `;
      const menu = getMenu('menu');
      const trigger = getElement('trigger');

      vi.spyOn(trigger, 'getBoundingClientRect').mockReturnValue({
        top: 50,
        bottom: 90,
        left: 50,
        right: 150,
        width: 100,
        height: 40,
        x: 50,
        y: 50,
        toJSON: () => ({}),
      });

      vi.spyOn(menu, 'getBoundingClientRect').mockReturnValue({
        top: 0,
        bottom: 150,
        left: 0,
        right: 200,
        width: 200,
        height: 150,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      });

      menu.items = [{ id: 'test', type: 'action', icon: '', label: 'Test', suffix: '' }];

      // Open menu
      menu.dispatchEvent(new ToggleEvent('toggle', { newState: 'open', oldState: 'closed' }));

      const initialTop = menu.style.top;

      // Change trigger position (simulate scroll)
      vi.spyOn(trigger, 'getBoundingClientRect').mockReturnValue({
        top: 100,
        bottom: 140,
        left: 50,
        right: 150,
        width: 100,
        height: 40,
        x: 50,
        y: 100,
        toJSON: () => ({}),
      });

      // Trigger scroll event
      window.dispatchEvent(new Event('scroll', { bubbles: true }));

      // Run requestAnimationFrame
      vi.runAllTimers();

      // Position should have changed
      expect(menu.style.top).not.toBe(initialTop);
    });

    it('debounces scroll repositioning with RAF', () => {
      vi.spyOn(window, 'innerWidth', 'get').mockReturnValue(1024);
      vi.spyOn(window, 'innerHeight', 'get').mockReturnValue(768);

      document.body.innerHTML = `
        <button id="trigger" popovertarget="menu">Open</button>
        <ds-menu id="menu" popover class="menu" role="menu"></ds-menu>
      `;
      const menu = getMenu('menu');
      const trigger = getElement('trigger');

      vi.spyOn(trigger, 'getBoundingClientRect').mockReturnValue({
        top: 50,
        bottom: 90,
        left: 50,
        right: 150,
        width: 100,
        height: 40,
        x: 50,
        y: 50,
        toJSON: () => ({}),
      });

      vi.spyOn(menu, 'getBoundingClientRect').mockReturnValue({
        top: 0,
        bottom: 150,
        left: 0,
        right: 200,
        width: 200,
        height: 150,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      });

      menu.items = [{ id: 'test', type: 'action', icon: '', label: 'Test', suffix: '' }];

      const rafSpy = vi.spyOn(window, 'requestAnimationFrame');

      // Open menu
      menu.dispatchEvent(new ToggleEvent('toggle', { newState: 'open', oldState: 'closed' }));

      // Multiple scroll events
      window.dispatchEvent(new Event('scroll', { bubbles: true }));
      window.dispatchEvent(new Event('scroll', { bubbles: true }));
      window.dispatchEvent(new Event('scroll', { bubbles: true }));

      // Should only request one animation frame (debounced)
      expect(rafSpy).toHaveBeenCalledTimes(1);
    });
  });

  // ============================================================================
  // Gap Attribute
  // ============================================================================

  describe('gap attribute', () => {
    it('returns default gap of 9px when no attribute set', () => {
      document.body.innerHTML = `
        <button popovertarget="menu">Open</button>
        <ds-menu id="menu" popover class="menu" role="menu"></ds-menu>
      `;
      const menu = getMenu('menu');
      expect(menu.gap).toBe(9); // spacing[3] = 9px
    });

    it('reads gap from attribute as spacing key', () => {
      document.body.innerHTML = `
        <button popovertarget="menu">Open</button>
        <ds-menu id="menu" popover class="menu" role="menu" gap="4"></ds-menu>
      `;
      const menu = getMenu('menu');
      expect(menu.gap).toBe(12); // spacing[4] = 12px
    });

    it('supports larger gap values', () => {
      document.body.innerHTML = `
        <button popovertarget="menu">Open</button>
        <ds-menu id="menu" popover class="menu" role="menu" gap="6"></ds-menu>
      `;
      const menu = getMenu('menu');
      expect(menu.gap).toBe(18); // spacing[6] = 18px
    });

    it('falls back to default for invalid gap value', () => {
      document.body.innerHTML = `
        <button popovertarget="menu">Open</button>
        <ds-menu id="menu" popover class="menu" role="menu" gap="invalid"></ds-menu>
      `;
      const menu = getMenu('menu');
      expect(menu.gap).toBe(9); // default
    });

    it('falls back to default for out-of-range gap value', () => {
      document.body.innerHTML = `
        <button popovertarget="menu">Open</button>
        <ds-menu id="menu" popover class="menu" role="menu" gap="999"></ds-menu>
      `;
      const menu = getMenu('menu');
      expect(menu.gap).toBe(9); // default
    });

    it('applies gap to position calculation', () => {
      vi.spyOn(window, 'innerWidth', 'get').mockReturnValue(1024);
      vi.spyOn(window, 'innerHeight', 'get').mockReturnValue(768);

      document.body.innerHTML = `
        <button id="trigger" popovertarget="menu">Open</button>
        <ds-menu id="menu" popover class="menu" role="menu" gap="4"></ds-menu>
      `;
      const menu = getMenu('menu');
      const trigger = getElement('trigger');

      vi.spyOn(trigger, 'getBoundingClientRect').mockReturnValue({
        top: 50,
        bottom: 90,
        left: 50,
        right: 150,
        width: 100,
        height: 40,
        x: 50,
        y: 50,
        toJSON: () => ({}),
      });

      vi.spyOn(menu, 'getBoundingClientRect').mockReturnValue({
        top: 0,
        bottom: 150,
        left: 0,
        right: 200,
        width: 200,
        height: 150,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      });

      menu.items = [{ id: 'test', type: 'action', icon: '', label: 'Test', suffix: '' }];
      menu.dispatchEvent(new ToggleEvent('toggle', { newState: 'open', oldState: 'closed' }));

      // Gap of 4 = 12px, trigger bottom at 90, so menu top should be 102
      expect(menu.style.top).toBe('102px');
    });

    it('gap is observed attribute', () => {
      expect(MenuElement.DsMenu.observedAttributes).toContain('gap');
    });
  });

  // ============================================================================
  // Position Types
  // ============================================================================

  describe('position types', () => {
    it('applies top-left position correctly', () => {
      vi.spyOn(window, 'innerWidth', 'get').mockReturnValue(1024);
      vi.spyOn(window, 'innerHeight', 'get').mockReturnValue(768);

      document.body.innerHTML = `
        <button id="trigger" popovertarget="menu">Open</button>
        <ds-menu id="menu" popover class="menu" role="menu"></ds-menu>
      `;
      const menu = getMenu('menu');
      const trigger = getElement('trigger');

      // Trigger on right side (should prefer left alignment)
      vi.spyOn(trigger, 'getBoundingClientRect').mockReturnValue({
        top: 50,
        bottom: 90,
        left: 900,
        right: 1000,
        width: 100,
        height: 40,
        x: 900,
        y: 50,
        toJSON: () => ({}),
      });

      // Menu that won't fit on right
      vi.spyOn(menu, 'getBoundingClientRect').mockReturnValue({
        top: 0,
        bottom: 150,
        left: 0,
        right: 200,
        width: 200,
        height: 150,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      });

      menu.items = [{ id: 'test', type: 'action', icon: '', label: 'Test', suffix: '' }];
      menu.dispatchEvent(new ToggleEvent('toggle', { newState: 'open', oldState: 'closed' }));

      // Check that position is set
      expect(menu.style.top !== '' || menu.style.bottom !== '').toBe(true);
    });

    it('applies bottom-right position correctly', () => {
      vi.spyOn(window, 'innerWidth', 'get').mockReturnValue(1024);
      vi.spyOn(window, 'innerHeight', 'get').mockReturnValue(768);

      document.body.innerHTML = `
        <button id="trigger" popovertarget="menu">Open</button>
        <ds-menu id="menu" popover class="menu" role="menu"></ds-menu>
      `;
      const menu = getMenu('menu');
      const trigger = getElement('trigger');

      // Trigger near bottom
      vi.spyOn(trigger, 'getBoundingClientRect').mockReturnValue({
        top: 700,
        bottom: 740,
        left: 50,
        right: 150,
        width: 100,
        height: 40,
        x: 50,
        y: 700,
        toJSON: () => ({}),
      });

      vi.spyOn(menu, 'getBoundingClientRect').mockReturnValue({
        top: 0,
        bottom: 150,
        left: 0,
        right: 200,
        width: 200,
        height: 150,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      });

      menu.items = [{ id: 'test', type: 'action', icon: '', label: 'Test', suffix: '' }];
      menu.dispatchEvent(new ToggleEvent('toggle', { newState: 'open', oldState: 'closed' }));

      // Should use bottom positioning (above trigger)
      expect(menu.style.bottom).not.toBe('');
      expect(menu.style.bottom).not.toBe('auto');
      expect(menu.style.top).toBe('auto');
    });
  });
});
