import Spline from '@splinetool/react-spline';
import { useRef } from 'react';

/**
 * This example shows how to use a ref to interact with the Spline instance.
 * You can programmatically control objects, change variables, or trigger animations.
 */
export default function InteractiveScene() {
  const splineRef = useRef<any>(null);

  function onLoad(splineApp: any) {
    // Save the spline instance to a ref
    splineRef.current = splineApp;
    console.log('Spline application loaded!');
  }

  function moveObject() {
    if (splineRef.current) {
        // Find an object by its ID or name
        const obj = splineRef.current.findObjectByName('Cube');
        
        if (obj) {
            // Modify properties programmatically
            obj.position.x += 10;
        }
    }
  }

  return (
    <div style={{ position: 'relative', width: '100%', height: '500px' }}>
      <Spline 
        scene="https://prod.spline.design/your-scene-id/scene.splinecode" 
        onLoad={onLoad}
      />
      
      <div style={{
        position: 'absolute',
        bottom: '20px',
        left: '20px',
        zIndex: 10
      }}>
        <button onClick={moveObject} style={{
            padding: '10px 20px',
            backgroundColor: '#fff',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            fontWeight: 'bold'
        }}>
          Move Cube
        </button>
      </div>
    </div>
  );
}
