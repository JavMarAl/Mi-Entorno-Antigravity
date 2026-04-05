# Common Problems & Troubleshooting

Here are typical issues encountered when integrating Spline scenes and how to fix them.

## 1. Scroll Hijacking
**Problem**: The Spline scene intercepts scroll events, preventing the user from scrolling the page.
**Solution**: Disable "Page Scroll" and "Zoom" in the Spline editor Play Settings. Alternatively, set `pointer-events: none` on the canvas/viewer if you don't need interactivity.

## 2. Layout Shift
**Problem**: The page jumps when the Spline scene finally loads and takes up space.
**Solution**: Provide a container with a fixed aspect ratio and a background color or loading image.
```css
.spline-container {
  aspect-ratio: 16 / 9;
  background: #111;
  width: 100%;
}
```

## 3. GPU Fallbacks
**Problem**: Some users might have hardware acceleration disabled, leading to a blank screen or poor performance.
**Solution**: Detect WebGL support and provide a fallback image.
```javascript
if (!window.WebGLRenderingContext) {
  // Show static image
}
```

## 4. Watermark Removal
**Problem**: The Spline logo appears in the corner.
**Solution**: This requires a Spline paid plan. If you have one, toggle "Hide Spline Logo" in the Play Settings.

## 5. Scene Not Loading
**Problem**: The console shows a 404 or CORS error.
**Solution**: Ensure the `.splinecode` URL is correct and public. Verify that you "Promoted to Production" after making changes in the editor.
