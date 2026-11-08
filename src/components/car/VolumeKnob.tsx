// A big rotary volume knob. Drag it round (mouse or touch), scroll over it, or
// focus it and use the arrow keys. Sweeps 270° from -135° (silent) to +135°
// (full). Purely a control surface — the value lives in usePlayer.

import { useEffect, useRef } from 'react';

const SWEEP = 270;
const START = -135;
const LEDS = 15;
const STEP = 0.05;

function clamp01(v: number) {
  return Math.min(1, Math.max(0, v));
}

export function VolumeKnob({
  value,
  onChange,
}: {
  /** 0–1. Pass 0 when muted so the knob reads as silent. */
  value: number;
  onChange: (v: number) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const drag = useRef<{ lastAngle: number; value: number } | null>(null);
  // Keep the latest value/handler reachable from the native wheel listener.
  const latest = useRef({ value, onChange });
  useEffect(() => {
    latest.current = { value, onChange };
  });

  // React's onWheel is passive, so it can't stop the page scrolling. Attach a
  // native non-passive listener instead.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const dir = e.deltaY < 0 ? 1 : -1;
      latest.current.onChange(clamp01(latest.current.value + dir * STEP));
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  function angleOf(e: React.PointerEvent) {
    const r = ref.current!.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    // 0° = straight up, clockwise positive (matches the indicator rotation).
    return (Math.atan2(e.clientX - cx, cy - e.clientY) * 180) / Math.PI;
  }

  function onPointerDown(e: React.PointerEvent) {
    ref.current?.setPointerCapture(e.pointerId);
    drag.current = { lastAngle: angleOf(e), value };
  }

  function onPointerMove(e: React.PointerEvent) {
    const d = drag.current;
    if (!d) return;
    const a = angleOf(e);
    let delta = a - d.lastAngle;
    // Unwrap across the ±180° seam so a continuous twist stays continuous.
    if (delta > 180) delta -= 360;
    if (delta < -180) delta += 360;
    d.lastAngle = a;
    const next = clamp01(d.value + delta / SWEEP);
    if (next !== d.value) {
      d.value = next;
      onChange(next);
    }
  }

  function onPointerUp() {
    drag.current = null;
  }

  function onKeyDown(e: React.KeyboardEvent) {
    let next: number | null = null;
    if (e.key === 'ArrowUp' || e.key === 'ArrowRight') next = value + STEP;
    else if (e.key === 'ArrowDown' || e.key === 'ArrowLeft') next = value - STEP;
    else if (e.key === 'PageUp') next = value + STEP * 4;
    else if (e.key === 'PageDown') next = value - STEP * 4;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = 1;
    if (next != null) {
      e.preventDefault();
      onChange(clamp01(next));
    }
  }

  const rotation = START + value * SWEEP;

  return (
    <div className="relative aspect-square w-[104px] sm:w-[116px]">
      {/* Level ring */}
      {Array.from({ length: LEDS }, (_, i) => {
        const t = i / (LEDS - 1);
        const on = value > 0 && t <= value + 0.001;
        return (
          <span
            key={i}
            className={`knob-led absolute left-1/2 top-1/2 h-[5px] w-[5px] rounded-full ${on ? 'on' : ''}`}
            style={{
              transform: `translate(-50%, -50%) rotate(${START + t * SWEEP}deg) translateY(-50px)`,
            }}
            aria-hidden
          />
        );
      })}

      <div
        ref={ref}
        role="slider"
        tabIndex={0}
        aria-label="Volume"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(value * 100)}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onKeyDown={onKeyDown}
        className="knob absolute inset-[14%] outline-none focus-visible:ring-2 focus-visible:ring-[var(--lcd-fg)]"
      >
        <div
          className="absolute inset-0"
          style={{ transform: `rotate(${rotation}deg)`, transition: 'transform 0.08s' }}
        >
          <div className="knob-cap absolute inset-[16%]" />
          <span className="knob-indicator absolute left-1/2 top-[8%] h-[22%] w-[3px] -translate-x-1/2 rounded-full" />
        </div>
      </div>
    </div>
  );
}
