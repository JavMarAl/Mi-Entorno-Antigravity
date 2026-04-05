---
name: plotly
description: Interactive visualization library. Use when you need hover info, zoom, pan, or web-embeddable charts. Best for dashboards, exploratory analysis, and presentations. For static publication figures use matplotlib or scientific-visualization.
license: MIT license
metadata:
    skill-author: K-Dense Inc.
---

# Plotly

Python graphing library for creating interactive, publication-quality visualizations with 40+ chart types.

## Quick Start

```bash
uv pip install plotly
uv pip install kaleido  # optional, for static image export
```

```python
import plotly.express as px
fig = px.scatter(df, x='x', y='y', title='My Plot')
fig.show()
```

## Which API to Use?

| Use | When |
|-----|------|
| **Plotly Express** (`px`) | Quick standard charts from DataFrames, minimal code |
| **Graph Objects** (`go`) | Fine-grained control, complex multi-trace, custom shapes |

You can combine both — `px` returns `go.Figure`, so all `go` methods apply.

## Chart Types (40+)

| Category | Examples |
|----------|---------|
| Basic | scatter, line, bar, pie, area, bubble |
| Statistical | histogram, box, violin, error bars |
| Scientific | heatmap, contour, image, ternary |
| Financial | candlestick, OHLC, waterfall, funnel |
| Maps | scatter map, choropleth, density map |
| 3D | scatter3d, surface, mesh, cone, volume |
| Specialized | sunburst, treemap, sankey, parallel coords, gauge |

## Common Workflows

### Scientific visualization
```python
fig = px.scatter(df, x='temperature', y='yield', trendline='ols')
fig = px.imshow(corr_matrix, text_auto=True, color_continuous_scale='RdBu')
fig = go.Figure(data=[go.Surface(z=z, x=x, y=y)])
```

### Statistical analysis
```python
fig = px.histogram(df, x='values', color='group', marginal='box')
fig = px.box(df, x='category', y='value', points='all')
fig = px.violin(df, x='group', y='measurement', box=True)
```

### Time series
```python
fig = px.line(df, x='date', y='price')
fig.update_xaxes(rangeslider_visible=True)
```

### Multi-plot dashboards
```python
from plotly.subplots import make_subplots
fig = make_subplots(rows=2, cols=2, subplot_titles=('A', 'B', 'C', 'D'))
fig.add_trace(go.Scatter(x=[1,2,3], y=[4,5,6]), row=1, col=1)
```

## Export

```python
fig.write_html('chart.html')                          # Interactive
fig.write_html('chart.html', include_plotlyjs='cdn')  # Smaller
fig.write_image('chart.png')   # Static PNG (requires kaleido)
fig.write_image('chart.pdf')
fig.write_image('chart.svg')
```

## Integration with Dash

```bash
uv pip install dash
```
```python
import dash
from dash import dcc, html
app = dash.Dash(__name__)
app.layout = html.Div([html.H1('Dashboard'), dcc.Graph(figure=fig)])
app.run_server(debug=True)
```

## Reference Files

- `reference/plotly-express.md` — High-level API for quick visualizations
- `reference/graph-objects.md` — Low-level API for fine-grained control
- `reference/chart-types.md` — Complete catalog with examples
- `reference/layouts-styling.md` — Subplots, templates, colors, customization
- `reference/export-interactivity.md` — Export options and interactive features
