# ds-chart Custom Element Implementation Plan

**Goal:** Create a `<ds-chart>` custom element that renders ECharts with design system theming, controlled by Elm via properties.

**Architecture:**
- LLM generates simple, strictly-typed chart configs (all fields required)
- `toEChartsOption()` transforms to ECharts format with theme applied
- Custom element wraps ECharts, reads CSS tokens, handles resize

**Tech Stack:** TypeScript, ECharts 6.x, vitest for testing

---

## Type Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│ LLM             │     │ charts.ts        │     │ ECharts         │
│                 │     │                  │     │                 │
│ LineChart       │     │ toEChartsOption  │     │ EChartsOption   │
│ BarChart        ├────►│ (pure transform) ├────►│ (full config)   │
│ PieChart        │     │ + theme tokens   │     │                 │
│ etc.            │     │                  │     │                 │
└─────────────────┘     └──────────────────┘     └─────────────────┘

Input types            Pure functions            Output type
(simple, strict)       (pattern match)           (ECharts native)
```

---

## Prerequisites

Clean up existing files:

```bash
rm infra/design-system/js/charts.js  # Already done
```

---

## Task 1: TypeScript Setup

**Status:** Completed

- Created `tsconfig.json`, `vitest.config.ts`
- Updated `package.json` with exports and dependencies
- Moved `js/tokens.js` → `src/tokens.ts`
- Moved `styles/`, `assets/` → `src/styles/`, `src/assets/`

---

## Task 2: Chart Input Types

Define strictly-typed input interfaces for all 16 chart types.

**Files:**
- Create: `infra/design-system/src/charts.ts`
- Test: `infra/design-system/src/__tests__/charts.test.ts`

**Step 1: Write failing test**

```typescript
// infra/design-system/src/__tests__/charts.test.ts
import { describe, it, expect } from 'vitest';
import * as Charts from '../charts.ts';
import type { ChartConfig } from '../charts.ts';

const mockTokens: Charts.ChartTokens = {
  text: '#1a2e2e',
  textSecondary: '#5a7070',
  textInverse: '#f0f3f2',
  border: '#d1dede',
  borderStrong: '#a8bfbf',
  bgSurface: '#f8faf9',
  dataColors: ['#0f766e', '#d97706', '#4f46e5', '#dc2626', '#7c3aed', '#0891b2', '#65a30d', '#c026d3', '#ea580c'],
  fontSans: 'Nunito, sans-serif',
  fontSizeXs: '0.75rem',
  fontSizeLg: '1.125rem',
  fontWeightSemibold: 600,
  space1: 3,
  space3: 9,
  space6: 18,
  space7: 21,
  space14: 42,
  space16: 48,
  space20: 60,
};

describe('Charts.toEChartsOption', () => {
  describe('line chart', () => {
    it('transforms line chart with theme', () => {
      const input: ChartConfig = {
        type: 'line',
        title: 'Monthly Sales',
        xAxis: ['Jan', 'Feb', 'Mar'],
        series: [
          { name: 'Product A', data: [10, 20, 30], colorIndex: 0 },
          { name: 'Product B', data: [15, 25, 35], colorIndex: 1 },
        ],
      };

      const result = Charts.toEChartsOption(input, mockTokens);

      expect(result.title.text).toBe('Monthly Sales');
      expect(result.title.textStyle.color).toBe('#1a2e2e');
      expect(result.xAxis.data).toEqual(['Jan', 'Feb', 'Mar']);
      expect(result.series[0].color).toBe('#0f766e');
      expect(result.series[1].color).toBe('#d97706');
    });
  });

  describe('bar chart', () => {
    it('transforms bar chart with theme', () => {
      const input: ChartConfig = {
        type: 'bar',
        title: 'Quarterly Revenue',
        xAxis: ['Q1', 'Q2', 'Q3', 'Q4'],
        series: [{ name: 'Revenue', data: [100, 150, 120, 180], colorIndex: 0 }],
      };

      const result = Charts.toEChartsOption(input, mockTokens);

      expect(result.series[0].type).toBe('bar');
      expect(result.series[0].color).toBe('#0f766e');
    });
  });

  describe('pie chart', () => {
    it('transforms pie chart with theme', () => {
      const input: ChartConfig = {
        type: 'pie',
        title: 'Market Share',
        series: [
          { name: 'Company A', value: 40, colorIndex: 0 },
          { name: 'Company B', value: 30, colorIndex: 1 },
          { name: 'Company C', value: 30, colorIndex: 2 },
        ],
      };

      const result = Charts.toEChartsOption(input, mockTokens);

      expect(result.series[0].type).toBe('pie');
      expect(result.series[0].data[0].itemStyle.color).toBe('#0f766e');
    });
  });

  describe('gauge chart', () => {
    it('transforms gauge chart with theme', () => {
      const input: ChartConfig = {
        type: 'gauge',
        title: 'Performance',
        value: 75,
        min: 0,
        max: 100,
        colorIndex: 0,
      };

      const result = Charts.toEChartsOption(input, mockTokens);

      expect(result.series[0].type).toBe('gauge');
      expect(result.series[0].data[0].value).toBe(75);
    });
  });
});
```

**Step 2: Verify failure**

Run: `cd infra/design-system && npm test`

Expected: FAIL with "Cannot find module '../charts.ts'"

**Step 3: Implement chart types and transforms**

```typescript
// infra/design-system/src/charts.ts

/**
 * Design system tokens for chart theming.
 */
export interface ChartTokens {
  text: string;
  textSecondary: string;
  textInverse: string;
  border: string;
  borderStrong: string;
  bgSurface: string;
  dataColors: string[];
  fontSans: string;
  fontSizeXs: string;
  fontSizeLg: string;
  fontWeightSemibold: number;
  space1: number;
  space3: number;
  space6: number;
  space7: number;
  space14: number;
  space16: number;
  space20: number;
}

// ============================================================================
// Input Types (from LLM) - All fields required, simple structures
// ============================================================================

export interface LineChart {
  type: 'line';
  title: string;
  xAxis: string[];
  series: Array<{
    name: string;
    data: number[];
    colorIndex: number;
  }>;
}

export interface BarChart {
  type: 'bar';
  title: string;
  xAxis: string[];
  series: Array<{
    name: string;
    data: number[];
    colorIndex: number;
  }>;
}

export interface AreaChart {
  type: 'area';
  title: string;
  xAxis: string[];
  series: Array<{
    name: string;
    data: number[];
    colorIndex: number;
  }>;
}

export interface ScatterChart {
  type: 'scatter';
  title: string;
  xAxisName: string;
  yAxisName: string;
  series: Array<{
    name: string;
    data: Array<[number, number]>;
    colorIndex: number;
  }>;
}

export interface BubbleChart {
  type: 'bubble';
  title: string;
  xAxisName: string;
  yAxisName: string;
  series: Array<{
    name: string;
    data: Array<[number, number, number]>; // [x, y, size]
    colorIndex: number;
  }>;
}

export interface PieChart {
  type: 'pie';
  title: string;
  series: Array<{
    name: string;
    value: number;
    colorIndex: number;
  }>;
}

export interface DonutChart {
  type: 'donut';
  title: string;
  series: Array<{
    name: string;
    value: number;
    colorIndex: number;
  }>;
}

export interface RadarChart {
  type: 'radar';
  title: string;
  indicators: Array<{
    name: string;
    max: number;
  }>;
  series: Array<{
    name: string;
    values: number[];
    colorIndex: number;
  }>;
}

export interface GaugeChart {
  type: 'gauge';
  title: string;
  value: number;
  min: number;
  max: number;
  colorIndex: number;
}

export interface HeatmapChart {
  type: 'heatmap';
  title: string;
  xAxis: string[];
  yAxis: string[];
  data: Array<[number, number, number]>; // [xIndex, yIndex, value]
  colorIndex: number;
}

export interface HistogramChart {
  type: 'histogram';
  title: string;
  data: number[];
  bins: number;
  colorIndex: number;
}

export interface BoxplotChart {
  type: 'boxplot';
  title: string;
  categories: string[];
  data: Array<number[]>; // Each array: [min, Q1, median, Q3, max]
  colorIndex: number;
}

export interface WaterfallChart {
  type: 'waterfall';
  title: string;
  xAxis: string[];
  data: Array<{
    value: number;
    isTotal: boolean;
  }>;
  colorIndex: number;
}

export interface FunnelChart {
  type: 'funnel';
  title: string;
  series: Array<{
    name: string;
    value: number;
    colorIndex: number;
  }>;
}

export interface TreemapChart {
  type: 'treemap';
  title: string;
  data: Array<{
    name: string;
    value: number;
    colorIndex: number;
    children?: Array<{
      name: string;
      value: number;
    }>;
  }>;
}

export interface SankeyChart {
  type: 'sankey';
  title: string;
  nodes: Array<{
    name: string;
    colorIndex: number;
  }>;
  links: Array<{
    source: string;
    target: string;
    value: number;
  }>;
}

export interface ErrorBarChart {
  type: 'errorbar';
  title: string;
  xAxis: string[];
  series: Array<{
    name: string;
    data: Array<{
      value: number;
      error: number;
    }>;
    colorIndex: number;
  }>;
}

export interface ViolinChart {
  type: 'violin';
  title: string;
  categories: string[];
  data: Array<number[]>;
  colorIndex: number;
}

/**
 * Union of all chart types.
 */
export type ChartConfig =
  | LineChart
  | BarChart
  | AreaChart
  | ScatterChart
  | BubbleChart
  | PieChart
  | DonutChart
  | RadarChart
  | GaugeChart
  | HeatmapChart
  | HistogramChart
  | BoxplotChart
  | WaterfallChart
  | FunnelChart
  | TreemapChart
  | SankeyChart
  | ErrorBarChart
  | ViolinChart;

// ============================================================================
// Transform Functions (Pure)
// ============================================================================

/**
 * Transform chart config to ECharts option with theme applied.
 */
export function toEChartsOption(
  config: ChartConfig,
  tokens: ChartTokens
): Record<string, unknown> {
  switch (config.type) {
    case 'line':
      return lineToECharts(config, tokens);
    case 'bar':
      return barToECharts(config, tokens);
    case 'area':
      return areaToECharts(config, tokens);
    case 'scatter':
      return scatterToECharts(config, tokens);
    case 'bubble':
      return bubbleToECharts(config, tokens);
    case 'pie':
      return pieToECharts(config, tokens);
    case 'donut':
      return donutToECharts(config, tokens);
    case 'radar':
      return radarToECharts(config, tokens);
    case 'gauge':
      return gaugeToECharts(config, tokens);
    case 'heatmap':
      return heatmapToECharts(config, tokens);
    case 'histogram':
      return histogramToECharts(config, tokens);
    case 'boxplot':
      return boxplotToECharts(config, tokens);
    case 'waterfall':
      return waterfallToECharts(config, tokens);
    case 'funnel':
      return funnelToECharts(config, tokens);
    case 'treemap':
      return treemapToECharts(config, tokens);
    case 'sankey':
      return sankeyToECharts(config, tokens);
    case 'errorbar':
      return errorbarToECharts(config, tokens);
    case 'violin':
      return violinToECharts(config, tokens);
  }
}

// Individual transform functions implemented below...
// (See Step 4 for full implementations)
```

**Step 4: Implement individual transform functions**

Each transform function is pure and applies theme tokens. Example for line chart:

```typescript
function lineToECharts(config: LineChart, tokens: ChartTokens): Record<string, unknown> {
  return {
    title: {
      text: config.title,
      textStyle: {
        color: tokens.text,
        fontFamily: tokens.fontSans,
        fontSize: tokens.fontSizeLg,
        fontWeight: tokens.fontWeightSemibold,
      },
      top: 0,
      padding: [0, 0, tokens.space6, 0],
    },
    tooltip: {
      trigger: 'axis',
      backgroundColor: tokens.bgSurface,
      borderColor: tokens.border,
      borderWidth: tokens.space1,
      textStyle: {
        fontFamily: tokens.fontSans,
        fontSize: tokens.fontSizeXs,
        color: tokens.text,
      },
    },
    legend: {
      data: config.series.map(s => s.name),
      textStyle: {
        fontFamily: tokens.fontSans,
        fontSize: tokens.fontSizeXs,
        color: tokens.textSecondary,
      },
    },
    grid: {
      top: tokens.space20,
      left: tokens.space14,
      right: tokens.space7,
      bottom: tokens.space16,
    },
    xAxis: {
      type: 'category',
      data: config.xAxis,
      axisLine: { lineStyle: { color: tokens.border } },
      axisLabel: {
        fontFamily: tokens.fontSans,
        fontSize: tokens.fontSizeXs,
        color: tokens.textSecondary,
      },
    },
    yAxis: {
      type: 'value',
      axisLine: { lineStyle: { color: tokens.border } },
      axisLabel: {
        fontFamily: tokens.fontSans,
        fontSize: tokens.fontSizeXs,
        color: tokens.textSecondary,
      },
      splitLine: { lineStyle: { color: tokens.border } },
    },
    series: config.series.map(s => ({
      name: s.name,
      type: 'line',
      data: s.data,
      color: tokens.dataColors[s.colorIndex],
      itemStyle: { color: tokens.dataColors[s.colorIndex] },
    })),
  };
}
```

**Step 5: Verify pass**

Run: `cd infra/design-system && npm test`

Expected: PASS (4+ tests)

**Step 6: Commit**

`git commit -m "feat(design-system): add chart types and toEChartsOption transform"`

---

## Task 3: ds-chart Custom Element

Create the custom element that uses the transform.

**Files:**
- Create: `infra/design-system/src/chart-element.ts`
- Test: `infra/design-system/src/__tests__/chart-element.test.ts`

**Step 1: Write failing test**

```typescript
// infra/design-system/src/__tests__/chart-element.test.ts
import { describe, it, expect, beforeAll, afterEach } from 'vitest';
import '../chart-element.ts';

describe('ds-chart', () => {
  beforeAll(() => {
    // Set CSS custom properties for tokens
    const props = {
      '--color-text': '#1a2e2e',
      '--color-text-secondary': '#5a7070',
      '--color-text-inverse': '#f0f3f2',
      '--color-border': '#d1dede',
      '--color-border-strong': '#a8bfbf',
      '--color-bg-surface': '#f8faf9',
      '--color-data-1': '#0f766e',
      '--color-data-2': '#d97706',
      '--color-data-3': '#4f46e5',
      '--font-sans': 'Nunito, sans-serif',
      '--font-size-xs': '0.75rem',
      '--font-size-lg': '1.125rem',
      '--font-weight-semibold': '600',
      '--space-1': '3px',
      '--space-3': '9px',
      '--space-6': '18px',
      '--space-7': '21px',
      '--space-14': '42px',
      '--space-16': '48px',
      '--space-20': '60px',
    };
    Object.entries(props).forEach(([k, v]) => {
      document.documentElement.style.setProperty(k, v);
    });
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('registers as custom element', () => {
    expect(customElements.get('ds-chart')).toBeDefined();
  });

  it('accepts config property', () => {
    const el = document.createElement('ds-chart') as HTMLElement & { config: unknown };
    el.config = {
      type: 'line',
      title: 'Test',
      xAxis: ['A', 'B'],
      series: [{ name: 'S1', data: [1, 2], colorIndex: 0 }],
    };
    document.body.appendChild(el);

    expect(el.config).toEqual({
      type: 'line',
      title: 'Test',
      xAxis: ['A', 'B'],
      series: [{ name: 'S1', data: [1, 2], colorIndex: 0 }],
    });
  });

  it('re-renders on theme property change', () => {
    const el = document.createElement('ds-chart') as HTMLElement & {
      config: unknown;
      theme: string;
      render: () => void;
    };
    el.config = {
      type: 'line',
      title: 'Test',
      xAxis: ['A'],
      series: [{ name: 'S', data: [1], colorIndex: 0 }],
    };
    document.body.appendChild(el);

    let renderCount = 0;
    const originalRender = el.render.bind(el);
    el.render = () => {
      renderCount++;
      originalRender();
    };

    el.theme = 'dark';
    expect(renderCount).toBe(1);

    el.theme = 'light';
    expect(renderCount).toBe(2);
  });
});
```

**Step 2: Verify failure**

Run: `cd infra/design-system && npm test`

Expected: FAIL with "Cannot find module '../chart-element.ts'"

**Step 3: Implement**

```typescript
// infra/design-system/src/chart-element.ts
/**
 * ds-chart Custom Element
 *
 * Renders ECharts with design system theming.
 *
 * Properties:
 *   - config: ChartConfig object (from LLM)
 *   - theme: 'light' | 'dark' - triggers re-render on change
 *
 * Elm usage:
 *   Html.node "ds-chart"
 *       [ Attrs.property "config" chartJson
 *       , Attrs.property "theme" (Encode.string model.theme)
 *       ]
 *       []
 */

import * as echarts from 'echarts';
import { getChartTokens } from './tokens.ts';
import * as Charts from './charts.ts';

class DsChart extends HTMLElement {
  private _config: Charts.ChartConfig | null = null;
  private _theme = 'light';
  private _chart: echarts.ECharts | null = null;
  private _resizeObserver: ResizeObserver | null = null;

  connectedCallback(): void {
    this.style.display = 'block';
    this.style.width = '100%';
    this.style.minHeight = '200px';

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

  render(): void {
    if (!this._config) return;

    if (!this._chart) {
      this._chart = echarts.init(this);
    }

    const tokens = getChartTokens();
    const option = Charts.toEChartsOption(this._config, tokens);
    this._chart.setOption(option, true);
  }
}

customElements.define('ds-chart', DsChart);
```

**Step 4: Verify pass**

Run: `cd infra/design-system && npm test`

Expected: PASS (all tests)

**Step 5: Commit**

`git commit -m "feat(design-system): add ds-chart custom element"`

---

## Task 4: Update Landing Page

Update landing page to use the new custom element with typed configs.

**Files:**
- Modify: `landing/design-system.html`
- Modify: `landing/data/charts/*.json` (update to new format)

**Step 1: Update chart JSON files to new format**

Example `landing/data/charts/line.json`:
```json
{
  "type": "line",
  "title": "Monthly Trends",
  "xAxis": ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
  "series": [
    { "name": "Series A", "data": [150, 230, 224, 218, 135, 147], "colorIndex": 0 },
    { "name": "Series B", "data": [50, 130, 174, 118, 85, 97], "colorIndex": 1 }
  ]
}
```

**Step 2: Update HTML script**

```html
<script type="module">
  import '@scientific-assistant/design-system/src/chart-element';
  // ... theme toggle code ...
  // ... chart loading code ...
</script>
```

**Step 3: Verify landing page works**

```bash
dev:landing
```

**Step 4: Commit**

`git commit -m "refactor(landing): use ds-chart with typed configs"`

---

## Task 5: Update Bridge Imports

Update bridge layer to use new design-system paths.

**Files:**
- Modify: `bridge/src/main.ts` (update import paths)

**Step 1: Update imports**

Change:
```typescript
import '@scientific-assistant/design-system/styles/...';
```

To:
```typescript
import '@scientific-assistant/design-system/src/styles/...';
```

**Step 2: Verify bridge builds**

```bash
cd bridge && npm run build
```

**Step 3: Commit**

`git commit -m "refactor(bridge): update design-system import paths"`

---

## Task 6: Update Nix Build

Update hashes and ensure builds pass.

**Files:**
- Modify: `infra/design-system/default.nix`
- Modify: `landing/default.nix`

**Step 1: Regenerate package-lock.json and update hashes**

```bash
cd infra/design-system
rm -rf node_modules package-lock.json
npm install
nix build .#design-system 2>&1 | grep "got:"
# Update npmDepsHash in default.nix
```

**Step 2: Same for landing**

```bash
cd landing
rm -rf node_modules package-lock.json
npm install
nix build .#landing 2>&1 | grep "got:"
# Update npmDepsHash in default.nix
```

**Step 3: Verify both builds**

```bash
nix build .#design-system
nix build .#landing
```

**Step 4: Commit**

`git commit -m "chore: update nix hashes for design-system and landing"`

---

## Summary

After completing all tasks:

**Files created/modified:**
- `infra/design-system/src/tokens.ts` - Token reader (migrated)
- `infra/design-system/src/charts.ts` - Chart types + transforms (new)
- `infra/design-system/src/chart-element.ts` - Custom element (new)
- `infra/design-system/src/__tests__/` - Tests (new)
- `landing/data/charts/*.json` - Updated to typed format
- `landing/design-system.html` - Uses ds-chart element

**Elm usage:**
```elm
Html.node "ds-chart"
    [ Attrs.property "config" (encodeLineChart model.chartData)
    , Attrs.property "theme" (Encode.string model.theme)
    ]
    []
```

**Chart types available:**
- line, bar, area, scatter, bubble
- pie, donut, radar, gauge
- heatmap, histogram, boxplot
- waterfall, funnel, treemap, sankey
- errorbar, violin
