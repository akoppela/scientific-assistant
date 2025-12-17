// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

/**
 * Chart types and transforms for design system.
 *
 * Input types are simple, strictly-typed interfaces for LLM generation.
 * Transform functions convert to ECharts options with theme applied.
 * Colors are applied automatically by array index from design tokens.
 */

import * as Tokens from './tokens.js';

// ============================================================================
// Option Types (for type-safe testing)
// ============================================================================

// Shared style types
interface TextStyle {
  fontFamily: string;
  fontSize: string;
  fontWeight: number;
  color: string;
}

interface LabelStyle extends TextStyle {
  textBorderColor: string;
  textBorderWidth: number;
}

interface ItemStyle {
  color: string;
}

interface BorderedItemStyle extends ItemStyle {
  borderColor: string;
}

interface AreaStyle {
  color: string;
  opacity: number;
}

interface LineStyle {
  color: string;
}

// Positioning for non-grid chart elements
interface PositionStyle {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

// Data point types
export type Point2D = [number, number];
export type Point3D = [number, number, number];

// Helper functions to create typed points without assertions
function point2D(x: number, y: number): Point2D {
  return [x, y];
}

function point3D(x: number, y: number, z: number): Point3D {
  return [x, y, z];
}

// Common input series item types (for LLM input)
interface NamedDataSeries {
  name: string;
  data: number[];
}

interface NamedValueItem {
  name: string;
  value: number;
}

// Common option types
interface TitleOption {
  text: string;
  textStyle: TextStyle;
  top: number;
  padding: number[];
}

interface TooltipOption {
  trigger: 'axis' | 'item';
  backgroundColor: string;
  borderColor: string;
  borderWidth: number;
  textStyle: TextStyle;
}

interface LegendOption {
  data: string[];
  textStyle: TextStyle;
  itemGap: number;
  itemWidth: number;
  itemHeight: number;
}

interface GridOption {
  top: number;
  left: number;
  right: number;
  bottom: number;
}

// Axis options - separate types for with/without name
interface CategoryAxisOption {
  type: 'category';
  data: string[];
  axisLine: { lineStyle: LineStyle };
  axisLabel: TextStyle;
  nameTextStyle: TextStyle;
}

interface CategoryAxisOptionWithName extends CategoryAxisOption {
  name: string;
}

interface ValueAxisOption {
  type: 'value';
  axisLine: { lineStyle: LineStyle };
  axisLabel: TextStyle;
  splitLine: { lineStyle: LineStyle };
  nameTextStyle: TextStyle;
}

interface ValueAxisOptionWithName extends ValueAxisOption {
  name: string;
  nameLocation: 'center';
  nameGap: number;
}

// Series result types
interface LineSeriesOption {
  name: string;
  type: 'line';
  data: number[];
  color: string;
  itemStyle: ItemStyle;
}

interface AreaSeriesOption {
  name: string;
  type: 'line';
  data: number[];
  color: string;
  itemStyle: ItemStyle;
  areaStyle: AreaStyle;
}

interface BarSeriesOption {
  name: string;
  type: 'bar';
  data: number[];
  color: string;
  itemStyle: ItemStyle;
}

interface ScatterSeriesOption {
  name: string;
  type: 'scatter';
  data: Point2D[];
  color: string;
  itemStyle: ItemStyle;
}

interface BubbleSeriesOption {
  name: string;
  type: 'scatter';
  data: Point3D[];
  color: string;
  itemStyle: ItemStyle;
  symbolSize: (data: Point3D) => number;
}

interface PieDataItemOption {
  name: string;
  value: number;
  itemStyle: ItemStyle;
}

interface PieSeriesOption extends PositionStyle {
  type: 'pie';
  radius: string;
  data: PieDataItemOption[];
  label: LabelStyle;
}

interface DonutSeriesOption extends PositionStyle {
  type: 'pie';
  radius: [string, string];
  data: PieDataItemOption[];
  label: LabelStyle;
}

interface RadarIndicatorOption {
  name: string;
  max: number;
}

interface RadarDataItemOption {
  value: number[];
  name: string;
  itemStyle: ItemStyle;
  lineStyle: LineStyle;
  areaStyle: AreaStyle;
}

interface RadarSeriesOption {
  type: 'radar';
  data: RadarDataItemOption[];
}

interface RadarOption extends PositionStyle {
  indicator: RadarIndicatorOption[];
  axisLine: { lineStyle: LineStyle };
  splitLine: { lineStyle: LineStyle };
  axisName: { textStyle: TextStyle };
  radius: string;
}

interface GaugeDataOption {
  value: number;
}

interface GaugeSeriesOption extends PositionStyle {
  type: 'gauge';
  min: number;
  max: number;
  center: [string, string];
  data: GaugeDataOption[];
  axisLine: { lineStyle: { color: Array<[number, string]>; width: number } };
  progress: { show: boolean; itemStyle: ItemStyle };
  axisLabel: TextStyle;
  detail: TextStyle & { valueAnimation: boolean };
  pointer: { itemStyle: ItemStyle };
}

interface HeatmapSeriesOption {
  type: 'heatmap';
  data: Point3D[];
  label: LabelStyle & { show: boolean };
}

interface VisualMapOption {
  show: boolean;
  min: number;
  max: number;
  inRange: { color: [string, string] };
}

interface HistogramSeriesOption {
  type: 'bar';
  data: number[];
  color: string;
  itemStyle: ItemStyle;
}

interface BoxplotSeriesOption {
  type: 'boxplot';
  data: number[][];
  itemStyle: BorderedItemStyle;
}

interface WaterfallPlaceholderSeriesOption {
  type: 'bar';
  stack: string;
  data: number[];
  itemStyle: { borderColor: 'transparent'; color: 'transparent' };
}

interface WaterfallValueSeriesOption {
  type: 'bar';
  stack: string;
  data: Array<number | string>;
  color: string;
  itemStyle: ItemStyle;
}

interface FunnelDataItemOption {
  name: string;
  value: number;
  itemStyle: { color: string; borderWidth: number };
}

interface FunnelSeriesOption extends PositionStyle {
  type: 'funnel';
  data: FunnelDataItemOption[];
  label: LabelStyle;
}

interface TreemapDataItemOption {
  name: string;
  value: number;
  itemStyle: ItemStyle;
  children: Array<{ name: string; value: number }> | undefined;
}

interface TreemapSeriesOption extends PositionStyle {
  type: 'treemap';
  breadcrumb: { show: boolean };
  data: TreemapDataItemOption[];
  label: LabelStyle;
}

interface SankeyNodeOption {
  name: string;
  itemStyle: ItemStyle;
  label: { position: 'left' | 'right' };
}

interface SankeyLinkOption {
  source: string;
  target: string;
  value: number;
}

interface SankeySeriesOption extends PositionStyle {
  type: 'sankey';
  data: SankeyNodeOption[];
  links: SankeyLinkOption[];
  label: LabelStyle;
  lineStyle: { color: string; opacity: number };
}

// Base interface with index signature for ECharts compatibility
interface EChartsCompatible {
  [key: string]: unknown;
}

// Chart result types (what each transform function returns)
export interface LineChartOption extends EChartsCompatible {
  title: TitleOption;
  tooltip: TooltipOption;
  legend: LegendOption;
  grid: GridOption;
  xAxis: CategoryAxisOption;
  yAxis: ValueAxisOption;
  series: LineSeriesOption[];
}

export interface BarChartOption extends EChartsCompatible {
  title: TitleOption;
  tooltip: TooltipOption;
  legend: LegendOption;
  grid: GridOption;
  xAxis: CategoryAxisOption;
  yAxis: ValueAxisOption;
  series: BarSeriesOption[];
}

export interface AreaChartOption extends EChartsCompatible {
  title: TitleOption;
  tooltip: TooltipOption;
  legend: LegendOption;
  grid: GridOption;
  xAxis: CategoryAxisOption;
  yAxis: ValueAxisOption;
  series: AreaSeriesOption[];
}

export interface ScatterChartOption extends EChartsCompatible {
  title: TitleOption;
  tooltip: TooltipOption;
  legend: LegendOption;
  grid: GridOption;
  xAxis: ValueAxisOptionWithName;
  yAxis: ValueAxisOptionWithName;
  series: ScatterSeriesOption[];
}

export interface BubbleChartOption extends EChartsCompatible {
  title: TitleOption;
  tooltip: TooltipOption;
  legend: LegendOption;
  grid: GridOption;
  xAxis: ValueAxisOptionWithName;
  yAxis: ValueAxisOptionWithName;
  series: BubbleSeriesOption[];
}

export interface PieChartOption extends EChartsCompatible {
  title: TitleOption;
  tooltip: TooltipOption;
  legend: LegendOption;
  series: [PieSeriesOption];
}

export interface DonutChartOption extends EChartsCompatible {
  title: TitleOption;
  tooltip: TooltipOption;
  legend: LegendOption;
  series: [DonutSeriesOption];
}

export interface RadarChartOption extends EChartsCompatible {
  title: TitleOption;
  tooltip: TooltipOption;
  legend: LegendOption;
  radar: RadarOption;
  series: RadarSeriesOption[];
}

export interface GaugeChartOption extends EChartsCompatible {
  title: TitleOption;
  tooltip: TooltipOption;
  series: [GaugeSeriesOption];
}

export interface HeatmapChartOption extends EChartsCompatible {
  title: TitleOption;
  tooltip: TooltipOption;
  grid: GridOption;
  xAxis: CategoryAxisOption;
  yAxis: CategoryAxisOption;
  visualMap: VisualMapOption;
  series: [HeatmapSeriesOption];
}

export interface HistogramChartOption extends EChartsCompatible {
  title: TitleOption;
  tooltip: TooltipOption;
  grid: GridOption;
  xAxis: CategoryAxisOption;
  yAxis: ValueAxisOption;
  series: [HistogramSeriesOption];
}

export interface BoxplotChartOption extends EChartsCompatible {
  title: TitleOption;
  tooltip: TooltipOption;
  grid: GridOption;
  xAxis: CategoryAxisOption;
  yAxis: ValueAxisOption;
  series: [BoxplotSeriesOption];
}

export interface WaterfallChartOption extends EChartsCompatible {
  title: TitleOption;
  tooltip: TooltipOption;
  grid: GridOption;
  xAxis: CategoryAxisOption;
  yAxis: ValueAxisOption;
  series: [WaterfallPlaceholderSeriesOption, WaterfallValueSeriesOption, WaterfallValueSeriesOption];
}

export interface FunnelChartOption extends EChartsCompatible {
  title: TitleOption;
  tooltip: TooltipOption;
  legend: LegendOption;
  series: [FunnelSeriesOption];
}

export interface TreemapChartOption extends EChartsCompatible {
  title: TitleOption;
  tooltip: TooltipOption;
  series: [TreemapSeriesOption];
}

export interface SankeyChartOption extends EChartsCompatible {
  title: TitleOption;
  tooltip: TooltipOption;
  series: [SankeySeriesOption];
}

// Union of all chart option types
export type ChartOption =
  | LineChartOption
  | BarChartOption
  | AreaChartOption
  | ScatterChartOption
  | BubbleChartOption
  | PieChartOption
  | DonutChartOption
  | RadarChartOption
  | GaugeChartOption
  | HeatmapChartOption
  | HistogramChartOption
  | BoxplotChartOption
  | WaterfallChartOption
  | FunnelChartOption
  | TreemapChartOption
  | SankeyChartOption;

// ============================================================================
// Chart Tokens (from CSS)
// ============================================================================

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
  fontWeightNormal: number;
  fontWeightSemibold: number;
  space1: number;
  space2: number;
  space3: number;
  space6: number;
  space7: number;
  space10: number;
  space12: number;
  space14: number;
  space16: number;
  space20: number;
}

/**
 * Get chart tokens from CSS custom properties.
 * Reads computed styles, so values are theme-aware.
 */
export function getChartTokens(element: Element = document.documentElement): ChartTokens {
  const t = Tokens.getTokens(element);

  return {
    // Colors
    dataColors: t.colors.data,
    text: t.colors.text,
    textSecondary: t.colors.textSecondary,
    textInverse: t.colors.textInverse,
    border: t.colors.border,
    borderStrong: t.colors.borderStrong,
    bgSurface: t.colors.bgSurface,

    // Typography
    fontSans: t.fonts.sans,
    fontSizeXs: t.fontSizes.xs,
    fontSizeLg: t.fontSizes.lg,
    fontWeightNormal: t.fontWeights.normal,
    fontWeightSemibold: t.fontWeights.semibold,

    // Spacing (pixels)
    space1: t.spacing[1],
    space2: t.spacing[2],
    space3: t.spacing[3],
    space6: t.spacing[6],
    space7: t.spacing[7],
    space10: t.spacing[10],
    space12: t.spacing[12],
    space14: t.spacing[14],
    space16: t.spacing[16],
    space20: t.spacing[20],
  };
}

// ============================================================================
// Input Types (from LLM) - All fields required, no colorIndex
// ============================================================================

export interface LineChartConfig {
  type: 'line';
  title: string;
  xAxis: string[];
  series: NamedDataSeries[];
}

export interface BarChartConfig {
  type: 'bar';
  title: string;
  xAxis: string[];
  series: NamedDataSeries[];
}

export interface AreaChartConfig {
  type: 'area';
  title: string;
  xAxis: string[];
  series: NamedDataSeries[];
}

export interface ScatterChartConfig {
  type: 'scatter';
  title: string;
  xAxisName: string;
  yAxisName: string;
  series: Array<{
    name: string;
    data: Array<{ x: number; y: number }>;
  }>;
}

export interface BubbleChartConfig {
  type: 'bubble';
  title: string;
  xAxisName: string;
  yAxisName: string;
  series: Array<{
    name: string;
    data: Array<{ x: number; y: number; size: number }>;
  }>;
}

export interface PieChartConfig {
  type: 'pie';
  title: string;
  series: NamedValueItem[];
}

export interface DonutChartConfig {
  type: 'donut';
  title: string;
  series: NamedValueItem[];
}

export interface RadarChartConfig {
  type: 'radar';
  title: string;
  indicators: Array<{
    name: string;
    max: number;
  }>;
  series: Array<{
    name: string;
    values: number[];
  }>;
}

export interface GaugeChartConfig {
  type: 'gauge';
  title: string;
  value: number;
  min: number;
  max: number;
}

export interface HeatmapChartConfig {
  type: 'heatmap';
  title: string;
  data: Array<{
    x: string;
    y: string;
    value: number;
  }>;
}

export interface HistogramChartConfig {
  type: 'histogram';
  title: string;
  data: number[];
  bins: number;
}

export interface BoxplotChartConfig {
  type: 'boxplot';
  title: string;
  data: Array<{
    category: string;
    min: number;
    q1: number;
    median: number;
    q3: number;
    max: number;
  }>;
}

export interface WaterfallChartConfig {
  type: 'waterfall';
  title: string;
  data: Array<{
    label: string;
    value: number;
    isTotal: boolean;
  }>;
}

export interface FunnelChartConfig {
  type: 'funnel';
  title: string;
  series: NamedValueItem[];
}

export interface TreemapChartConfig {
  type: 'treemap';
  title: string;
  data: Array<{
    name: string;
    value: number;
    children?: Array<{
      name: string;
      value: number;
    }>;
  }>;
}

export interface SankeyChartConfig {
  type: 'sankey';
  title: string;
  links: Array<{
    source: string;
    target: string;
    value: number;
  }>;
}

export type ChartConfig =
  | LineChartConfig
  | BarChartConfig
  | AreaChartConfig
  | ScatterChartConfig
  | BubbleChartConfig
  | PieChartConfig
  | DonutChartConfig
  | RadarChartConfig
  | GaugeChartConfig
  | HeatmapChartConfig
  | HistogramChartConfig
  | BoxplotChartConfig
  | WaterfallChartConfig
  | FunnelChartConfig
  | TreemapChartConfig
  | SankeyChartConfig;

// ============================================================================
// Main Transform Function
// ============================================================================

export function toEChartsOption(config: ChartConfig, tokens: ChartTokens): ChartOption {
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
  }
}

// ============================================================================
// Shared Style Helpers (exported for testing)
// ============================================================================

// Safe color accessor that handles empty arrays gracefully
export function getColor(tokens: ChartTokens, index: number): string {
  const colors = tokens.dataColors;
  if (colors.length === 0) {
    return tokens.text; // Fallback to text color
  }
  const color = colors[index % colors.length];
  return color ?? tokens.text;
}

// Secondary text style for axis labels, legends, etc.
function secondaryTextStyle(tokens: ChartTokens): TextStyle {
  return {
    fontFamily: tokens.fontSans,
    fontSize: tokens.fontSizeXs,
    fontWeight: tokens.fontWeightNormal,
    color: tokens.textSecondary,
  };
}

// Primary text style for axis names, tooltips
function primaryTextStyle(tokens: ChartTokens): TextStyle {
  return {
    fontFamily: tokens.fontSans,
    fontSize: tokens.fontSizeXs,
    fontWeight: tokens.fontWeightNormal,
    color: tokens.text,
  };
}

export function titleStyle(title: string, tokens: ChartTokens) {
  return {
    text: title,
    textStyle: {
      color: tokens.text,
      fontFamily: tokens.fontSans,
      fontSize: tokens.fontSizeLg,
      fontWeight: tokens.fontWeightSemibold,
    },
    top: tokens.space2,
    padding: [0, 0, tokens.space6, 0],
  };
}

export function tooltipStyle(tokens: ChartTokens, trigger: 'axis' | 'item' = 'axis') {
  return {
    trigger,
    backgroundColor: tokens.bgSurface,
    borderColor: tokens.border,
    borderWidth: tokens.space1,
    textStyle: primaryTextStyle(tokens),
  };
}

export function legendStyle(names: string[], tokens: ChartTokens) {
  return {
    data: names,
    textStyle: secondaryTextStyle(tokens),
    itemGap: tokens.space6,
    itemWidth: tokens.space3,
    itemHeight: tokens.space3,
    icon: 'path://M5,0a5,5,0,1,0,5,5A5,5,0,0,0,5,0Z M0,13',
    bottom: 0,
    left: 'center',
  };
}

export function gridStyle(tokens: ChartTokens) {
  return {
    top: tokens.space14,
    left: tokens.space14,
    right: tokens.space7,
    bottom: tokens.space16,
  };
}

// Grid for charts without legend (Heatmap, Histogram, Boxplot, Waterfall)
export function gridStyleNoLegend(tokens: ChartTokens) {
  return {
    top: tokens.space14,
    left: tokens.space14,
    right: tokens.space7,
    bottom: 0,
  };
}

// Content area for non-grid charts with legend (Pie, Donut, Radar, Funnel)
export function contentStyle(tokens: ChartTokens) {
  return {
    top: tokens.space14,
    bottom: tokens.space16,
    left: tokens.space7,
    right: tokens.space7,
  };
}

// Content area for non-grid charts without legend (Gauge, Treemap, Sankey)
export function contentStyleNoLegend(tokens: ChartTokens) {
  return {
    top: tokens.space14,
    bottom: 0,
    left: tokens.space7,
    right: tokens.space7,
  };
}

export function categoryAxisStyle(data: string[], tokens: ChartTokens): CategoryAxisOption;
export function categoryAxisStyle(data: string[], tokens: ChartTokens, name: string): CategoryAxisOptionWithName;
export function categoryAxisStyle(
  data: string[],
  tokens: ChartTokens,
  name?: string
): CategoryAxisOption | CategoryAxisOptionWithName {
  const base: CategoryAxisOption = {
    type: 'category',
    data,
    axisLine: { lineStyle: { color: tokens.border } },
    axisLabel: secondaryTextStyle(tokens),
    nameTextStyle: primaryTextStyle(tokens),
  };
  if (name !== undefined) {
    return { ...base, name };
  }
  return base;
}

export function valueAxisStyle(tokens: ChartTokens): ValueAxisOption;
export function valueAxisStyle(tokens: ChartTokens, name: string): ValueAxisOptionWithName;
export function valueAxisStyle(tokens: ChartTokens, name?: string): ValueAxisOption | ValueAxisOptionWithName {
  const base: ValueAxisOption = {
    type: 'value',
    axisLine: { lineStyle: { color: tokens.border } },
    axisLabel: secondaryTextStyle(tokens),
    splitLine: { lineStyle: { color: tokens.border } },
    nameTextStyle: primaryTextStyle(tokens),
  };
  if (name !== undefined) {
    return { ...base, name, nameLocation: 'center', nameGap: tokens.space10 };
  }
  return base;
}

export function labelStyle(tokens: ChartTokens): LabelStyle {
  return {
    fontFamily: tokens.fontSans,
    fontSize: tokens.fontSizeXs,
    fontWeight: tokens.fontWeightNormal,
    color: tokens.textSecondary,
    textBorderColor: 'transparent',
    textBorderWidth: 0,
  };
}

export function labelStyleInverse(tokens: ChartTokens): LabelStyle {
  return {
    fontFamily: tokens.fontSans,
    fontSize: tokens.fontSizeXs,
    fontWeight: tokens.fontWeightNormal,
    color: tokens.textInverse,
    textBorderColor: 'transparent',
    textBorderWidth: 0,
  };
}

// ============================================================================
// Individual Transform Functions (exported for testing)
// ============================================================================

export function lineToECharts(config: LineChartConfig, tokens: ChartTokens): LineChartOption {
  return {
    title: titleStyle(config.title, tokens),
    tooltip: tooltipStyle(tokens),
    legend: legendStyle(
      config.series.map(s => s.name),
      tokens
    ),
    grid: gridStyle(tokens),
    xAxis: categoryAxisStyle(config.xAxis, tokens),
    yAxis: valueAxisStyle(tokens),
    series: config.series.map((s, i) => ({
      name: s.name,
      type: 'line' as const,
      data: s.data,
      color: getColor(tokens, i),
      itemStyle: { color: getColor(tokens, i) },
    })),
  };
}

export function barToECharts(config: BarChartConfig, tokens: ChartTokens): BarChartOption {
  return {
    title: titleStyle(config.title, tokens),
    tooltip: tooltipStyle(tokens),
    legend: legendStyle(
      config.series.map(s => s.name),
      tokens
    ),
    grid: gridStyle(tokens),
    xAxis: categoryAxisStyle(config.xAxis, tokens),
    yAxis: valueAxisStyle(tokens),
    series: config.series.map((s, i) => ({
      name: s.name,
      type: 'bar' as const,
      data: s.data,
      color: getColor(tokens, i),
      itemStyle: { color: getColor(tokens, i) },
    })),
  };
}

export function areaToECharts(config: AreaChartConfig, tokens: ChartTokens): AreaChartOption {
  return {
    title: titleStyle(config.title, tokens),
    tooltip: tooltipStyle(tokens),
    legend: legendStyle(
      config.series.map(s => s.name),
      tokens
    ),
    grid: gridStyle(tokens),
    xAxis: categoryAxisStyle(config.xAxis, tokens),
    yAxis: valueAxisStyle(tokens),
    series: config.series.map((s, i) => ({
      name: s.name,
      type: 'line' as const,
      data: s.data,
      color: getColor(tokens, i),
      itemStyle: { color: getColor(tokens, i) },
      areaStyle: { color: getColor(tokens, i), opacity: 0.3 },
    })),
  };
}

export function scatterToECharts(config: ScatterChartConfig, tokens: ChartTokens): ScatterChartOption {
  return {
    title: titleStyle(config.title, tokens),
    tooltip: tooltipStyle(tokens, 'item'),
    legend: legendStyle(
      config.series.map(s => s.name),
      tokens
    ),
    grid: {
      ...gridStyle(tokens),
      bottom: tokens.space20 + tokens.space6,
    },
    xAxis: valueAxisStyle(tokens, config.xAxisName),
    yAxis: valueAxisStyle(tokens, config.yAxisName),
    series: config.series.map((s, i) => ({
      name: s.name,
      type: 'scatter' as const,
      data: s.data.map(d => point2D(d.x, d.y)),
      color: getColor(tokens, i),
      itemStyle: { color: getColor(tokens, i) },
    })),
  };
}

export function bubbleToECharts(config: BubbleChartConfig, tokens: ChartTokens): BubbleChartOption {
  return {
    title: titleStyle(config.title, tokens),
    tooltip: tooltipStyle(tokens, 'item'),
    legend: legendStyle(
      config.series.map(s => s.name),
      tokens
    ),
    grid: {
      ...gridStyle(tokens),
      bottom: tokens.space20 + tokens.space6,
    },
    xAxis: valueAxisStyle(tokens, config.xAxisName),
    yAxis: valueAxisStyle(tokens, config.yAxisName),
    series: config.series.map((s, i) => ({
      name: s.name,
      type: 'scatter' as const,
      data: s.data.map(d => point3D(d.x, d.y, d.size)),
      color: getColor(tokens, i),
      itemStyle: { color: getColor(tokens, i) },
      symbolSize: (data: Point3D) => Math.sqrt(data[2]) * 2,
    })),
  };
}

export function pieToECharts(config: PieChartConfig, tokens: ChartTokens): PieChartOption {
  const content = contentStyle(tokens);
  return {
    title: titleStyle(config.title, tokens),
    tooltip: tooltipStyle(tokens, 'item'),
    legend: legendStyle(
      config.series.map(s => s.name),
      tokens
    ),
    series: [
      {
        type: 'pie' as const,
        radius: '90%',
        top: content.top,
        bottom: content.bottom,
        left: content.left,
        right: content.right,
        data: config.series.map((s, i) => ({
          name: s.name,
          value: s.value,
          itemStyle: { color: getColor(tokens, i) },
        })),
        label: labelStyle(tokens),
      },
    ],
  };
}

export function donutToECharts(config: DonutChartConfig, tokens: ChartTokens): DonutChartOption {
  const content = contentStyle(tokens);
  return {
    title: titleStyle(config.title, tokens),
    tooltip: tooltipStyle(tokens, 'item'),
    legend: legendStyle(
      config.series.map(s => s.name),
      tokens
    ),
    series: [
      {
        type: 'pie' as const,
        radius: ['45%', '90%'],
        top: content.top,
        bottom: content.bottom,
        left: content.left,
        right: content.right,
        data: config.series.map((s, i) => ({
          name: s.name,
          value: s.value,
          itemStyle: { color: getColor(tokens, i) },
        })),
        label: labelStyle(tokens),
      },
    ],
  };
}

export function radarToECharts(config: RadarChartConfig, tokens: ChartTokens): RadarChartOption {
  const content = contentStyle(tokens);
  return {
    title: titleStyle(config.title, tokens),
    tooltip: tooltipStyle(tokens, 'item'),
    legend: legendStyle(
      config.series.map(s => s.name),
      tokens
    ),
    radar: {
      indicator: config.indicators.map(ind => ({ name: ind.name, max: ind.max })),
      axisLine: { lineStyle: { color: tokens.border } },
      splitLine: { lineStyle: { color: tokens.border } },
      axisName: { textStyle: secondaryTextStyle(tokens) },
      radius: '54%',
      top: content.top,
      bottom: content.bottom,
      left: content.left,
      right: content.right,
    },
    series: [
      {
        type: 'radar' as const,
        data: config.series.map((s, i) => ({
          name: s.name,
          value: s.values,
          itemStyle: { color: getColor(tokens, i) },
          lineStyle: { color: getColor(tokens, i) },
          areaStyle: { color: getColor(tokens, i), opacity: 0.3 },
        })),
      },
    ],
  };
}

export function gaugeToECharts(config: GaugeChartConfig, tokens: ChartTokens): GaugeChartOption {
  const content = contentStyleNoLegend(tokens);
  const color = getColor(tokens, 0);
  return {
    title: titleStyle(config.title, tokens),
    tooltip: tooltipStyle(tokens, 'item'),
    series: [
      {
        type: 'gauge' as const,
        min: config.min,
        max: config.max,
        top: content.top,
        bottom: content.bottom,
        left: content.left,
        right: content.right,
        center: ['50%', '60%'],
        data: [{ value: config.value }],
        progress: { show: true, itemStyle: { color } },
        axisLine: { lineStyle: { color: [[1, tokens.border]], width: tokens.space3 } },
        axisLabel: secondaryTextStyle(tokens),
        detail: {
          fontFamily: tokens.fontSans,
          fontSize: tokens.fontSizeLg,
          fontWeight: tokens.fontWeightSemibold,
          color,
          valueAnimation: true,
        },
        pointer: { itemStyle: { color } },
      },
    ],
  };
}

export function heatmapToECharts(config: HeatmapChartConfig, tokens: ChartTokens): HeatmapChartOption {
  // Extract unique x and y values preserving order of first occurrence
  const xValues: string[] = [];
  const yValues: string[] = [];
  for (const d of config.data) {
    if (!xValues.includes(d.x)) xValues.push(d.x);
    if (!yValues.includes(d.y)) yValues.push(d.y);
  }

  // Convert named data to index-based for ECharts
  const indexedData: Point3D[] = config.data.map(d => [xValues.indexOf(d.x), yValues.indexOf(d.y), d.value]);

  return {
    title: titleStyle(config.title, tokens),
    tooltip: tooltipStyle(tokens, 'item'),
    grid: gridStyleNoLegend(tokens),
    xAxis: categoryAxisStyle(xValues, tokens),
    yAxis: categoryAxisStyle(yValues, tokens),
    visualMap: {
      show: false,
      min: Math.min(...config.data.map(d => d.value)),
      max: Math.max(...config.data.map(d => d.value)),
      inRange: { color: [tokens.border, getColor(tokens, 0)] },
    },
    series: [
      {
        type: 'heatmap' as const,
        data: indexedData,
        label: { show: true, ...labelStyleInverse(tokens) },
      },
    ],
  };
}

export function histogramToECharts(config: HistogramChartConfig, tokens: ChartTokens): HistogramChartOption {
  const min = Math.min(...config.data);
  const max = Math.max(...config.data);
  const binWidth = (max - min) / config.bins;
  const bins = Array.from({ length: config.bins }, (_, i) => {
    const binStart = min + i * binWidth;
    const binEnd = binStart + binWidth;
    const count = config.data.filter(d => d >= binStart && (i === config.bins - 1 ? d <= binEnd : d < binEnd)).length;
    return { label: `${binStart.toFixed(1)}-${binEnd.toFixed(1)}`, count };
  });

  return {
    title: titleStyle(config.title, tokens),
    tooltip: tooltipStyle(tokens),
    grid: gridStyleNoLegend(tokens),
    xAxis: categoryAxisStyle(
      bins.map(b => b.label),
      tokens
    ),
    yAxis: valueAxisStyle(tokens),
    series: [
      {
        type: 'bar' as const,
        data: bins.map(b => b.count),
        color: getColor(tokens, 0),
        itemStyle: { color: getColor(tokens, 0) },
      },
    ],
  };
}

export function boxplotToECharts(config: BoxplotChartConfig, tokens: ChartTokens): BoxplotChartOption {
  const categories = config.data.map(d => d.category);
  const values = config.data.map(d => [d.min, d.q1, d.median, d.q3, d.max]);

  return {
    title: titleStyle(config.title, tokens),
    tooltip: tooltipStyle(tokens, 'item'),
    grid: gridStyleNoLegend(tokens),
    xAxis: categoryAxisStyle(categories, tokens),
    yAxis: valueAxisStyle(tokens),
    series: [
      {
        type: 'boxplot' as const,
        data: values,
        itemStyle: {
          color: tokens.bgSurface,
          borderColor: getColor(tokens, 0),
        },
      },
    ],
  };
}

export function waterfallToECharts(config: WaterfallChartConfig, tokens: ChartTokens): WaterfallChartOption {
  const labels = config.data.map(d => d.label);
  const placeholder: number[] = [];
  const increase: (number | string)[] = [];
  const decrease: (number | string)[] = [];

  let runningTotal = 0;

  config.data.forEach(d => {
    if (d.isTotal) {
      placeholder.push(0);
      increase.push(d.value);
      decrease.push('-');
      runningTotal = d.value;
    } else if (d.value >= 0) {
      placeholder.push(runningTotal);
      increase.push(d.value);
      decrease.push('-');
      runningTotal += d.value;
    } else {
      placeholder.push(runningTotal + d.value);
      increase.push('-');
      decrease.push(Math.abs(d.value));
      runningTotal += d.value;
    }
  });

  const increaseColor = getColor(tokens, 0);
  const decreaseColor = getColor(tokens, 3);

  return {
    title: titleStyle(config.title, tokens),
    tooltip: tooltipStyle(tokens),
    grid: gridStyleNoLegend(tokens),
    xAxis: categoryAxisStyle(labels, tokens),
    yAxis: valueAxisStyle(tokens),
    series: [
      {
        type: 'bar' as const,
        stack: 'waterfall',
        itemStyle: { borderColor: 'transparent', color: 'transparent' },
        data: placeholder,
      },
      {
        type: 'bar' as const,
        stack: 'waterfall',
        data: increase,
        color: increaseColor,
        itemStyle: { color: increaseColor },
      },
      {
        type: 'bar' as const,
        stack: 'waterfall',
        data: decrease,
        color: decreaseColor,
        itemStyle: { color: decreaseColor },
      },
    ],
  };
}

export function funnelToECharts(config: FunnelChartConfig, tokens: ChartTokens): FunnelChartOption {
  const content = contentStyle(tokens);
  return {
    title: titleStyle(config.title, tokens),
    tooltip: tooltipStyle(tokens, 'item'),
    legend: legendStyle(
      config.series.map(s => s.name),
      tokens
    ),
    series: [
      {
        type: 'funnel' as const,
        top: content.top,
        bottom: content.bottom,
        left: content.left,
        right: content.right,
        data: config.series.map((s, i) => ({
          name: s.name,
          value: s.value,
          itemStyle: { color: getColor(tokens, i), borderWidth: 0 },
        })),
        label: labelStyle(tokens),
      },
    ],
  };
}

export function treemapToECharts(config: TreemapChartConfig, tokens: ChartTokens): TreemapChartOption {
  const content = contentStyleNoLegend(tokens);
  return {
    title: titleStyle(config.title, tokens),
    tooltip: tooltipStyle(tokens, 'item'),
    series: [
      {
        type: 'treemap' as const,
        top: content.top,
        bottom: content.bottom,
        left: content.left,
        right: content.right,
        breadcrumb: { show: false },
        data: config.data.map((d, i) => ({
          name: d.name,
          value: d.value,
          itemStyle: { color: getColor(tokens, i) },
          children: d.children,
        })),
        label: labelStyleInverse(tokens),
      },
    ],
  };
}

export function sankeyToECharts(config: SankeyChartConfig, tokens: ChartTokens): SankeyChartOption {
  const content = contentStyleNoLegend(tokens);
  // Extract unique nodes and identify rightmost nodes (targets that are never sources)
  const sources = new Set<string>();
  const targets = new Set<string>();
  for (const link of config.links) {
    sources.add(link.source);
    targets.add(link.target);
  }
  // Rightmost nodes are targets that never appear as sources
  const rightmostNodes = new Set([...targets].filter(t => !sources.has(t)));
  const allNodes = new Set([...sources, ...targets]);

  return {
    title: titleStyle(config.title, tokens),
    tooltip: tooltipStyle(tokens, 'item'),
    series: [
      {
        type: 'sankey' as const,
        top: content.top,
        bottom: content.bottom,
        left: content.left,
        right: content.right,
        data: Array.from(allNodes).map((name, i) => ({
          name,
          itemStyle: { color: getColor(tokens, i) },
          label: { position: rightmostNodes.has(name) ? 'left' : 'right' },
        })),
        links: config.links,
        label: labelStyle(tokens),
        lineStyle: { color: 'source', opacity: 0.15 },
      },
    ],
  };
}
