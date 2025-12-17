// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import { describe, it, expect } from 'vitest';
import * as Charts from '../charts.ts';
import * as Setup from './setup.ts';

// For calling functions that may have dynamic types
function callIfFunction(value: unknown, args: unknown[]): unknown {
  if (typeof value !== 'function') {
    throw new Error(`Expected function, got ${typeof value}`);
  }
  return value(...args);
}

// Set up CSS properties once, then get tokens from the real function
Setup.setupCssProperties();
const tokens = Charts.getChartTokens();

// ============================================================================
// Shared Expectations
// ============================================================================

const secondaryTextStyle = {
  fontFamily: 'Nunito, sans-serif',
  fontSize: '0.75rem',
  fontWeight: 400,
  color: '#5a7070',
};

const primaryTextStyle = {
  fontFamily: 'Nunito, sans-serif',
  fontSize: '0.75rem',
  fontWeight: 400,
  color: '#1a2e2e',
};

const titleExpectation = {
  textStyle: {
    color: '#1a2e2e',
    fontFamily: 'Nunito, sans-serif',
    fontSize: '1.125rem',
    fontWeight: 600,
  },
  top: 6,
  padding: [0, 0, 18, 0],
};

const tooltipAxisExpectation = {
  trigger: 'axis',
  backgroundColor: '#f8faf9',
  borderColor: '#d1dede',
  borderWidth: 3,
  textStyle: primaryTextStyle,
};

const tooltipItemExpectation = { ...tooltipAxisExpectation, trigger: 'item' };

const gridExpectation = { top: 42, left: 42, right: 21, bottom: 48 };
const gridWithAxisNameExpectation = { top: 42, left: 42, right: 21, bottom: 78 };
const gridNoLegendExpectation = { top: 42, left: 42, right: 21, bottom: 0 };

const contentExpectation = { top: 42, bottom: 48, left: 21, right: 21 };
const contentNoLegendExpectation = { top: 42, bottom: 0, left: 21, right: 21 };

const labelExpectation = {
  ...secondaryTextStyle,
  textBorderColor: 'transparent',
  textBorderWidth: 0,
};

const labelInverseExpectation = {
  fontFamily: 'Nunito, sans-serif',
  fontSize: '0.75rem',
  fontWeight: 400,
  color: '#f0f3f2',
  textBorderColor: 'transparent',
  textBorderWidth: 0,
};

function categoryAxisExpectation(data: string[]) {
  return {
    type: 'category',
    data,
    axisLine: { lineStyle: { color: '#d1dede' } },
    axisLabel: secondaryTextStyle,
    nameTextStyle: primaryTextStyle,
  };
}

const valueAxisExpectation = {
  type: 'value',
  axisLine: { lineStyle: { color: '#d1dede' } },
  axisLabel: secondaryTextStyle,
  splitLine: { lineStyle: { color: '#d1dede' } },
  nameTextStyle: primaryTextStyle,
};

function valueAxisWithNameExpectation(name: string) {
  return {
    ...valueAxisExpectation,
    name,
    nameLocation: 'center',
    nameGap: 30,
  };
}

function legendExpectation(names: string[]) {
  return {
    data: names,
    textStyle: secondaryTextStyle,
    itemGap: 18,
    itemWidth: 9,
    itemHeight: 9,
    icon: 'path://M5,0a5,5,0,1,0,5,5A5,5,0,0,0,5,0Z M0,13',
    bottom: 0,
    left: 'center',
  };
}

// ============================================================================
// Style Helper Tests
// ============================================================================

describe('getChartTokens', () => {
  it('reads tokens from CSS custom properties', () => {
    expect(tokens).toEqual({
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
      fontWeightNormal: 400,
      fontWeightSemibold: 600,
      space1: 3,
      space2: 6,
      space3: 9,
      space6: 18,
      space7: 21,
      space10: 30,
      space12: 36,
      space14: 42,
      space16: 48,
      space20: 60,
    });
  });
});

describe('getColor', () => {
  it('returns color at given index', () => {
    const result = Charts.getColor(tokens, 0);

    expect(result).toBe('#0f766e');
  });

  it('returns color at any valid index', () => {
    expect(Charts.getColor(tokens, 1)).toBe('#d97706');
    expect(Charts.getColor(tokens, 2)).toBe('#4f46e5');
    expect(Charts.getColor(tokens, 8)).toBe('#ea580c');
  });

  it('wraps around when index exceeds array length', () => {
    // Array has 9 colors, so index 9 should wrap to index 0
    expect(Charts.getColor(tokens, 9)).toBe('#0f766e');
    expect(Charts.getColor(tokens, 10)).toBe('#d97706');
    expect(Charts.getColor(tokens, 18)).toBe('#0f766e');
  });

  it('falls back to text color when dataColors is empty', () => {
    const emptyDataColorsTokens: Charts.ChartTokens = {
      ...tokens,
      dataColors: [],
    };

    expect(Charts.getColor(emptyDataColorsTokens, 0)).toBe('#1a2e2e');
    expect(Charts.getColor(emptyDataColorsTokens, 5)).toBe('#1a2e2e');
  });
});

describe('titleStyle', () => {
  it('returns title config with theme colors', () => {
    const result = Charts.titleStyle('Test Title', tokens);

    expect(result).toEqual({ text: 'Test Title', ...titleExpectation });
  });
});

describe('tooltipStyle', () => {
  it('returns axis tooltip by default', () => {
    const result = Charts.tooltipStyle(tokens);

    expect(result).toEqual(tooltipAxisExpectation);
  });

  it('returns item tooltip when specified', () => {
    const result = Charts.tooltipStyle(tokens, 'item');

    expect(result).toEqual(tooltipItemExpectation);
  });
});

describe('legendStyle', () => {
  it('returns legend config with series names', () => {
    const result = Charts.legendStyle(['Series A', 'Series B'], tokens);

    expect(result).toEqual(legendExpectation(['Series A', 'Series B']));
  });
});

describe('gridStyle', () => {
  it('returns grid config with spacing', () => {
    const result = Charts.gridStyle(tokens);

    expect(result).toEqual(gridExpectation);
  });
});

describe('gridStyleNoLegend', () => {
  it('returns grid config with bottom 0 for charts without legend', () => {
    const result = Charts.gridStyleNoLegend(tokens);

    expect(result).toEqual(gridNoLegendExpectation);
  });
});

describe('contentStyle', () => {
  it('returns content area positioning for non-grid charts with legend', () => {
    const result = Charts.contentStyle(tokens);

    expect(result).toEqual(contentExpectation);
  });
});

describe('contentStyleNoLegend', () => {
  it('returns content area positioning with bottom 0 for charts without legend', () => {
    const result = Charts.contentStyleNoLegend(tokens);

    expect(result).toEqual(contentNoLegendExpectation);
  });
});

describe('categoryAxisStyle', () => {
  it('returns category axis config', () => {
    const result = Charts.categoryAxisStyle(['A', 'B', 'C'], tokens);

    expect(result).toEqual(categoryAxisExpectation(['A', 'B', 'C']));
  });
});

describe('valueAxisStyle', () => {
  it('returns value axis config', () => {
    const result = Charts.valueAxisStyle(tokens);

    expect(result).toEqual(valueAxisExpectation);
  });
});

describe('labelStyle', () => {
  it('returns normal label style', () => {
    const result = Charts.labelStyle(tokens);

    expect(result).toEqual(labelExpectation);
  });
});

describe('labelStyleInverse', () => {
  it('returns inverse label style', () => {
    const result = Charts.labelStyleInverse(tokens);

    expect(result).toEqual(labelInverseExpectation);
  });
});

// ============================================================================
// Chart Transform Tests
// ============================================================================

describe('lineToECharts', () => {
  it('transforms line chart with theme', () => {
    const input: Charts.LineChartConfig = {
      type: 'line',
      title: 'Monthly Sales',
      xAxis: ['Jan', 'Feb'],
      series: [{ name: 'Product A', data: [10, 20] }],
    };

    const result = Charts.lineToECharts(input, tokens);

    expect(result).toEqual({
      title: { text: 'Monthly Sales', ...titleExpectation },
      tooltip: tooltipAxisExpectation,
      legend: legendExpectation(['Product A']),
      grid: gridExpectation,
      xAxis: categoryAxisExpectation(['Jan', 'Feb']),
      yAxis: valueAxisExpectation,
      series: [
        {
          name: 'Product A',
          type: 'line',
          data: [10, 20],
          color: '#0f766e',
          itemStyle: { color: '#0f766e' },
        },
      ],
    });
  });
});

describe('barToECharts', () => {
  it('transforms bar chart with theme', () => {
    const input: Charts.BarChartConfig = {
      type: 'bar',
      title: 'Revenue',
      xAxis: ['Q1', 'Q2'],
      series: [{ name: 'Revenue', data: [100, 150] }],
    };

    const result = Charts.barToECharts(input, tokens);

    expect(result).toEqual({
      title: { text: 'Revenue', ...titleExpectation },
      tooltip: tooltipAxisExpectation,
      legend: legendExpectation(['Revenue']),
      grid: gridExpectation,
      xAxis: categoryAxisExpectation(['Q1', 'Q2']),
      yAxis: valueAxisExpectation,
      series: [
        {
          name: 'Revenue',
          type: 'bar',
          data: [100, 150],
          color: '#0f766e',
          itemStyle: { color: '#0f766e' },
        },
      ],
    });
  });
});

describe('areaToECharts', () => {
  it('transforms area chart with areaStyle', () => {
    const input: Charts.AreaChartConfig = {
      type: 'area',
      title: 'Traffic',
      xAxis: ['Mon', 'Tue'],
      series: [{ name: 'Visits', data: [100, 200] }],
    };

    const result = Charts.areaToECharts(input, tokens);

    expect(result).toEqual({
      title: { text: 'Traffic', ...titleExpectation },
      tooltip: tooltipAxisExpectation,
      legend: legendExpectation(['Visits']),
      grid: gridExpectation,
      xAxis: categoryAxisExpectation(['Mon', 'Tue']),
      yAxis: valueAxisExpectation,
      series: [
        {
          name: 'Visits',
          type: 'line',
          data: [100, 200],
          color: '#0f766e',
          itemStyle: { color: '#0f766e' },
          areaStyle: { color: '#0f766e', opacity: 0.3 },
        },
      ],
    });
  });
});

describe('scatterToECharts', () => {
  it('transforms scatter chart with axis names', () => {
    const input: Charts.ScatterChartConfig = {
      type: 'scatter',
      title: 'Height vs Weight',
      xAxisName: 'Height',
      yAxisName: 'Weight',
      series: [{ name: 'People', data: [{ x: 170, y: 70 }] }],
    };

    const result = Charts.scatterToECharts(input, tokens);

    expect(result).toEqual({
      title: { text: 'Height vs Weight', ...titleExpectation },
      tooltip: tooltipItemExpectation,
      legend: legendExpectation(['People']),
      grid: gridWithAxisNameExpectation,
      xAxis: valueAxisWithNameExpectation('Height'),
      yAxis: valueAxisWithNameExpectation('Weight'),
      series: [
        {
          name: 'People',
          type: 'scatter',
          data: [[170, 70]],
          color: '#0f766e',
          itemStyle: { color: '#0f766e' },
        },
      ],
    });
  });
});

describe('bubbleToECharts', () => {
  it('transforms bubble chart with symbolSize function', () => {
    const input: Charts.BubbleChartConfig = {
      type: 'bubble',
      title: 'Market',
      xAxisName: 'Price',
      yAxisName: 'Volume',
      series: [{ name: 'Products', data: [{ x: 10, y: 100, size: 50 }] }],
    };

    const result = Charts.bubbleToECharts(input, tokens);

    // Test symbolSize function behavior
    const symbolSize = result.series[0]?.symbolSize;
    expect(callIfFunction(symbolSize, [[0, 0, 100]])).toBe(20);

    // Test full structure (symbolSize is a function, use expect.any)
    expect(result).toEqual({
      title: { text: 'Market', ...titleExpectation },
      tooltip: tooltipItemExpectation,
      legend: legendExpectation(['Products']),
      grid: gridWithAxisNameExpectation,
      xAxis: valueAxisWithNameExpectation('Price'),
      yAxis: valueAxisWithNameExpectation('Volume'),
      series: [
        {
          name: 'Products',
          type: 'scatter',
          data: [[10, 100, 50]],
          color: '#0f766e',
          itemStyle: { color: '#0f766e' },
          symbolSize: expect.any(Function),
        },
      ],
    });
  });
});

describe('pieToECharts', () => {
  it('transforms pie chart with item colors by index', () => {
    const input: Charts.PieChartConfig = {
      type: 'pie',
      title: 'Market Share',
      series: [
        { name: 'A', value: 40 },
        { name: 'B', value: 30 },
      ],
    };

    const result = Charts.pieToECharts(input, tokens);

    expect(result).toEqual({
      title: { text: 'Market Share', ...titleExpectation },
      tooltip: tooltipItemExpectation,
      legend: legendExpectation(['A', 'B']),
      series: [
        {
          type: 'pie',
          radius: '90%',
          top: 42,
          bottom: 48,
          left: 21,
          right: 21,
          data: [
            { name: 'A', value: 40, itemStyle: { color: '#0f766e' } },
            { name: 'B', value: 30, itemStyle: { color: '#d97706' } },
          ],
          label: labelExpectation,
        },
      ],
    });
  });
});

describe('donutToECharts', () => {
  it('transforms donut chart with inner/outer radius', () => {
    const input: Charts.DonutChartConfig = {
      type: 'donut',
      title: 'Budget',
      series: [{ name: 'Marketing', value: 30 }],
    };

    const result = Charts.donutToECharts(input, tokens);

    expect(result).toEqual({
      title: { text: 'Budget', ...titleExpectation },
      tooltip: tooltipItemExpectation,
      legend: legendExpectation(['Marketing']),
      series: [
        {
          type: 'pie',
          radius: ['45%', '90%'],
          top: 42,
          bottom: 48,
          left: 21,
          right: 21,
          data: [{ name: 'Marketing', value: 30, itemStyle: { color: '#0f766e' } }],
          label: labelExpectation,
        },
      ],
    });
  });
});

describe('radarToECharts', () => {
  it('transforms radar chart with indicators', () => {
    const input: Charts.RadarChartConfig = {
      type: 'radar',
      title: 'Skills',
      indicators: [{ name: 'Attack', max: 100 }],
      series: [{ name: 'Player 1', values: [80] }],
    };

    const result = Charts.radarToECharts(input, tokens);

    expect(result).toEqual({
      title: { text: 'Skills', ...titleExpectation },
      tooltip: tooltipItemExpectation,
      legend: legendExpectation(['Player 1']),
      radar: {
        indicator: [{ name: 'Attack', max: 100 }],
        axisLine: { lineStyle: { color: '#d1dede' } },
        splitLine: { lineStyle: { color: '#d1dede' } },
        axisName: { textStyle: secondaryTextStyle },
        radius: '54%',
        top: 42,
        bottom: 48,
        left: 21,
        right: 21,
      },
      series: [
        {
          type: 'radar',
          data: [
            {
              name: 'Player 1',
              value: [80],
              itemStyle: { color: '#0f766e' },
              lineStyle: { color: '#0f766e' },
              areaStyle: { color: '#0f766e', opacity: 0.3 },
            },
          ],
        },
      ],
    });
  });
});

describe('gaugeToECharts', () => {
  it('transforms gauge chart with min/max', () => {
    const input: Charts.GaugeChartConfig = {
      type: 'gauge',
      title: 'Performance',
      value: 75,
      min: 0,
      max: 100,
    };

    const result = Charts.gaugeToECharts(input, tokens);

    expect(result).toEqual({
      title: { text: 'Performance', ...titleExpectation },
      tooltip: tooltipItemExpectation,
      series: [
        {
          type: 'gauge',
          min: 0,
          max: 100,
          top: 42,
          bottom: 0,
          left: 21,
          right: 21,
          center: ['50%', '60%'],
          data: [{ value: 75 }],
          progress: { show: true, itemStyle: { color: '#0f766e' } },
          axisLine: { lineStyle: { color: [[1, '#d1dede']], width: 9 } },
          axisLabel: secondaryTextStyle,
          detail: {
            fontFamily: 'Nunito, sans-serif',
            fontSize: '1.125rem',
            fontWeight: 600,
            color: '#0f766e',
            valueAnimation: true,
          },
          pointer: { itemStyle: { color: '#0f766e' } },
        },
      ],
    });
  });
});

describe('heatmapToECharts', () => {
  it('transforms heatmap chart with visualMap', () => {
    const input: Charts.HeatmapChartConfig = {
      type: 'heatmap',
      title: 'Activity',
      data: [
        { x: 'Mon', y: 'AM', value: 10 },
        { x: 'Tue', y: 'PM', value: 20 },
      ],
    };

    const result = Charts.heatmapToECharts(input, tokens);

    expect(result).toEqual({
      title: { text: 'Activity', ...titleExpectation },
      tooltip: tooltipItemExpectation,
      grid: gridNoLegendExpectation,
      xAxis: categoryAxisExpectation(['Mon', 'Tue']),
      yAxis: categoryAxisExpectation(['AM', 'PM']),
      visualMap: {
        show: false,
        min: 10,
        max: 20,
        inRange: { color: ['#d1dede', '#0f766e'] },
      },
      series: [
        {
          type: 'heatmap',
          data: [
            [0, 0, 10],
            [1, 1, 20],
          ],
          label: { show: true, ...labelInverseExpectation },
        },
      ],
    });
  });
});

describe('histogramToECharts', () => {
  it('transforms histogram with binning', () => {
    const input: Charts.HistogramChartConfig = {
      type: 'histogram',
      title: 'Distribution',
      data: [10, 20, 30],
      bins: 2,
    };

    const result = Charts.histogramToECharts(input, tokens);

    expect(result).toEqual({
      title: { text: 'Distribution', ...titleExpectation },
      tooltip: tooltipAxisExpectation,
      grid: gridNoLegendExpectation,
      xAxis: categoryAxisExpectation(['10.0-20.0', '20.0-30.0']),
      yAxis: valueAxisExpectation,
      series: [
        {
          type: 'bar',
          data: [1, 2],
          color: '#0f766e',
          itemStyle: { color: '#0f766e' },
        },
      ],
    });
  });
});

describe('boxplotToECharts', () => {
  it('transforms boxplot chart with categories', () => {
    const input: Charts.BoxplotChartConfig = {
      type: 'boxplot',
      title: 'Scores',
      data: [{ category: 'Class A', min: 60, q1: 70, median: 80, q3: 90, max: 100 }],
    };

    const result = Charts.boxplotToECharts(input, tokens);

    expect(result).toEqual({
      title: { text: 'Scores', ...titleExpectation },
      tooltip: tooltipItemExpectation,
      grid: gridNoLegendExpectation,
      xAxis: categoryAxisExpectation(['Class A']),
      yAxis: valueAxisExpectation,
      series: [
        {
          type: 'boxplot',
          data: [[60, 70, 80, 90, 100]],
          itemStyle: { color: '#f8faf9', borderColor: '#0f766e' },
        },
      ],
    });
  });
});

describe('waterfallToECharts', () => {
  it('transforms waterfall chart with stacked bars', () => {
    const input: Charts.WaterfallChartConfig = {
      type: 'waterfall',
      title: 'Profit',
      data: [
        { label: 'Start', value: 100, isTotal: true },
        { label: 'Add', value: 50, isTotal: false },
        { label: 'Sub', value: -30, isTotal: false },
      ],
    };

    const result = Charts.waterfallToECharts(input, tokens);

    expect(result).toEqual({
      title: { text: 'Profit', ...titleExpectation },
      tooltip: tooltipAxisExpectation,
      grid: gridNoLegendExpectation,
      xAxis: categoryAxisExpectation(['Start', 'Add', 'Sub']),
      yAxis: valueAxisExpectation,
      series: [
        {
          type: 'bar',
          stack: 'waterfall',
          itemStyle: { borderColor: 'transparent', color: 'transparent' },
          data: [0, 100, 120],
        },
        {
          type: 'bar',
          stack: 'waterfall',
          data: [100, 50, '-'],
          color: '#0f766e',
          itemStyle: { color: '#0f766e' },
        },
        {
          type: 'bar',
          stack: 'waterfall',
          data: ['-', '-', 30],
          color: '#dc2626',
          itemStyle: { color: '#dc2626' },
        },
      ],
    });
  });
});

describe('funnelToECharts', () => {
  it('transforms funnel chart with item colors', () => {
    const input: Charts.FunnelChartConfig = {
      type: 'funnel',
      title: 'Sales Funnel',
      series: [{ name: 'Visits', value: 100 }],
    };

    const result = Charts.funnelToECharts(input, tokens);

    expect(result).toEqual({
      title: { text: 'Sales Funnel', ...titleExpectation },
      tooltip: tooltipItemExpectation,
      legend: legendExpectation(['Visits']),
      series: [
        {
          type: 'funnel',
          top: 42,
          bottom: 48,
          left: 21,
          right: 21,
          data: [{ name: 'Visits', value: 100, itemStyle: { color: '#0f766e', borderWidth: 0 } }],
          label: labelExpectation,
        },
      ],
    });
  });
});

describe('treemapToECharts', () => {
  it('transforms treemap chart with colors', () => {
    const input: Charts.TreemapChartConfig = {
      type: 'treemap',
      title: 'Disk Usage',
      data: [{ name: 'Documents', value: 100 }],
    };

    const result = Charts.treemapToECharts(input, tokens);

    expect(result).toEqual({
      title: { text: 'Disk Usage', ...titleExpectation },
      tooltip: tooltipItemExpectation,
      series: [
        {
          type: 'treemap',
          top: 42,
          bottom: 0,
          left: 21,
          right: 21,
          breadcrumb: { show: false },
          data: [{ name: 'Documents', value: 100, itemStyle: { color: '#0f766e' }, children: undefined }],
          label: labelInverseExpectation,
        },
      ],
    });
  });

  it('preserves children structure', () => {
    const input: Charts.TreemapChartConfig = {
      type: 'treemap',
      title: 'Nested',
      data: [
        {
          name: 'Parent',
          value: 100,
          children: [{ name: 'Child', value: 60 }],
        },
      ],
    };

    const result = Charts.treemapToECharts(input, tokens);

    expect(result).toEqual({
      title: { text: 'Nested', ...titleExpectation },
      tooltip: tooltipItemExpectation,
      series: [
        {
          type: 'treemap',
          top: 42,
          bottom: 0,
          left: 21,
          right: 21,
          breadcrumb: { show: false },
          data: [
            {
              name: 'Parent',
              value: 100,
              itemStyle: { color: '#0f766e' },
              children: [{ name: 'Child', value: 60 }],
            },
          ],
          label: labelInverseExpectation,
        },
      ],
    });
  });
});

describe('sankeyToECharts', () => {
  it('transforms sankey chart with nodes and links', () => {
    const input: Charts.SankeyChartConfig = {
      type: 'sankey',
      title: 'Flow',
      links: [{ source: 'A', target: 'B', value: 100 }],
    };

    const result = Charts.sankeyToECharts(input, tokens);

    expect(result).toEqual({
      title: { text: 'Flow', ...titleExpectation },
      tooltip: tooltipItemExpectation,
      series: [
        {
          type: 'sankey',
          top: 42,
          bottom: 0,
          left: 21,
          right: 21,
          data: [
            { name: 'A', itemStyle: { color: '#0f766e' }, label: { position: 'right' } },
            { name: 'B', itemStyle: { color: '#d97706' }, label: { position: 'left' } },
          ],
          links: [{ source: 'A', target: 'B', value: 100 }],
          label: labelExpectation,
          lineStyle: { color: 'source', opacity: 0.15 },
        },
      ],
    });
  });
});

// ============================================================================
// Main Transform Function Tests
// ============================================================================

describe('toEChartsOption', () => {
  it('dispatches all 16 chart types without throwing', () => {
    const configs: Charts.ChartConfig[] = [
      { type: 'line', title: 'T', xAxis: ['A'], series: [{ name: 'S', data: [1] }] },
      { type: 'bar', title: 'T', xAxis: ['A'], series: [{ name: 'S', data: [1] }] },
      { type: 'area', title: 'T', xAxis: ['A'], series: [{ name: 'S', data: [1] }] },
      { type: 'scatter', title: 'T', xAxisName: 'X', yAxisName: 'Y', series: [{ name: 'S', data: [{ x: 1, y: 1 }] }] },
      {
        type: 'bubble',
        title: 'T',
        xAxisName: 'X',
        yAxisName: 'Y',
        series: [{ name: 'S', data: [{ x: 1, y: 1, size: 1 }] }],
      },
      { type: 'pie', title: 'T', series: [{ name: 'A', value: 1 }] },
      { type: 'donut', title: 'T', series: [{ name: 'A', value: 1 }] },
      { type: 'radar', title: 'T', indicators: [{ name: 'I', max: 100 }], series: [{ name: 'S', values: [50] }] },
      { type: 'gauge', title: 'T', value: 50, min: 0, max: 100 },
      { type: 'heatmap', title: 'T', data: [{ x: 'A', y: 'B', value: 1 }] },
      { type: 'histogram', title: 'T', data: [1, 2, 3], bins: 2 },
      { type: 'boxplot', title: 'T', data: [{ category: 'A', min: 1, q1: 2, median: 3, q3: 4, max: 5 }] },
      { type: 'waterfall', title: 'T', data: [{ label: 'A', value: 100, isTotal: true }] },
      { type: 'funnel', title: 'T', series: [{ name: 'A', value: 100 }] },
      { type: 'treemap', title: 'T', data: [{ name: 'A', value: 100 }] },
      { type: 'sankey', title: 'T', links: [{ source: 'A', target: 'B', value: 1 }] },
    ];

    configs.forEach(config => {
      expect(() => Charts.toEChartsOption(config, tokens)).not.toThrow();
    });
  });
});
