import { useEffect, useRef } from 'react';

interface InteractiveBackgroundProps {
  mode?: 'restrained' | 'landing';
  className?: string;
}

/**
 * InteractiveBackground
 * High-performance cursor-following ambient illumination and technical grid depth.
 * Uses requestAnimationFrame with lerp interpolation, CSS custom properties,
 * and zero React state updates on pointermove.
 * Automatically halts RAF loops when motionless, disables tracking on touch screens,
 * and respects prefers-reduced-motion.
 */
export function InteractiveBackground({
  mode = 'restrained',
  className = '',
}: InteractiveBackgroundProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Check for touch / coarse pointer devices or reduced motion
    const isTouch = window.matchMedia('(pointer: coarse)').matches;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (isTouch || prefersReducedMotion || !containerRef.current) {
      return;
    }

    const container = containerRef.current;
    let targetX = window.innerWidth / 2;
    let targetY = window.innerHeight / 2;
    let currentX = targetX;
    let currentY = targetY;
    let rafId: number | null = null;
    let isMoving = false;

    // Linear interpolation factor for smooth, delayed following
    const lerpFactor = mode === 'landing' ? 0.075 : 0.06;

    const updateGlowPosition = () => {
      const dx = targetX - currentX;
      const dy = targetY - currentY;

      // Update positions with lerp
      currentX += dx * lerpFactor;
      currentY += dy * lerpFactor;

      // Update CSS variables directly on DOM node
      container.style.setProperty('--cursor-x', `${currentX.toFixed(1)}px`);
      container.style.setProperty('--cursor-y', `${currentY.toFixed(1)}px`);

      // Calculate subtle parallax offset (max 12px on landing, 6px on dashboard)
      const maxParallax = mode === 'landing' ? 12 : 6;
      const parallaxX = ((currentX / window.innerWidth) - 0.5) * maxParallax;
      const parallaxY = ((currentY / window.innerHeight) - 0.5) * maxParallax;
      container.style.setProperty('--parallax-x', `${parallaxX.toFixed(2)}px`);
      container.style.setProperty('--parallax-y', `${parallaxY.toFixed(2)}px`);

      // Continue animation until settled (distance < 0.2px)
      if (Math.abs(dx) > 0.2 || Math.abs(dy) > 0.2) {
        rafId = requestAnimationFrame(updateGlowPosition);
      } else {
        isMoving = false;
        rafId = null;
      }
    };

    const handlePointerMove = (e: PointerEvent) => {
      targetX = e.clientX;
      targetY = e.clientY;

      if (!isMoving) {
        isMoving = true;
        rafId = requestAnimationFrame(updateGlowPosition);
      }
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      if (rafId) {
        cancelAnimationFrame(rafId);
      }
    };
  }, [mode]);

  const isLanding = mode === 'landing';

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className={`pointer-events-none fixed inset-0 z-0 overflow-hidden select-none bg-[#050507] ${className}`}
      style={{
        // Default initial center position
        ['--cursor-x' as string]: '50vw',
        ['--cursor-y' as string]: '40vh',
        ['--parallax-x' as string]: '0px',
        ['--parallax-y' as string]: '0px',
      }}
    >
      {/* 1. Fine technical grid with subtle parallax drift */}
      <div
        className="absolute inset-[-20px] tech-grid-pattern transition-transform duration-300 ease-out"
        style={{
          opacity: isLanding ? 0.08 : 0.04,
          transform: 'translate3d(var(--parallax-x, 0px), var(--parallax-y, 0px), 0)',
        }}
      />

      {/* 2. Static ambient base glows (guarantees depth on mobile / touch) */}
      <div
        className="absolute top-[-10%] right-[10%] w-[500px] h-[500px] rounded-full blur-[140px] pointer-events-none"
        style={{
          background: isLanding
            ? 'radial-gradient(circle, rgba(139, 92, 246, 0.14) 0%, transparent 70%)'
            : 'radial-gradient(circle, rgba(139, 92, 246, 0.08) 0%, transparent 70%)',
        }}
      />
      <div
        className="absolute bottom-[-10%] left-[5%] w-[600px] h-[600px] rounded-full blur-[160px] pointer-events-none"
        style={{
          background: isLanding
            ? 'radial-gradient(circle, rgba(0, 245, 255, 0.12) 0%, transparent 70%)'
            : 'radial-gradient(circle, rgba(0, 245, 255, 0.06) 0%, transparent 70%)',
        }}
      />

      {/* 3. Smooth cursor-following dual-core ambient light (Royal Amethyst + Electric Cyan) */}
      <div
        className="absolute w-[680px] h-[680px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[120px] pointer-events-none transition-opacity duration-500 will-change-transform"
        style={{
          left: 'var(--cursor-x, 50vw)',
          top: 'var(--cursor-y, 40vh)',
          background: isLanding
            ? 'radial-gradient(circle, rgba(0, 245, 255, 0.16) 0%, rgba(139, 92, 246, 0.14) 40%, transparent 70%)'
            : 'radial-gradient(circle, rgba(0, 245, 255, 0.09) 0%, rgba(139, 92, 246, 0.08) 45%, transparent 70%)',
        }}
      />
    </div>
  );
}
