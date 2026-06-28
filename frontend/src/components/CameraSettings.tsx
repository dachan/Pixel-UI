"use client";

import { useEffect, useState } from "react";
import {
  getOrientation,
  setOrientation,
  systemTemperature,
  type SystemTemperatures,
} from "@/lib/camera-api";

// Capture rotations offered in the UI (degrees clockwise).
const ROTATIONS = [0, 90, 180, 270] as const;

// Friendlier names for known thermal-zone labels.
function tempLabel(raw: string): string {
  if (raw === "cpu-thermal") return "CPU";
  return raw;
}

export default function CameraSettings() {
  const [rotation, setRotation] = useState<number | null>(null);
  const [temps, setTemps] = useState<SystemTemperatures | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getOrientation()
      .then((o) => setRotation(o.rotation))
      .catch((e) => setError(e instanceof Error ? e.message : String(e)));
  }, []);

  useEffect(() => {
    let active = true;
    const tick = () =>
      systemTemperature()
        .then((t) => active && setTemps(t))
        .catch(() => active && setTemps(null));
    tick();
    const id = setInterval(tick, 2000);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, []);

  function apply(rot: number) {
    setRotation(rot); // optimistic
    setError(null);
    setOrientation({ rotation: rot })
      .then((o) => setRotation(o.rotation))
      .catch((e) => setError(e instanceof Error ? e.message : String(e)));
  }

  return (
    <div className="h-full min-h-0 overflow-y-auto">
      <div className="flex flex-col gap-6">
        <section className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <h2 className="text-sm font-bold text-zinc-300">Sensor rotation</h2>
            <p className="text-sm text-zinc-500">
              Rotation applied to the live preview and captured images.
            </p>
          </div>

          {error ? (
            <p className="text-sm text-red-500">
              Orientation unavailable: {error}
            </p>
          ) : (
            <div className="grid grid-cols-4 gap-2">
              {ROTATIONS.map((rot) => {
                const active = rotation === rot;
                return (
                  <button
                    key={rot}
                    type="button"
                    onClick={() => apply(rot)}
                    disabled={rotation === null}
                    className={`rounded-xl border p-4 text-sm font-bold transition disabled:opacity-50 ${
                      active
                        ? "border-blue-500 bg-blue-600 text-white"
                        : "border-zinc-700 text-zinc-300 hover:border-zinc-500 hover:text-white"
                    }`}
                  >
                    {rot}°
                  </button>
                );
              })}
            </div>
          )}
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="text-sm font-bold text-zinc-300">Pi temperature</h2>
          {temps === null ? (
            <p className="text-sm text-zinc-500">loading…</p>
          ) : Object.keys(temps).length === 0 ? (
            <p className="text-sm text-zinc-500">unavailable on this host</p>
          ) : (
            <dl className="flex flex-col gap-1">
              {Object.entries(temps).map(([k, v]) => (
                <div key={k} className="flex justify-between gap-3 text-sm">
                  <dt className="text-zinc-400">{tempLabel(k)}</dt>
                  <dd className="font-mono text-zinc-100">{v.toFixed(1)} °C</dd>
                </div>
              ))}
            </dl>
          )}
        </section>
      </div>
    </div>
  );
}
