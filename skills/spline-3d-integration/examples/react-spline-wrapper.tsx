import React, { Suspense, lazy } from 'react';

// Lazy loading the Spline component to prevent blocking the main thread
const Spline = lazy(() => import('@splinetool/react-spline'));

interface SplineWrapperProps {
  scene: string;
}

/**
 * A production-ready wrapper for Spline scenes.
 * Includes a suspense fallback to minimize layout shift and handle loading states.
 */
const SplineWrapper: React.FC<SplineWrapperProps> = ({ scene }) => {
  return (
    <div className="spline-wrapper" style={{ width: '100%', height: '100%', position: 'relative' }}>
      <Suspense fallback={<SplinePlaceholder />}>
        <Spline scene={scene} />
      </Suspense>
      
      <style>{`
        .spline-wrapper {
          min-height: 400px;
          background: radial-gradient(circle, #222 0%, #000 100%);
          border-radius: 12px;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
};

const SplinePlaceholder = () => (
  <div style={{
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    color: '#666',
    fontFamily: 'sans-serif'
  }}>
    Initializing 3D Environment...
  </div>
);

export default SplineWrapper;
