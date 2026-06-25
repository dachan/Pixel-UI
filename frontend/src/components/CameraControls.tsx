"use client";

import { useEffect, useState, type InputHTMLAttributes } from "react";
import {
  capture,
  getControls,
  setControls,
  type CameraControlsState,
} from "@/lib/camera-api";
import Tabs from "@/components/Tabs";

const EXPOSURE_TABS = [
  { id: "auto", label: "Auto" },
  { id: "manual", label: "Manual" },
] as const;

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

const VERTICAL_SLIDER_CLASS = [
  "h-full w-12 min-h-0 cursor-pointer appearance-none bg-transparent",
  "[writing-mode:vertical-lr] [direction:rtl]",
  "disabled:cursor-not-allowed disabled:opacity-40",
  "[&::-webkit-slider-runnable-track]:h-full [&::-webkit-slider-runnable-track]:w-1.5 [&::-webkit-slider-runnable-track]:rounded-full [&::-webkit-slider-runnable-track]:bg-zinc-700",
  "[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:size-12 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-0 [&::-webkit-slider-thumb]:bg-blue-500 [&::-webkit-slider-thumb]:-ml-[21px]",
  "disabled:[&::-webkit-slider-thumb]:bg-zinc-500",
  "[&::-moz-range-track]:h-full [&::-moz-range-track]:w-1.5 [&::-moz-range-track]:rounded-full [&::-moz-range-track]:border-0 [&::-moz-range-track]:bg-zinc-700",
  "[&::-moz-range-thumb]:size-12 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-blue-500",
  "disabled:[&::-moz-range-thumb]:bg-zinc-500",
].join(" ");

function VerticalSlider(props: InputHTMLAttributes<HTMLInputElement>) {
  const { className, ...rest } = props;
  return (
    <input
      {...rest}
      type="range"
      className={[VERTICAL_SLIDER_CLASS, className].filter(Boolean).join(" ")}
      {...({ orient: "vertical" } as InputHTMLAttributes<HTMLInputElement>)}
    />
  );
}

export default function CameraControls() {
  const [state, setState] = useState<CameraControlsState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [captureBusy, setCaptureBusy] = useState(false);
  const [lastFile, setLastFile] = useState<string | null>(null);
  const [captureError, setCaptureError] = useState<string | null>(null);

  useEffect(() => {
    getControls()
      .then((s) =>
        s.auto_exposure
          ? setControls({
              auto_exposure: false,
              iso: s.iso,
              shutter_us: s.shutter_us,
            })
          : Promise.resolve(s)
      )
      .then(setState)
      .catch((e) => setError(e instanceof Error ? e.message : String(e)));
  }, []);

  // In auto mode, poll so sliders reflect live AE values.
  useEffect(() => {
    if (!state?.auto_exposure) return;
    const tick = () =>
      getControls()
        .then(setState)
        .catch(() => {});
    tick();
    const id = setInterval(tick, 500);
    return () => clearInterval(id);
  }, [state?.auto_exposure]);

  // Push a change to the backend and adopt the returned (authoritative) state.
  function apply(patch: Partial<CameraControlsState>) {
    setState((prev) => (prev ? { ...prev, ...patch } : prev)); // optimistic
    setControls(patch)
      .then(setState)
      .catch((e) => setError(e instanceof Error ? e.message : String(e)));
  }

  async function onCapture() {
    setCaptureBusy(true);
    setCaptureError(null);
    try {
      const { filename } = await capture();
      setLastFile(filename);
    } catch (e) {
      setCaptureError(e instanceof Error ? e.message : String(e));
    } finally {
      setCaptureBusy(false);
    }
  }

  if (error) {
    return (
      <section className="absolute inset-0 flex items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
        <p className="text-sm text-red-500">Controls unavailable: {error}</p>
      </section>
    );
  }
  if (!state) {
    return (
      <section className="absolute inset-0 flex items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
        <p className="text-sm text-zinc-500">Loading controls…</p>
      </section>
    );
  }

  const manual = !state.auto_exposure;
  const isoSliderValue = Math.min(
    1600,
    Math.max(100, Math.round(state.iso / 100) * 100)
  );
  const shutterIdx = nearestShutterIndex(state.shutter_us);

  return (
    <section className="absolute inset-0 flex select-none flex-col gap-4 rounded-lg">
      <div className="flex shrink-0 items-center justify-center">
        <Tabs
          tabs={EXPOSURE_TABS}
          active={manual ? "manual" : "auto"}
          onChange={(id) => apply({ auto_exposure: id === "auto" })}
        />
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-3 grid-rows-[minmax(0,1fr)] items-stretch">
        {/* ISO */}
        <label className="flex h-full min-h-0 flex-col items-center gap-4 overflow-hidden">
          <div className="flex flex-col items-center gap-0.5">
            <span className="text-zinc-300 font-bold">ISO</span>
            <span className="font-mono text-xs text-zinc-300">{state.iso}</span>
          </div>
          <div className="flex h-full min-h-0 w-full justify-center">
            <VerticalSlider
              min={100}
              max={1600}
              step={100}
              value={isoSliderValue}
              disabled={!manual}
              onChange={(e) => apply({ iso: Number(e.target.value) })}
            />
          </div>
        </label>

        {/* Shutter */}
        <label className="flex h-full min-h-0 flex-col items-center gap-4 overflow-hidden">
          <div className="flex flex-col items-center gap-0.5">
            <span className="text-zinc-300 font-bold">Shutter</span>
            <span className="font-mono text-xs text-zinc-300">
              {shutterLabel(state.shutter_us)}
            </span>
          </div>
          <div className="flex h-full min-h-0 w-full justify-center">
            <VerticalSlider
              min={0}
              max={SHUTTER_STEPS.length - 1}
              step={1}
              value={shutterIdx}
              disabled={!manual}
              onChange={(e) =>
                apply({ shutter_us: SHUTTER_STEPS[Number(e.target.value)] })
              }
            />
          </div>
        </label>

        {/* Aperture — not controllable on Pi cameras */}
        <label className="flex h-full min-h-0 flex-col items-center gap-4 overflow-hidden opacity-60">
          <div className="flex flex-col items-center gap-0.5">
            <span className="text-zinc-300 font-bold">Aperture</span>
            <span className="font-mono text-xs text-zinc-300">fixed</span>
          </div>
          <div className="flex h-full min-h-0 w-full justify-center">
            <VerticalSlider disabled value={0} readOnly />
          </div>
        </label>
      </div>

      <button
        onClick={onCapture}
        disabled={captureBusy}
        className="w-full rounded-full bg-blue-600 p-4 font-bold transition hover:bg-blue-500 disabled:opacity-50"
      >
        {captureBusy ? "Capturing…" : "Capture"}
      </button>
    </section>
  );
}
