import { useEffect, useRef } from 'react';

interface MonsoonRainEffectProps {
  className?: string;
  intensity?: 'subtle' | 'moderate';
}

/**
 * MonsoonRainEffect
 * A lightweight, performant continuous rain particle canvas simulation.
 * Respects prefers-reduced-motion and pauses when offscreen or unfocused.
 */
export function MonsoonRainEffect({
  className = '',
  intensity = 'subtle',
}: MonsoonRainEffectProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || window.innerWidth);
    let height = (canvas.height = canvas.parentElement?.clientHeight || window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.parentElement?.clientWidth || window.innerWidth;
      height = canvas.height = canvas.parentElement?.clientHeight || window.innerHeight;
    };

    window.addEventListener('resize', handleResize, { passive: true });

    // Number of raindrops based on intensity and screen size
    const dropCount = intensity === 'moderate' ? Math.min(100, Math.floor(width / 14)) : Math.min(60, Math.floor(width / 22));

    interface Drop {
      x: number;
      y: number;
      length: number;
      speed: number;
      opacity: number;
    }

    interface Ripple {
      x: number;
      y: number;
      radius: number;
      maxRadius: number;
      opacity: number;
    }

    const drops: Drop[] = Array.from({ length: dropCount }, () => ({
      x: Math.random() * (width + 100) - 50,
      y: Math.random() * height,
      length: Math.random() * 18 + 12,
      speed: Math.random() * 9 + 14,
      opacity: Math.random() * 0.28 + 0.12,
    }));

    const ripples: Ripple[] = [];

    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      // Wind tilt angle: slight slant
      const windX = 2.4;

      // Draw and update rain drops
      ctx.lineWidth = 1.1;
      for (let i = 0; i < drops.length; i++) {
        const d = drops[i];

        ctx.strokeStyle = `rgba(186, 230, 253, ${d.opacity})`;
        ctx.beginPath();
        ctx.moveTo(d.x, d.y);
        ctx.lineTo(d.x + windX, d.y + d.length);
        ctx.stroke();

        d.x += windX;
        d.y += d.speed;

        // When drop reaches bottom area (ground puddle level)
        if (d.y > height - 30) {
          if (Math.random() < 0.35 && ripples.length < 25) {
            ripples.push({
              x: d.x,
              y: height - Math.random() * 25,
              radius: 1,
              maxRadius: Math.random() * 6 + 4,
              opacity: 0.3,
            });
          }

          d.y = -d.length;
          d.x = Math.random() * (width + 100) - 50;
        }
      }

      // Draw and update micro-ripples
      for (let i = ripples.length - 1; i >= 0; i--) {
        const r = ripples[i];
        ctx.strokeStyle = `rgba(0, 245, 255, ${r.opacity * 0.4})`;
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.ellipse(r.x, r.y, r.radius * 1.8, r.radius * 0.6, 0, 0, Math.PI * 2);
        ctx.stroke();

        r.radius += 0.45;
        r.opacity -= 0.016;

        if (r.opacity <= 0 || r.radius >= r.maxRadius) {
          ripples.splice(i, 1);
        }
      }

      animationFrameId = requestAnimationFrame(draw);
    };

    animationFrameId = requestAnimationFrame(draw);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [intensity]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 z-10 select-none ${className}`}
    />
  );
}
