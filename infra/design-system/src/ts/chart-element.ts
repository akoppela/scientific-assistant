// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

/**
 * ds-chart Custom Element
 *
 * Renders ECharts with design system theming.
 *
 * Properties:
 *   - config: ChartConfig | null - chart configuration, triggers re-render
 *   - theme: 'light' | 'dark' - theme name, triggers re-render on change
 *
 * Elm usage:
 *   Html.node "ds-chart"
 *       [ Attrs.property "config" chartJson
 *       , Attrs.property "theme" (Encode.string model.theme)
 *       ]
 *       []
 */

import * as echarts from 'echarts';
import * as Charts from './charts.ts';

// Extend HTMLElementTagNameMap so document.createElement('ds-chart') returns DsChart
declare global {
  interface HTMLElementTagNameMap {
    'ds-chart': DsChart;
  }
}

export class DsChart extends HTMLElement {
  private _config: Charts.ChartConfig | null = null;
  private _theme = 'light';
  private _chart: echarts.ECharts | null = null;
  private _resizeObserver: ResizeObserver | null = null;

  connectedCallback(): void {
    this._resizeObserver = new ResizeObserver(() => {
      this._chart?.resize();
    });
    this._resizeObserver.observe(this);

    if (this._config) {
      this.render();
    }
  }

  disconnectedCallback(): void {
    this._resizeObserver?.disconnect();
    this._chart?.dispose();
    this._chart = null;
  }

  get config(): Charts.ChartConfig | null {
    return this._config;
  }

  set config(value: Charts.ChartConfig | null) {
    this._config = value;
    if (this.isConnected) {
      this.render();
    }
  }

  get theme(): string {
    return this._theme;
  }

  set theme(value: string) {
    if (this._theme !== value) {
      this._theme = value;
      if (this.isConnected && this._config) {
        this.render();
      }
    }
  }

  private render(): void {
    if (!this._config) return;

    if (!this._chart) {
      this._chart = echarts.init(this);
    }

    const tokens = Charts.getChartTokens();
    const option = Charts.toEChartsOption(this._config, tokens);
    this._chart.setOption(option, true);
  }
}

// Auto-register custom element on import
if (!customElements.get('ds-chart')) {
  customElements.define('ds-chart', DsChart);
}
