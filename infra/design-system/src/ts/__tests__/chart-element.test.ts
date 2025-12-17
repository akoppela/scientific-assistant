// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import { describe, it, expect, beforeAll, beforeEach, afterEach, vi } from 'vitest';
import * as Charts from '../charts.ts';
import * as Setup from './setup.ts';

// Shared mock functions - created once, reset between tests
const mockSetOption = vi.fn();
const mockResize = vi.fn();
const mockDispose = vi.fn();

// Mock echarts module - factory defines the complete mock
vi.mock('echarts', () => ({
  init: vi.fn(() => ({
    setOption: mockSetOption,
    resize: mockResize,
    dispose: mockDispose,
  })),
}));

// Import after mocking - side effect import registers custom element
import '../chart-element.ts';
import * as echarts from 'echarts';

describe('ds-chart', () => {
  beforeAll(() => {
    Setup.setupCssProperties();
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('registers as custom element', () => {
    expect(customElements.get('ds-chart')).toBeDefined();
  });

  it('creates element without inline styles (styles come from CSS)', () => {
    const el = document.createElement('ds-chart');
    document.body.appendChild(el);

    expect(el.style.cssText).toBe('');
  });

  it('accepts config property', () => {
    const el = document.createElement('ds-chart');
    const config: Charts.LineChartConfig = {
      type: 'line',
      title: 'Test',
      xAxis: ['A', 'B'],
      series: [{ name: 'S1', data: [1, 2] }],
    };

    el.config = config;
    document.body.appendChild(el);

    expect(el.config).toEqual(config);
  });

  it('initializes ECharts when connected with config', () => {
    const el = document.createElement('ds-chart');
    const config: Charts.LineChartConfig = {
      type: 'line',
      title: 'Test',
      xAxis: ['A'],
      series: [{ name: 'S', data: [1] }],
    };
    el.config = config;

    document.body.appendChild(el);

    expect(echarts.init).toHaveBeenCalledWith(el);
  });

  it('calls setOption with transformed config', () => {
    const el = document.createElement('ds-chart');
    const config: Charts.LineChartConfig = {
      type: 'line',
      title: 'Test Chart',
      xAxis: ['A'],
      series: [{ name: 'S', data: [1] }],
    };
    el.config = config;

    document.body.appendChild(el);

    expect(mockSetOption).toHaveBeenCalled();

    const calls = mockSetOption.mock.calls;
    if (calls.length === 0 || calls[0] === undefined) {
      throw new Error('Expected setOption to be called');
    }
    const optionArg = calls[0][0];
    expect(optionArg.title.text).toBe('Test Chart');
    expect(optionArg.series[0].type).toBe('line');
  });

  it('re-renders when config property changes', () => {
    const el = document.createElement('ds-chart');
    const lineConfig: Charts.LineChartConfig = {
      type: 'line',
      title: 'First',
      xAxis: ['A'],
      series: [{ name: 'S', data: [1] }],
    };
    el.config = lineConfig;

    document.body.appendChild(el);
    expect(mockSetOption).toHaveBeenCalledTimes(1);

    const barConfig: Charts.BarChartConfig = {
      type: 'bar',
      title: 'Second',
      xAxis: ['B'],
      series: [{ name: 'S2', data: [2] }],
    };
    el.config = barConfig;

    expect(mockSetOption).toHaveBeenCalledTimes(2);
    const calls = mockSetOption.mock.calls;
    if (calls.length < 2 || calls[1] === undefined) {
      throw new Error('Expected setOption to be called twice');
    }
    const secondCall = calls[1][0];
    expect(secondCall.title.text).toBe('Second');
  });

  it('accepts theme property', () => {
    const el = document.createElement('ds-chart');

    el.theme = 'dark';

    expect(el.theme).toBe('dark');
  });

  it('re-renders on theme property change', () => {
    const el = document.createElement('ds-chart');
    const config: Charts.LineChartConfig = {
      type: 'line',
      title: 'Test',
      xAxis: ['A'],
      series: [{ name: 'S', data: [1] }],
    };
    el.config = config;
    document.body.appendChild(el);

    expect(mockSetOption).toHaveBeenCalledTimes(1);

    el.theme = 'dark';
    expect(mockSetOption).toHaveBeenCalledTimes(2);

    el.theme = 'light';
    expect(mockSetOption).toHaveBeenCalledTimes(3);
  });

  it('does not re-render if theme is set to same value', () => {
    const el = document.createElement('ds-chart');
    const config: Charts.LineChartConfig = {
      type: 'line',
      title: 'Test',
      xAxis: ['A'],
      series: [{ name: 'S', data: [1] }],
    };
    el.config = config;
    el.theme = 'light';
    document.body.appendChild(el);

    const initialCalls = mockSetOption.mock.calls.length;

    el.theme = 'light'; // Same value
    expect(mockSetOption).toHaveBeenCalledTimes(initialCalls);
  });

  it('disposes ECharts on disconnect', () => {
    const el = document.createElement('ds-chart');
    const config: Charts.LineChartConfig = {
      type: 'line',
      title: 'Test',
      xAxis: ['A'],
      series: [{ name: 'S', data: [1] }],
    };
    el.config = config;

    document.body.appendChild(el);

    el.remove();

    expect(mockDispose).toHaveBeenCalled();
  });

  it('does not render if config is null', () => {
    const el = document.createElement('ds-chart');
    document.body.appendChild(el);

    expect(echarts.init).not.toHaveBeenCalled();
  });

  it('renders when config is set after connection', () => {
    const el = document.createElement('ds-chart');
    document.body.appendChild(el);

    expect(echarts.init).not.toHaveBeenCalled();

    const config: Charts.PieChartConfig = {
      type: 'pie',
      title: 'Pie',
      series: [{ name: 'A', value: 100 }],
    };
    el.config = config;

    expect(echarts.init).toHaveBeenCalled();
  });

  it('does not re-render on theme change when config is null', () => {
    const el = document.createElement('ds-chart');
    document.body.appendChild(el);

    el.theme = 'dark';

    expect(echarts.init).not.toHaveBeenCalled();
    expect(mockSetOption).not.toHaveBeenCalled();
  });

  it('calls chart.resize() when element is resized', () => {
    const el = document.createElement('ds-chart');
    const config: Charts.LineChartConfig = {
      type: 'line',
      title: 'Test',
      xAxis: ['A'],
      series: [{ name: 'S', data: [1] }],
    };
    el.config = config;
    document.body.appendChild(el);

    Setup.resizeObserverMock.triggerResize();

    expect(mockResize).toHaveBeenCalled();
  });

  it('disconnects ResizeObserver on element removal', () => {
    const el = document.createElement('ds-chart');
    const config: Charts.LineChartConfig = {
      type: 'line',
      title: 'Test',
      xAxis: ['A'],
      series: [{ name: 'S', data: [1] }],
    };
    el.config = config;
    document.body.appendChild(el);

    el.remove();

    expect(Setup.resizeObserverMock.disconnect).toHaveBeenCalled();
  });
});
