"use client";

export default function Switch({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-11 shrink-0 rounded-md border-2 border-stone-300 transition ${
        checked ? "bg-orange-500" : "bg-stone-200"
      }`}
    >
      <span
        className={`absolute top-0.75 h-3.5 w-3.5 rounded-full bg-white transition-all ${
          checked ? "left-5.5" : "left-0.75"
        }`}
      />
    </button>
  );
}
