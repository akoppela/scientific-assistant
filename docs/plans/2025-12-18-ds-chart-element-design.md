# ds-chart Custom Element

Design for rendering AI-generated charts in Elm via a custom HTML element.

## Problem

AI (Gemini) returns chart configurations as JSON. Elm needs to render these charts without complex JS interop. Solution must work in Elm app and any future web context.

## Design

### Custom Element: `<ds-chart>`

Single element that wraps ECharts. Elm passes config as `Encode.Value` via property.

**Elm usage:**
```elm
Html.node "ds-chart"
    [ Attrs.property "config" chartJson
    , Attrs.property "theme" (Encode.string model.theme)
    ]
    []
```

**Properties:**
- `config` (object): ECharts option configuration from AI
- `theme` (string): `"light"` or `"dark"` - triggers re-render with updated tokens

### Implementation

Single TypeScript file: `infra/design-system/js/chart-element.ts`

**Lifecycle:**
1. `connectedCallback`: Initialize ECharts instance, set up ResizeObserver
2. Property setters: Re-render chart with themed config
3. `disconnectedCallback`: Dispose ECharts instance, disconnect observer

**Theme handling:**
- Element reads CSS tokens via `getChartTokens()` on each render
- When `theme` property changes, re-apply colors and call `setOption`

**Resize handling:**
- ResizeObserver on element triggers `chart.resize()`
- CSS: `display: block; width: 100%;` with configurable height

### Supported Chart Types

Standard ECharts types only (no custom renderItem):
- line, bar, pie, scatter, area
- histogram, boxplot, heatmap, radar
- bubble, waterfall, funnel, gauge
- treemap, sankey, donut

Custom renders (violin, errorbar) deferred to future iteration.

### File Structure

```
infra/design-system/
  js/
    tokens.js         # Existing - reads CSS tokens
    chart-element.ts  # New - custom element
  package.json        # Add chart-element export
```

### Package Export

```json
{
  "exports": {
    "./js/tokens": "./js/tokens.js",
    "./js/chart-element": "./js/chart-element.js"
  }
}
```

### Registration

Consumer registers the element:
```javascript
import '@scientific-assistant/design-system/js/chart-element';
// Registers <ds-chart> globally
```

## Data Flow

```
AI Response (JSON) → Elm decodes → Encode.Value → <ds-chart config=...> → ECharts
                                        ↑
                          Model.theme → theme property
```

## Constraints

- Charts are static once rendered (AI output doesn't change)
- Theme is the only dynamic property
- No Elm-side chart manipulation needed
- Session serialization: `Encode.Value` is already JSON-serializable

## Testing

- Unit: Theme token application
- Integration: Element renders with sample configs
- Visual: Landing page continues to work (refactor to use element)

## Out of Scope

- Custom render functions (violin, errorbar)
- Chart interactivity callbacks to Elm
- Elm decoder for chart configs (pass through as `Value`)
