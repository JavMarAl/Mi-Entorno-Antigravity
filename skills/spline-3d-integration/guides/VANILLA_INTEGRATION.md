# Vanilla Integration Guide

To embed a Spline scene in a vanilla HTML/JS project, you can use the `<spline-viewer>` web component or the `@splinetool/runtime` package.

## Using `<spline-viewer>`

This is the easiest way to embed a Spline scene.

1. Add the script to your HTML `<head>`:
```html
<script type="module" src="https://unpkg.com/@splinetool/viewer@1.0.28/build/spline-viewer.js"></script>
```

2. Add the `<spline-viewer>` tag to your body:
```html
<spline-viewer url="https://prod.spline.design/your-scene-id/scene.splinecode"></spline-viewer>
```

## Using `@splinetool/runtime`

For more programmatic control, use the runtime API.

1. Install the package (if using a bundler like Vite):
```bash
npm install @splinetool/runtime
```

2. Import and use it in your JavaScript:
```javascript
import { Application } from '@splinetool/runtime';

const canvas = document.getElementById('canvas3d');
const app = new Application(canvas);
app.load('https://prod.spline.design/your-scene-id/scene.splinecode');
```

## Tips
- Ensure the canvas has a defined width and height.
- Use CSS to position the canvas/viewer within your layout.
