// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

/**
 * Design System Entry Point
 *
 * Exports all TypeScript modules and registers custom elements.
 */

// Re-export chart types, transform, and token getter
export type {
  ChartConfig,
  ChartTokens,
  LineChartConfig,
  BarChartConfig,
  AreaChartConfig,
  ScatterChartConfig,
  BubbleChartConfig,
  PieChartConfig,
  DonutChartConfig,
  RadarChartConfig,
  GaugeChartConfig,
  HeatmapChartConfig,
  HistogramChartConfig,
  BoxplotChartConfig,
  WaterfallChartConfig,
  FunnelChartConfig,
  TreemapChartConfig,
  SankeyChartConfig,
} from './charts.ts';
export { toEChartsOption, getChartTokens } from './charts.ts';

// Export and register ds-chart custom element
export { DsChart } from './chart-element.ts';

// Export and register ds-menu custom element
export type { MenuItem, ActionMenuItem, DividerMenuItem } from './menu-element';
export { DsMenu } from './menu-element';
