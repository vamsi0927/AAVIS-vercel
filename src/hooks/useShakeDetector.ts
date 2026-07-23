import { useEffect, useRef } from 'react';

export function useShakeDetector(onShake: () => void) {
  // Config
  const shakeThreshold = 15; // Mobile acceleration threshold
  const mouseWiggleThreshold = 5; // How many direction changes for PC
  const mouseWiggleSpeedLimit = 400; // ms window to achieve wiggles
  
  // Mobile state
  const lastX = useRef<number | null>(null);
  const lastY = useRef<number | null>(null);
  const lastZ = useRef<number | null>(null);
  const lastUpdate = useRef(0);
  
  // PC state
  const lastMouseX = useRef(0);
  const mouseDirection = useRef(0); // 1 for right, -1 for left
  const wiggleCount = useRef(0);
  const lastWiggleTime = useRef(0);
  
  // Throttle callback to avoid spam
  const lastTriggerTime = useRef(0);

  useEffect(() => {
    const triggerShake = () => {
      const now = new Date().getTime();
      if (now - lastTriggerTime.current > 3000) { // Only trigger once every 3 seconds
        lastTriggerTime.current = now;
        onShake();
      }
    };

    // 1. Mobile Shake Detection
    const handleDeviceMotion = (event: DeviceMotionEvent) => {
      const current = event.accelerationIncludingGravity;
      if (!current || current.x === null || current.y === null || current.z === null) return;
      
      const currentTime = new Date().getTime();
      if ((currentTime - lastUpdate.current) > 100) {
        const diffTime = (currentTime - lastUpdate.current);
        lastUpdate.current = currentTime;

        if (lastX.current !== null && lastY.current !== null && lastZ.current !== null) {
          const speed = Math.abs(current.x + current.y + current.z - lastX.current - lastY.current - lastZ.current) / diffTime * 10000;
          
          if (speed > shakeThreshold * 100) {
            triggerShake();
          }
        }
        lastX.current = current.x;
        lastY.current = current.y;
        lastZ.current = current.z;
      }
    };

    // 2. PC / Trackpad Mouse Wiggle Detection
    const handleMouseMove = (event: MouseEvent) => {
      const currentTime = new Date().getTime();
      const deltaX = event.clientX - lastMouseX.current;
      
      // Reset wiggle count if too much time has passed
      if (currentTime - lastWiggleTime.current > mouseWiggleSpeedLimit) {
        wiggleCount.current = 0;
      }

      if (Math.abs(deltaX) > 20) { // Require a meaningful movement distance
        const newDirection = deltaX > 0 ? 1 : -1;
        
        // Did we change direction?
        if (mouseDirection.current !== 0 && mouseDirection.current !== newDirection) {
          wiggleCount.current += 1;
          lastWiggleTime.current = currentTime;
          
          if (wiggleCount.current >= mouseWiggleThreshold) {
            wiggleCount.current = 0; // Reset
            triggerShake();
          }
        }
        
        mouseDirection.current = newDirection;
        lastMouseX.current = event.clientX;
      }
    };

    window.addEventListener('devicemotion', handleDeviceMotion);
    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('devicemotion', handleDeviceMotion);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [onShake]);
}
