import React, { useEffect, useRef, useState } from 'react';

interface AnimatedNumberProps {
  value: string;
  duration?: number;
  className?: string;
}

const parseNumeric = (value: string): number | null => {
  const normalized = value.replace(/\s/g, '').replace(/,/g, '');
  if (!/^-?\d+(\.\d+)?$/.test(normalized)) return null;
  const numeric = Number(normalized);
  return Number.isFinite(numeric) ? numeric : null;
};

const decimalsOf = (value: string): number => {
  const [, decimals = ''] = value.split('.');
  return decimals.length;
};

const formatValue = (numeric: number, original: string): string =>
  numeric.toLocaleString('es-PE', {
    minimumFractionDigits: decimalsOf(original),
    maximumFractionDigits: decimalsOf(original),
  });

/**
 * Contador animado para indicadores. Mantiene el valor final en el nombre
 * accesible y anima solo la representación visual.
 */
export const AnimatedNumber: React.FC<AnimatedNumberProps> = ({
  value,
  duration = 900,
  className,
}) => {
  const target = parseNumeric(value);
  const [display, setDisplay] = useState(value);
  const previousRef = useRef(0);
  const frameRef = useRef<number>(0);

  useEffect(() => {
    if (target == null) {
      setDisplay(value);
      return;
    }

    const reduceMotion = typeof window !== 'undefined'
      && typeof window.matchMedia === 'function'
      && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reduceMotion || duration <= 0) {
      previousRef.current = target;
      setDisplay(formatValue(target, value));
      return;
    }

    const from = previousRef.current;
    const start = performance.now();

    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = from + (target - from) * eased;
      setDisplay(formatValue(current, value));
      if (progress < 1) {
        frameRef.current = window.requestAnimationFrame(tick);
      } else {
        previousRef.current = target;
      }
    };

    frameRef.current = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frameRef.current);
  }, [target, value, duration]);

  if (target == null) {
    return <span className={className}>{value}</span>;
  }

  return (
    <span className={className}>
      <span aria-hidden="true">{display}</span>
      <span className="sr-only">{value}</span>
    </span>
  );
};
