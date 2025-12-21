// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

/**
 * ds-menu Custom Element
 *
 * Responsive menu using native HTML popover.
 * Dropdown on desktop (≥768px), bottom sheet on mobile (<768px).
 * Automatically positions relative to trigger button on desktop.
 *
 * Properties:
 *   - items: MenuItem[] - menu items (actions and dividers), triggers re-render
 *
 * Required attributes:
 *   - popover - enables native popover behavior
 *   - class="menu" - applies menu styles
 *   - role="menu" - accessibility role
 *
 * Events:
 *   - item-click: CustomEvent<{ id: string }> - fired when item clicked
 *
 * HTML usage:
 *   <button popovertarget="settings-menu">Settings</button>
 *   <ds-menu id="settings-menu" popover class="menu" role="menu"></ds-menu>
 *
 * Elm usage:
 *   Menu.view
 *       { id = "settings-menu"
 *       , items = menuItems
 *       , onItemClick = [ ("toggle-theme", ToggleTheme) ]
 *       }
 */

import * as Tokens from './tokens';

/**
 * Action menu item (clickable).
 */
export interface ActionMenuItem {
  id: string;
  type: 'action';
  icon: string; // SVG string from Elm's Icons.toString
  label: string;
  suffix: string; // Empty string if no suffix
}

/**
 * Divider menu item (visual separator).
 */
export interface DividerMenuItem {
  type: 'divider';
}

/**
 * Menu item (action or divider).
 */
export type MenuItem = ActionMenuItem | DividerMenuItem;

/**
 * Menu position anchored to top-left corner.
 */
interface PositionTopLeft {
  top: number;
  left: number;
}

/**
 * Menu position anchored to top-right corner.
 */
interface PositionTopRight {
  top: number;
  right: number;
}

/**
 * Menu position anchored to bottom-left corner.
 */
interface PositionBottomLeft {
  bottom: number;
  left: number;
}

/**
 * Menu position anchored to bottom-right corner.
 */
interface PositionBottomRight {
  bottom: number;
  right: number;
}

/**
 * Menu position (union of 4 anchor types).
 * Used for responsive positioning relative to trigger button.
 */
type Position = PositionTopLeft | PositionTopRight | PositionBottomLeft | PositionBottomRight;

/**
 * Extend HTMLElementTagNameMap for proper TypeScript support.
 * Ensures document.createElement('ds-menu') returns DsMenu type.
 */
declare global {
  interface HTMLElementTagNameMap {
    'ds-menu': DsMenu;
  }
}

/**
 * Desktop breakpoint in pixels.
 * Below this: bottom sheet (mobile). At or above: dropdown (desktop).
 */
const DESKTOP_BREAKPOINT = 768;

export class DsMenu extends HTMLElement {
  private _items: MenuItem[] = [];
  private _triggerResizeObserver: ResizeObserver | null = null;
  private _menuResizeObserver: ResizeObserver | null = null;
  private _intersectionObserver: IntersectionObserver | null = null;
  private _repositionRAF: number | null = null;

  static get observedAttributes(): string[] {
    return ['gap'];
  }

  connectedCallback(): void {
    this.setupPopoverEventListener();
    this.render();
  }

  attributeChangedCallback(_name: string, _oldValue: string | null, _newValue: string | null): void {
    // Gap change only affects positioning, which happens on menu open
  }

  disconnectedCallback(): void {
    this.teardownPopoverEventListener();
    this.stopTrackingTriggerPosition();
    this.stopWatchingViewportChanges();
    this.innerHTML = '';
  }

  get items(): MenuItem[] {
    return this._items;
  }

  set items(value: MenuItem[]) {
    this._items = value;
    this.render();
  }

  /**
   * Gap between trigger and menu in pixels.
   * Reads from 'gap' attribute as spacing key (1-24), defaults to 3 (9px).
   * Maps to tokens.spacing object: 1=3px, 2=6px, 3=9px, 4=12px, 6=18px, etc.
   */
  get gap(): number {
    const tokens = Tokens.getTokens();
    const attr = this.getAttribute('gap');
    if (attr) {
      const key = parseInt(attr, 10);
      const entry = Object.entries(tokens.spacing).find(([k]) => parseInt(k, 10) === key);
      if (entry) {
        return entry[1];
      }
    }
    return tokens.spacing[3]; // 9px default
  }

  // ============================================================================
  // Popover Event Handling
  // ============================================================================

  private setupPopoverEventListener(): void {
    this.addEventListener('toggle', this.onPopoverToggle);
  }

  private teardownPopoverEventListener(): void {
    this.removeEventListener('toggle', this.onPopoverToggle);
  }

  private onPopoverToggle = (event: Event): void => {
    if (!(event instanceof ToggleEvent)) return;

    const isOpening = event.newState === 'open';
    const isClosing = event.newState === 'closed';

    if (isOpening) {
      this.handleMenuOpen();
    } else if (isClosing) {
      this.handleMenuClose();
    }
  };

  private handleMenuOpen(): void {
    if (this.isDesktopView()) {
      this.positionMenuRelativeToTrigger();
      this.startTrackingTriggerPosition();
    } else {
      // Clear any stale desktop positioning styles from previous open
      this.clearPositioningStyles();
    }
    this.watchForViewportChanges();
  }

  private handleMenuClose(): void {
    this.stopTrackingTriggerPosition();
    this.stopWatchingViewportChanges();
  }

  // ============================================================================
  // Trigger Position Tracking
  // ============================================================================

  private startTrackingTriggerPosition(): void {
    const trigger = this.findTriggerElement();
    if (!trigger) return;

    this.observeTriggerResize(trigger);
    this.observeMenuResize();
    this.observeTriggerVisibility(trigger);
    this.listenToScrollEvents();
  }

  private stopTrackingTriggerPosition(): void {
    this.disconnectTriggerResizeObserver();
    this.disconnectMenuResizeObserver();
    this.disconnectIntersectionObserver();
    this.cancelPendingRepositioning();
    this.removeScrollListener();
  }

  private observeTriggerResize(trigger: HTMLElement): void {
    this._triggerResizeObserver = new ResizeObserver(this.onTriggerResize);
    this._triggerResizeObserver.observe(trigger);
  }

  private observeMenuResize(): void {
    this._menuResizeObserver = new ResizeObserver(this.onMenuResize);
    this._menuResizeObserver.observe(this);
  }

  private observeTriggerVisibility(trigger: HTMLElement): void {
    this._intersectionObserver = new IntersectionObserver(this.onTriggerVisibilityChange, { threshold: 0 });
    this._intersectionObserver.observe(trigger);
  }

  private onTriggerResize = (): void => {
    this.positionMenuRelativeToTrigger();
  };

  private onMenuResize = (): void => {
    this.positionMenuRelativeToTrigger();
  };

  private onTriggerVisibilityChange = (entries: IntersectionObserverEntry[]): void => {
    const entry = entries[0];
    if (!entry) return;

    const isOffScreen = entry.intersectionRatio === 0;
    if (isOffScreen) {
      this.closeMenu();
    }
  };

  private listenToScrollEvents(): void {
    window.addEventListener('scroll', this.onScroll, true);
  }

  private onScroll = (): void => {
    this.scheduleRepositioning();
  };

  private scheduleRepositioning(): void {
    if (this._repositionRAF !== null) return;

    this._repositionRAF = requestAnimationFrame(() => {
      this._repositionRAF = null;
      this.positionMenuRelativeToTrigger();
    });
  }

  private disconnectTriggerResizeObserver(): void {
    if (this._triggerResizeObserver) {
      this._triggerResizeObserver.disconnect();
      this._triggerResizeObserver = null;
    }
  }

  private disconnectMenuResizeObserver(): void {
    if (this._menuResizeObserver) {
      this._menuResizeObserver.disconnect();
      this._menuResizeObserver = null;
    }
  }

  private disconnectIntersectionObserver(): void {
    if (this._intersectionObserver) {
      this._intersectionObserver.disconnect();
      this._intersectionObserver = null;
    }
  }

  private cancelPendingRepositioning(): void {
    if (this._repositionRAF !== null) {
      cancelAnimationFrame(this._repositionRAF);
      this._repositionRAF = null;
    }
  }

  private removeScrollListener(): void {
    window.removeEventListener('scroll', this.onScroll, true);
  }

  // ============================================================================
  // Viewport Change Handling
  // ============================================================================

  private watchForViewportChanges(): void {
    window.addEventListener('resize', this.onViewportResize);
  }

  private stopWatchingViewportChanges(): void {
    window.removeEventListener('resize', this.onViewportResize);
  }

  private onViewportResize = (): void => {
    if (this.isMobileView()) {
      this.switchToMobileMode();
    } else {
      this.switchToDesktopMode();
    }
  };

  private switchToMobileMode(): void {
    this.stopTrackingTriggerPosition();
    this.clearPositioningStyles();
  }

  private switchToDesktopMode(): void {
    const needsSetup = !this._triggerResizeObserver;
    if (needsSetup) {
      this.startTrackingTriggerPosition();
    }
    this.positionMenuRelativeToTrigger();
  }

  private clearPositioningStyles(): void {
    this.style.top = '';
    this.style.bottom = '';
    this.style.left = '';
    this.style.right = '';
  }

  // ============================================================================
  // Menu Positioning Logic
  // ============================================================================

  private positionMenuRelativeToTrigger(): void {
    const trigger = this.findTriggerElement();
    if (!trigger) return;

    const bestPosition = this.calculateBestPosition(trigger);
    this.applyPosition(bestPosition);
  }

  private calculateBestPosition(trigger: HTMLElement): Position {
    const triggerRect = trigger.getBoundingClientRect();
    const menuRect = this.getBoundingClientRect();
    const viewport = this.getViewportDimensions();

    const candidatePositions = this.generateCandidatePositions(triggerRect);
    const bestFit = this.findBestFittingPosition(candidatePositions, menuRect, viewport);

    return bestFit;
  }

  private generateCandidatePositions(triggerRect: DOMRect) {
    const gap = this.gap;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    const belowRight: PositionTopRight = {
      top: triggerRect.bottom + gap,
      right: viewportWidth - triggerRect.right,
    };
    const aboveRight: PositionBottomRight = {
      bottom: viewportHeight - triggerRect.top + gap,
      right: viewportWidth - triggerRect.right,
    };
    const belowLeft: PositionTopLeft = {
      top: triggerRect.bottom + gap,
      left: triggerRect.left,
    };
    const aboveLeft: PositionBottomLeft = {
      bottom: viewportHeight - triggerRect.top + gap,
      left: triggerRect.left,
    };

    return { belowRight, aboveRight, belowLeft, aboveLeft };
  }

  private findBestFittingPosition(
    candidates: ReturnType<typeof this.generateCandidatePositions>,
    menuRect: DOMRect,
    viewport: { width: number; height: number }
  ): Position {
    const { belowRight, aboveRight, belowLeft, aboveLeft } = candidates;

    const positionsInPriorityOrder = [belowRight, aboveRight, belowLeft, aboveLeft];

    for (const position of positionsInPriorityOrder) {
      if (this.positionFitsInViewport(position, menuRect, viewport)) {
        return position;
      }
    }

    // None fit perfectly, constrain to viewport
    return this.constrainToViewport(belowRight, menuRect, viewport);
  }

  private positionFitsInViewport(
    position: Position,
    menuRect: DOMRect,
    viewport: { width: number; height: number }
  ): boolean {
    const overflowsVertically = this.wouldOverflowVertically(position, menuRect, viewport);
    const overflowsHorizontally = this.wouldOverflowHorizontally(position, menuRect, viewport);

    return !overflowsVertically && !overflowsHorizontally;
  }

  private wouldOverflowVertically(
    position: Position,
    menuRect: DOMRect,
    viewport: { width: number; height: number }
  ): boolean {
    if ('top' in position) {
      const overflowsTop = position.top < 0;
      const overflowsBottom = position.top + menuRect.height > viewport.height;
      return overflowsTop || overflowsBottom;
    }

    const overflowsBottom = position.bottom < 0;
    const overflowsTop = position.bottom + menuRect.height > viewport.height;
    return overflowsTop || overflowsBottom;
  }

  private wouldOverflowHorizontally(
    position: Position,
    menuRect: DOMRect,
    viewport: { width: number; height: number }
  ): boolean {
    if ('left' in position) {
      const overflowsLeft = position.left < 0;
      const overflowsRight = position.left + menuRect.width > viewport.width;
      return overflowsLeft || overflowsRight;
    }

    const left = viewport.width - position.right - menuRect.width;
    const overflowsLeft = left < 0;
    const overflowsRight = left + menuRect.width > viewport.width;
    return overflowsLeft || overflowsRight;
  }

  private constrainToViewport(
    position: PositionTopRight,
    menuRect: DOMRect,
    viewport: { width: number; height: number }
  ): PositionTopRight {
    const tokens = Tokens.getTokens();
    const minMargin = tokens.spacing[2]; // 6px (--space-2)

    // Constrain vertical: keep menu within top and bottom edges
    const constrainedTop = Math.max(minMargin, Math.min(position.top, viewport.height - menuRect.height - minMargin));

    // Constrain horizontal: keep menu within left and right edges
    // right >= minMargin (not too close to right edge)
    // right <= viewport.width - menuRect.width - minMargin (not overflowing left edge)
    const constrainedRight = Math.max(minMargin, Math.min(position.right, viewport.width - menuRect.width - minMargin));

    return {
      top: constrainedTop,
      right: constrainedRight,
    };
  }

  private applyPosition(position: Position): void {
    // Vertical positioning
    if ('top' in position) {
      this.style.top = `${position.top}px`;
      this.style.bottom = 'auto';
    } else {
      this.style.bottom = `${position.bottom}px`;
      this.style.top = 'auto';
    }

    // Horizontal positioning
    if ('left' in position) {
      this.style.left = `${position.left}px`;
      this.style.right = 'auto';
    } else {
      this.style.right = `${position.right}px`;
      this.style.left = 'auto';
    }
  }

  // ============================================================================
  // Helper Functions
  // ============================================================================

  private findTriggerElement(): HTMLElement | null {
    const triggers = document.querySelectorAll(`[popovertarget="${this.id}"]`);
    if (triggers.length === 0) return null;

    const trigger = triggers[0];
    return trigger instanceof HTMLElement ? trigger : null;
  }

  private getViewportDimensions() {
    return {
      width: window.innerWidth,
      height: window.innerHeight,
    };
  }

  private isDesktopView(): boolean {
    return window.innerWidth >= DESKTOP_BREAKPOINT;
  }

  private isMobileView(): boolean {
    return window.innerWidth < DESKTOP_BREAKPOINT;
  }

  private closeMenu(): void {
    if ('hidePopover' in this && typeof this.hidePopover === 'function') {
      this.hidePopover();
    }
  }

  // ============================================================================
  // Menu Rendering
  // ============================================================================

  private render(): void {
    this.renderMenuContent();
    this.attachItemClickHandlers();
  }

  private renderMenuContent(): void {
    const headerHtml = this.renderMenuHeader();
    const itemsHtml = this._items.map(item => this.renderMenuItem(item)).join('');

    this.innerHTML = `${headerHtml}${itemsHtml}`;
  }

  private renderMenuHeader(): string {
    return `
      <div class="menu-header">
        <div class="menu-handle"></div>
      </div>
    `;
  }

  private renderMenuItem(item: MenuItem): string {
    if (item.type === 'divider') {
      return this.renderDivider(item);
    }
    return this.renderActionItem(item);
  }

  private renderDivider(_item: DividerMenuItem): string {
    return '<div class="menu-divider" role="separator"></div>';
  }

  private renderActionItem(item: ActionMenuItem): string {
    const iconHtml = `<span class="menu-item-icon">${item.icon}</span>`;
    const labelHtml = `<span class="menu-item-text">${item.label}</span>`;
    const suffixHtml = item.suffix ? `<span class="menu-item-suffix">${item.suffix}</span>` : '';

    return `
      <button class="menu-item" role="menuitem" data-item-id="${item.id}">
        ${iconHtml}
        ${labelHtml}
        ${suffixHtml}
      </button>
    `;
  }

  private attachItemClickHandlers(): void {
    const menuItems = this.querySelectorAll('[data-item-id]');

    menuItems.forEach(element => {
      if (!(element instanceof HTMLElement)) return;

      element.addEventListener('click', () => {
        const itemId = element.dataset['itemId'];
        if (!itemId) return;

        this.closeMenu();
        this.emitItemClickEvent(itemId);
      });
    });
  }

  private emitItemClickEvent(itemId: string): void {
    this.dispatchEvent(
      new CustomEvent('item-click', {
        detail: { id: itemId },
        bubbles: true,
      })
    );
  }
}

// Auto-register custom element on import
if (!customElements.get('ds-menu')) {
  customElements.define('ds-menu', DsMenu);
}
