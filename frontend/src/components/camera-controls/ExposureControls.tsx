"use client";

import { useEffect, useState } from "react";
import {
  getControls,
  setControls,
  type CameraControlsState,
} from "@/lib/camera-api";
import { usePolling } from "@/lib/use-polling";
import Slider, { SliderInput } from "@/components/_shared/Slider";

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

export default function ExposureControls() {
  const [state, setState] = useState<CameraControlsState>({
    auto_shutter: true,
    auto_iso: true,
    iso: 100,
    shutter_us: 10000,
  });

  useEffect(() => {
    getControls()
      .then(setState)
      .catch(() => {});
  }, []);

  // Was 500ms — journal showed this as the single largest source of
  // continuous backend traffic (~1.2 req/s while auto+visible, every one
  // doing a full capture_metadata() + JSON serialization). Exposure numbers
  // don't need to feel that instantaneous; 1200ms is still smooth.
  usePolling(
    () => {
      getControls()
        .then(setState)
        .catch(() => {});
    },
    1200,
    state.auto_shutter || state.auto_iso,
  );

  function apply(patch: Partial<CameraControlsState>) {
    setState((prev) => ({ ...prev, ...patch }));
    setControls(patch)
      .then(setState)
      .catch(() => {});
  }

  const shutterManual = !state.auto_shutter;
  const isoManual = !state.auto_iso;
  const isoSliderValue = Math.min(
    1600,
    Math.max(100, Math.round(state.iso / 100) * 100),
  );
  const shutterIdx = nearestShutterIndex(state.shutter_us);

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="flex min-h-0 flex-1 justify-around gap-2">
        <Slider
          label="Shutter"
          value={shutterLabel(state.shutter_us)}
          lockable={shutterManual}
        >
          <SliderInput
            min={0}
            max={SHUTTER_STEPS.length - 1}
            step={1}
            value={shutterIdx}
            thumbContent={shutterManual ? "M" : "A"}
            onTap={() => apply({ auto_shutter: shutterManual })}
            onChange={(e) => {
              if (shutterManual) {
                apply({ shutter_us: SHUTTER_STEPS[Number(e.target.value)] });
              }
            }}
          />
        </Slider>

        <Slider label="ISO" value={state.iso} lockable={isoManual}>
          <SliderInput
            min={100}
            max={1600}
            step={100}
            value={isoSliderValue}
            thumbContent={isoManual ? "M" : "A"}
            onTap={() => apply({ auto_iso: isoManual })}
            onChange={(e) => {
              if (isoManual) apply({ iso: Number(e.target.value) });
            }}
          />
        </Slider>

        <Slider label="Aperture" value="Fixed">
          <SliderInput disabled value={0} readOnly />
        </Slider>
      </div>
    </div>
  );
}
