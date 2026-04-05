# React & Next.js Integration Guide

Using the official Spline packages for React and Next.js provides the best developer experience.

## React Integration

1. Install the package:
```bash
npm install @splinetool/react-spline
```

2. Use the component in your React application:
```tsx
import Spline from '@splinetool/react-spline';

export default function App() {
  return (
    <Spline scene="https://prod.spline.design/your-scene-id/scene.splinecode" />
  );
}
```

## Next.js Integration

For Next.js, use the specialized Next.js component to ensure proper handling of server-side rendering and hydration.

1. Install the package:
```bash
npm install @splinetool/react-spline
```

2. Use the specialized Next.js import:
```tsx
import Spline from '@splinetool/react-spline/next';

export default function MyPage() {
  return (
    <main>
      <Spline scene="https://prod.spline.design/your-scene-id/scene.splinecode" />
    </main>
  );
}
```

## Lazy Loading (Recommended)

To improve initial page load performance, lazy load the Spline component.

```tsx
import React, { Suspense } from 'react';

const Spline = React.lazy(() => import('@splinetool/react-spline'));

export default function App() {
  return (
    <Suspense fallback={<div>Loading 3D Scene...</div>}>
      <Spline scene="https://prod.spline.design/your-scene-id/scene.splinecode" />
    </Suspense>
  );
}
```
