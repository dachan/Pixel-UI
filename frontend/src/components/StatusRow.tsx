"use client";

import { useEffect, useState } from "react";
import { type SystemThermal } from "@/lib/camera-api";
import { useThermal } from "@/lib/thermal-context";

const MOCK_TIME = process.env.NODE_ENV === "development" ? "14:00:00" : null;

function formatTime(date: Date): string {
  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

function currentTemperature(thermal: SystemThermal | null): string {
  const values = thermal ? Object.values(thermal.temperatures) : [];
  if (values.length === 0) return "—";
  return `${Math.max(...values).toFixed(1)} °C`;
}

function batteryLevel(thermal: SystemThermal | null): string {
  if (thermal?.battery_level === null || thermal?.battery_level === undefined) {
    return "—";
  }
  return `${thermal.battery_level}%`;
}

function BatteryStatus({ thermal }: { thermal: SystemThermal | null }) {
  return (
    <div className="flex items-baseline gap-2 text-xs">
      <span className="font-mono tracking-wide text-stone-500">Battery</span>
      <span className="inline-flex items-center gap-1 font-mono font-semibold text-stone-700">
        {thermal?.charging && (
          <svg
            viewBox="0 0 24 24"
            aria-label="Charging"
            className="size-3.5 fill-current text-emerald-600"
          >
            <path d="M13 2 4 14h6l-1 8 9-12h-6l1-8Z" />
          </svg>
        )}
        {batteryLevel(thermal)}
      </span>
    </div>
  );
}

function StatusItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline gap-2 text-xs">
      <span className="font-mono tracking-wide text-stone-500">{label}</span>
      <span className="font-mono font-semibold text-stone-700">{value}</span>
    </div>
  );
}

export default function StatusRow() {
  const [now, setNow] = useState<Date | null>(null);
  const thermal = useThermal();

  useEffect(() => {
    if (MOCK_TIME) return;
    // Seed the clock post-mount: rendering the time during the static-export
    // prerender would make the HTML disagree with the first client render
    // (hydration mismatch), so it starts as "—" and fills in here.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setNow(new Date());
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div className="flex w-full items-center justify-between bg-cyan-100 px-4 py-2">
      <StatusItem
        label="Time"
        value={MOCK_TIME ?? (now ? formatTime(now) : "—")}
      />
      <BatteryStatus thermal={thermal} />
      <StatusItem label="Temp" value={currentTemperature(thermal)} />
    </div>
  );
}
