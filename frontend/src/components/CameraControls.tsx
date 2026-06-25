"use client";

import { useEffect, useState } from "react";
import {
  getControls,
  setControls,
  type CameraControlsState,
} from "@/lib/camera-api";

// Standard shutter speeds (microseconds) the slider steps through.
const SHUTTER_STEPS = [
  500, 1000, 2000, 4000, 8000, 10000, 16667, 33333, 66667, 125000, 250000,
  500000, 1000000,
];

function shutterLabel(us: number): string {
  if (us >= 1_000_000) return `${(us / 1_000_000).toFixed(1)}s`;
  return `1/${Math.round(1_000_000 / us)}s`;
}

function nearestShutterIndex(us: number): number {
  let best = 0;
  let bestDiff = Infinity;
  SHUTTER_STEPS.forEach((s, i) => {
    const d = Math.abs(s - us);
    if (d < bestDiff) {
      bestDiff = d;
      best = i;
    }
  });
  return best;
}

export default function CameraControls() {
  const [state, setState] = useState<CameraControlsState | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getControls()
      .then(setState)
      .catch((e) => setError(e instanceof Error ? e.message : String(e)));
  }, []);

  // Push a change to the backend and adopt the returned (authoritative) state.
  function apply(patch: Partial<CameraControlsState>) {
    setState((prev) => (prev ? { ...prev, ...patch } : prev)); // optimistic
    setControls(patch)
      .then(setState)
      .catch((e) => setError(e instanceof Error ? e.message : String(e)));
  }

  if (error) {
    return (
      <p className="text-sm text-red-500">Controls unavailable: {error}</p>
    );
  }
  if (!state) {
    return <p className="text-sm text-zinc-500">Loading controls…</p>;
  }

  const manual = !state.auto_exposure;
  const shutterIdx = nearestShutterIndex(state.shutter_us);

  return (
    <section className="w-full max-w-md rounded-lg border border-zinc-800 bg-zinc-900/50 p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-semibold text-zinc-100">Exposure</h2>
        {/* Auto / Manual toggle */}
        <div className="flex overflow-hidden rounded-full border border-zinc-700 text-xs">
          <button
            onClick={() => apply({ auto_exposure: true })}
            className={`px-3 py-1 ${
              !manual ? "bg-blue-600 text-white" : "text-zinc-400"
            }`}
          >
            Auto
          </button>
          <button
            onClick={() => apply({ auto_exposure: false })}
            className={`px-3 py-1 ${
              manual ? "bg-blue-600 text-white" : "text-zinc-400"
            }`}
          >
            Manual
          </button>
        </div>
      </div>

      {/* ISO */}
      <label className="mb-4 block">
        <div className="mb-1 flex justify-between text-sm">
          <span className="text-zinc-300">ISO</span>
          <span className="font-mono text-zinc-100">{state.iso}</span>
        </div>
        <input
          type="range"
          min={100}
          max={1600}
          step={100}
          value={state.iso}
          disabled={!manual}
          onChange={(e) => apply({ iso: Number(e.target.value) })}
          className="w-full accent-blue-500 disabled:opacity-40"
        />
      </label>

      {/* Shutter */}
      <label className="mb-4 block">
        <div className="mb-1 flex justify-between text-sm">
          <span className="text-zinc-300">Shutter</span>
          <span className="font-mono text-zinc-100">
            {shutterLabel(state.shutter_us)}
          </span>
        </div>
        <input
          type="range"
          min={0}
          max={SHUTTER_STEPS.length - 1}
          step={1}
          value={shutterIdx}
          disabled={!manual}
          onChange={(e) =>
            apply({ shutter_us: SHUTTER_STEPS[Number(e.target.value)] })
          }
          className="w-full accent-blue-500 disabled:opacity-40"
        />
      </label>

      {/* Aperture — not controllable on Pi cameras */}
      <label className="block opacity-60">
        <div className="mb-1 flex justify-between text-sm">
          <span className="text-zinc-300">Aperture</span>
          <span className="font-mono text-zinc-100">fixed</span>
        </div>
        <input
          type="range"
          disabled
          value={0}
          readOnly
          className="w-full accent-zinc-600"
        />
        <p className="mt-1 text-xs text-zinc-500">
          Pi camera modules have a fixed aperture (HQ cam uses a manual lens
          ring) — not software-adjustable.
        </p>
      </label>

      {!manual && (
        <p className="mt-4 text-xs text-zinc-500">
          Auto-exposure is on. Switch to <span className="text-zinc-300">Manual</span>{" "}
          to set ISO and shutter.
        </p>
      )}
    </section>
  );
}
