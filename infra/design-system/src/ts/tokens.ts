// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

/**
 * Design System Token Reader
 *
 * Reads CSS custom properties from the design system and returns them as JavaScript values.
 * This is the bridge between CSS tokens (source of truth) and JavaScript code that needs
 * numeric/string values (e.g., ECharts configuration).
 *
 * Usage:
 *   import { getTokens } from '@scientific-assistant/design-system/js/tokens.js';
 *   const tokens = getTokens();
 *   console.log(tokens.colors.text); // '#1a2e2e' (light) or '#f2f5f2' (dark)
 */

/**
 * Get the root font size in pixels from the browser.
 */
function getRootFontSize(): number {
  if (typeof document === 'undefined') return 16;
  return parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
}

/**
 * Parse a CSS value (rem/px) to pixels.
 */
function toPx(value: string): number {
  if (!value) return 0;
  const trimmed = value.trim();
  if (trimmed.endsWith('rem')) return parseFloat(trimmed) * getRootFontSize();
  if (trimmed.endsWith('px')) return parseFloat(trimmed);
  return parseFloat(trimmed) || 0;
}

/**
 * Get all design system tokens as JavaScript values.
 * Reads computed CSS custom properties, so values are theme-aware.
 */
export function getTokens(element: Element = document.documentElement) {
  const styles = getComputedStyle(element);

  /**
   * Get a CSS custom property value.
   */
  const get = (name: string): string => styles.getPropertyValue(`--${name}`).trim();

  /**
   * Get a CSS custom property as pixels.
   */
  const getPx = (name: string): number => toPx(get(name));

  /**
   * Get a CSS custom property as a float.
   */
  const getFloat = (name: string): number => parseFloat(get(name)) || 0;

  return {
    // Colors (theme-aware)
    colors: {
      // Backgrounds
      bg: get('color-bg'),
      bgSurface: get('color-bg-surface'),
      bgMuted: get('color-bg-muted'),
      // Text
      text: get('color-text'),
      textSecondary: get('color-text-secondary'),
      textMuted: get('color-text-muted'),
      textInverse: get('color-text-inverse'),
      // Primary accent
      primary: get('color-primary'),
      primaryHover: get('color-primary-hover'),
      primarySubtle: get('color-primary-subtle'),
      // Borders
      border: get('color-border'),
      borderStrong: get('color-border-strong'),
      // Semantic
      error: get('color-error'),
      errorSubtle: get('color-error-subtle'),
      success: get('color-success'),
      successSubtle: get('color-success-subtle'),
      // Data visualization (9 colors)
      data: [
        get('color-data-1'),
        get('color-data-2'),
        get('color-data-3'),
        get('color-data-4'),
        get('color-data-5'),
        get('color-data-6'),
        get('color-data-7'),
        get('color-data-8'),
        get('color-data-9'),
      ],
    },

    // Typography (string values)
    fonts: {
      sans: get('font-sans'),
      mono: get('font-mono'),
    },

    // Font sizes (string values for CSS, e.g., '0.75rem')
    fontSizes: {
      xs: get('font-size-xs'),
      sm: get('font-size-sm'),
      base: get('font-size-base'),
      lg: get('font-size-lg'),
    },

    // Font weights (numbers)
    fontWeights: {
      normal: getFloat('font-weight-normal'),
      medium: getFloat('font-weight-medium'),
      semibold: getFloat('font-weight-semibold'),
    },

    // Spacing in pixels (for JS APIs that need numbers)
    spacing: {
      1: getPx('space-1'), // 3px
      2: getPx('space-2'), // 6px
      3: getPx('space-3'), // 9px
      4: getPx('space-4'), // 12px
      5: getPx('space-5'), // 15px
      6: getPx('space-6'), // 18px
      7: getPx('space-7'), // 21px
      8: getPx('space-8'), // 24px
      9: getPx('space-9'), // 27px
      10: getPx('space-10'), // 30px
      12: getPx('space-12'), // 36px
      14: getPx('space-14'), // 42px
      16: getPx('space-16'), // 48px
      20: getPx('space-20'), // 60px
      24: getPx('space-24'), // 72px
    },

    // Border widths in pixels
    borders: {
      width: getPx('border-width'), // 3px
      widthThick: getPx('border-width-thick'), // 6px
    },

    // Opacity values (0-1)
    opacity: {
      disabled: getFloat('opacity-disabled'),
      active: getFloat('opacity-active'),
      subtle: getFloat('opacity-subtle'),
    },

    // Border radius in pixels
    radius: {
      xs: getPx('radius-xs'), // 3px
      sm: getPx('radius-sm'), // 6px
      md: getPx('radius-md'), // 9px
      lg: getPx('radius-lg'), // 12px
      xl: getPx('radius-xl'), // 15px
      '2xl': getPx('radius-2xl'), // 18px
    },

    // Z-index scale
    zIndex: {
      base: getFloat('z-base'),
      elevated: getFloat('z-elevated'),
      sticky: getFloat('z-sticky'),
      dropdown: getFloat('z-dropdown'),
      overlay: getFloat('z-overlay'),
      modal: getFloat('z-modal'),
      toast: getFloat('z-toast'),
      tooltip: getFloat('z-tooltip'),
    },
  };
}
