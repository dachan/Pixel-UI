"use client";

import Switch from "@/components/_shared/Switch";

// One on/off row in Settings: title + description on the left, a switch on
// the right. Sized for touch (the kiosk runs with mouse emulation).
export default function SettingToggle({
  title,
  description,
  checked,
  onChange,
}: {
  title: string;
  description: string;
  checked: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <section className="flex flex-col gap-3">
      {/* The whole row is a hit target, not just the switch — the title and
          description are the biggest thing to aim at on a touchscreen. The
          switch stays the focusable control and stops its own click from
          bubbling here, so tapping it doesn't toggle twice. */}
      <div
        onClick={() => onChange(!checked)}
        className="flex cursor-pointer items-center justify-between gap-3"
      >
        <div className="flex flex-col gap-1">
          <h2 className="text-sm font-semibold text-stone-700">{title}</h2>
          <p className="text-xs text-stone-500">{description}</p>
        </div>
        <Switch checked={checked} onChange={onChange} />
      </div>
    </section>
  );
}
