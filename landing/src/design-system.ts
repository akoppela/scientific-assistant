// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

/**
 * Design System page script.
 *
 * Handles theme toggle, animation demos, and chart rendering.
 */

import * as DesignSystem from '@scientific-assistant/design-system';

// ============================================================================
// Chart Data
// ============================================================================

export const chartConfigs: Record<string, DesignSystem.ChartConfig> = {
  line: {
    type: 'line',
    title: 'Temperature Trend',
    xAxis: ['Jan', 'Feb', 'Mar', 'Apr', 'May'],
    series: [
      { name: 'Moscow', data: [20, 40, 35, 60, 75] },
      { name: 'Sochi', data: [10, 25, 50, 40, 55] },
    ],
  },
  bar: {
    type: 'bar',
    title: 'Sales by Region',
    xAxis: ['Q1', 'Q2', 'Q3'],
    series: [
      { name: '2023', data: [80, 100, 90] },
      { name: '2024', data: [60, 70, 50] },
    ],
  },
  pie: {
    type: 'pie',
    title: 'Market Share',
    series: [
      { name: 'Product A', value: 40 },
      { name: 'Product B', value: 30 },
      { name: 'Product C', value: 20 },
      { name: 'Other', value: 10 },
    ],
  },
  donut: {
    type: 'donut',
    title: 'Budget Allocation',
    series: [
      { name: 'R&D', value: 37.5 },
      { name: 'Marketing', value: 25 },
      { name: 'Operations', value: 20 },
      { name: 'Admin', value: 17.5 },
    ],
  },
  scatter: {
    type: 'scatter',
    title: 'Height vs Weight',
    xAxisName: 'Height (cm)',
    yAxisName: 'Weight (kg)',
    series: [
      {
        name: 'Male',
        data: [
          { x: 180, y: 80 },
          { x: 190, y: 90 },
          { x: 175, y: 75 },
          { x: 195, y: 85 },
          { x: 185, y: 95 },
          { x: 178, y: 78 },
        ],
      },
      {
        name: 'Female',
        data: [
          { x: 160, y: 55 },
          { x: 155, y: 50 },
          { x: 165, y: 60 },
          { x: 158, y: 52 },
          { x: 162, y: 58 },
          { x: 152, y: 48 },
        ],
      },
    ],
  },
  area: {
    type: 'area',
    title: 'Revenue Growth',
    xAxis: ['2020', '2021', '2022', '2023', '2024'],
    series: [
      { name: 'Online', data: [30, 45, 55, 65, 75] },
      { name: 'Retail', data: [40, 50, 60, 70, 80] },
    ],
  },
  histogram: {
    type: 'histogram',
    title: 'Test Score Distribution',
    data: [15, 25, 35, 45, 55, 65, 75, 85, 95, 72, 68, 82, 78, 62, 88, 92, 58, 48, 38, 28],
    bins: 5,
  },
  boxplot: {
    type: 'boxplot',
    title: 'Salary Distribution by Department',
    data: [
      { category: 'Engineering', min: 40, q1: 50, median: 70, q3: 100, max: 120 },
      { category: 'Marketing', min: 35, q1: 50, median: 65, q3: 85, max: 95 },
      { category: 'Sales', min: 30, q1: 45, median: 60, q3: 90, max: 110 },
    ],
  },
  heatmap: {
    type: 'heatmap',
    title: 'Weekly Activity',
    data: [
      { x: '9am', y: 'Mon', value: 3 },
      { x: '11am', y: 'Mon', value: 6 },
      { x: '1pm', y: 'Mon', value: 4 },
      { x: '3pm', y: 'Mon', value: 8 },
      { x: '5pm', y: 'Mon', value: 5 },
      { x: '9am', y: 'Tue', value: 7 },
      { x: '11am', y: 'Tue', value: 9 },
      { x: '1pm', y: 'Tue', value: 5 },
      { x: '3pm', y: 'Tue', value: 6 },
      { x: '5pm', y: 'Tue', value: 4 },
      { x: '9am', y: 'Wed', value: 5 },
      { x: '11am', y: 'Wed', value: 7 },
      { x: '1pm', y: 'Wed', value: 10 },
      { x: '3pm', y: 'Wed', value: 8 },
      { x: '5pm', y: 'Wed', value: 3 },
      { x: '9am', y: 'Thu', value: 4 },
      { x: '11am', y: 'Thu', value: 6 },
      { x: '1pm', y: 'Thu', value: 7 },
      { x: '3pm', y: 'Thu', value: 9 },
      { x: '5pm', y: 'Thu', value: 6 },
      { x: '9am', y: 'Fri', value: 8 },
      { x: '11am', y: 'Fri', value: 5 },
      { x: '1pm', y: 'Fri', value: 3 },
      { x: '3pm', y: 'Fri', value: 2 },
      { x: '5pm', y: 'Fri', value: 1 },
    ],
  },
  radar: {
    type: 'radar',
    title: 'Skill Assessment',
    indicators: [
      { name: 'Coding', max: 100 },
      { name: 'Design', max: 100 },
      { name: 'Teamwork', max: 100 },
      { name: 'Leadership', max: 100 },
      { name: 'Analysis', max: 100 },
    ],
    series: [
      { name: 'Person A', values: [90, 80, 70, 60, 85] },
      { name: 'Person B', values: [75, 60, 80, 70, 65] },
    ],
  },
  bubble: {
    type: 'bubble',
    title: 'Population by GDP & Area',
    xAxisName: 'GDP per capita',
    yAxisName: 'Area (km²)',
    series: [
      {
        name: 'Countries',
        data: [
          { x: 20, y: 40, size: 24 },
          { x: 40, y: 60, size: 40 },
          { x: 70, y: 85, size: 56 },
          { x: 85, y: 50, size: 30 },
          { x: 95, y: 70, size: 44 },
          { x: 30, y: 20, size: 16 },
        ],
      },
    ],
  },
  waterfall: {
    type: 'waterfall',
    title: 'Profit Breakdown',
    data: [
      { label: 'Revenue', value: 100, isTotal: true },
      { label: 'COGS', value: -30, isTotal: false },
      { label: 'OpEx', value: -20, isTotal: false },
      { label: 'Tax', value: -15, isTotal: false },
      { label: 'Profit', value: 35, isTotal: true },
    ],
  },
  funnel: {
    type: 'funnel',
    title: 'Conversion Funnel',
    series: [
      { name: 'Visitors', value: 1000 },
      { name: 'Leads', value: 600 },
      { name: 'Qualified', value: 300 },
      { name: 'Customers', value: 100 },
    ],
  },
  gauge: {
    type: 'gauge',
    title: 'Performance Score',
    value: 75,
    min: 0,
    max: 100,
  },
  treemap: {
    type: 'treemap',
    title: 'Storage Usage',
    data: [
      { name: 'Documents', value: 40 },
      { name: 'Photos', value: 25 },
      { name: 'Videos', value: 20 },
      { name: 'Apps', value: 10 },
      { name: 'Other', value: 5 },
    ],
  },
  sankey: {
    type: 'sankey',
    title: 'Energy Flow',
    links: [
      { source: 'Coal', target: 'Electricity', value: 25 },
      { source: 'Coal', target: 'Heat', value: 15 },
      { source: 'Gas', target: 'Electricity', value: 20 },
      { source: 'Gas', target: 'Heat', value: 10 },
      { source: 'Solar', target: 'Electricity', value: 15 },
      { source: 'Electricity', target: 'Loss', value: 5 },
      { source: 'Heat', target: 'Loss', value: 5 },
    ],
  },
};

// ============================================================================
// Theme Management
// ============================================================================

const html = document.documentElement;
const toggleBtn = document.getElementById('theme-toggle');
const lightIcon = document.querySelector('.theme-icon-light');
const darkIcon = document.querySelector('.theme-icon-dark');

function updateThemeIcon(theme: string): void {
  if (theme === 'dark') {
    lightIcon?.classList.add('hidden');
    darkIcon?.classList.remove('hidden');
  } else {
    lightIcon?.classList.remove('hidden');
    darkIcon?.classList.add('hidden');
  }
}

function updateChartThemes(theme: string): void {
  document.querySelectorAll<DesignSystem.DsChart>('ds-chart').forEach(el => {
    el.theme = theme;
  });
}

// Load saved theme immediately (no animation)
const savedTheme = localStorage.getItem('theme') || 'light';
html.setAttribute('data-theme', savedTheme);
updateThemeIcon(savedTheme);

toggleBtn?.addEventListener('click', () => {
  const currentTheme = html.getAttribute('data-theme');
  const newTheme = currentTheme === 'light' ? 'dark' : 'light';
  html.setAttribute('data-theme', newTheme);
  localStorage.setItem('theme', newTheme);
  updateThemeIcon(newTheme);
  updateChartThemes(newTheme);
});

// Enable transitions after page renders
window.addEventListener('load', () => {
  document.body.classList.add('theme-transitions-enabled');
});

// ============================================================================
// Animation Demos
// ============================================================================

function triggerAnimation(elementId: string, animationClass: string): void {
  const el = document.getElementById(elementId);
  if (!el) return;

  el.classList.remove('animate-fade-in', 'animate-fade-out', 'animate-scale-in', 'animate-scale-out', 'animate-shake');
  void el.offsetWidth; // Force reflow
  el.classList.add(animationClass);
}

function triggerSlideUp(elementId: string): void {
  const el = document.getElementById(elementId);
  if (!el) return;

  el.style.animation = 'none';
  void el.offsetWidth;
  el.style.animation = 'slide-up var(--duration-animation-fast) ease-out';
}

// Expose to global scope for onclick handlers
declare global {
  interface Window {
    triggerAnimation: typeof triggerAnimation;
    triggerSlideUp: typeof triggerSlideUp;
  }
}

window.triggerAnimation = triggerAnimation;
window.triggerSlideUp = triggerSlideUp;

// ============================================================================
// Chart Initialization
// ============================================================================

function initCharts(): void {
  document.querySelectorAll<DesignSystem.DsChart>('ds-chart[data-chart]').forEach(el => {
    const chartType = el.dataset['chart'];
    if (chartType && chartConfigs[chartType]) {
      el.config = chartConfigs[chartType];
      el.theme = savedTheme;
    }
  });
}

// Wait for custom element to be defined, then initialize charts
customElements.whenDefined('ds-chart').then(() => {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCharts);
  } else {
    initCharts();
  }
});

// ============================================================================
// Menu Initialization
// ============================================================================

// SVG icons for demo (in real app, these come from Elm)
const moonSvg =
  '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" width="18" height="18"><path stroke-linecap="round" stroke-linejoin="round" d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z" /></svg>';
const globeSvg =
  '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" width="18" height="18"><path stroke-linecap="round" stroke-linejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5a17.92 17.92 0 0 1-8.716-2.247m0 0A8.966 8.966 0 0 1 3 12c0-1.97.633-3.794 1.708-5.282" /></svg>';
const helpSvg =
  '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" width="18" height="18"><path stroke-linecap="round" stroke-linejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 5.25h.008v.008H12v-.008Z" /></svg>';

// Initialize demo menu
document.addEventListener('DOMContentLoaded', () => {
  const menu = document.getElementById('demo-settings-menu');
  if (menu && menu instanceof DesignSystem.DsMenu) {
    menu.items = [
      { id: 'theme', type: 'action', icon: moonSvg, label: 'Dark theme', suffix: '' },
      { id: 'language', type: 'action', icon: globeSvg, label: 'Russian', suffix: 'RU' },
      { type: 'divider' },
      { id: 'help', type: 'action', icon: helpSvg, label: 'Help', suffix: '' },
    ];

    menu.addEventListener('item-click', (e: Event) => {
      if (e instanceof CustomEvent) {
        console.log('Menu item clicked:', e.detail.id);
      }
    });
  }
});
