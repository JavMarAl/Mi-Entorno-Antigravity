# Performance Optimization Guide

Spline scenes can be resource-intensive. Follow these tips to ensure a smooth user experience.

## Scene Optimization (In Spline Editor)

1. **Geometry Quality**: Set to 'Performance' in the Play Settings.
2. **Texture Size**: Use the smallest textures possible while maintaining visual quality.
3. **Materials**: Simplify materials. Avoid excessive use of glass or complex shaders if not needed.
4. **Shadows**: Disable shadows for objects that don't need them. Use baked shadows if possible.
5. **Hide Background**: Enable this to let the website's background show through, reducing rendering overhead.

## Implementation Optimization

1. **Lazy Loading**: Always lazy load the Spline component/script to prevent it from blocking the main thread during initial page load.
2. **Conditional Rendering**: Only render the Spline scene when the user is likely to see it (e.g., using an `IntersectionObserver`).
3. **Static Fallbacks**: Use a static image or a lightweight placeholder while the scene is loading.
4. **Unload on Unmount**: Ensure the Spline application is properly disposed of when the component unmounts to free up memory/GPU resources.

## Mobile Considerations

- **Simplify**: Consider showing a simplified version of the scene or a static image on mobile devices.
- **Interactions**: Disable intensive interactions like parallax or physics on low-end mobile hardware.
