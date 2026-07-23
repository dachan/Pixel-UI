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
      // Callers make their label/description a hit target by toggling from a
      // wrapper click; stop here so a tap on the switch itself doesn't also
      // fire that handler and toggle twice.
      onClick={(event) => {
        event.stopPropagation();
        onChange(!checked);
      }}
      className={`relative h-6 w-11 shrink-0 rounded-md border border-stone-300 transition ${
        checked ? "bg-orange-500" : "bg-stone-200"
      }`}
    >
      <span
        className={`absolute top-1 h-3.5 w-3.5 rounded-full bg-white transition-all ${
          checked ? "left-6" : "left-1"
        }`}
      />
    </button>
  );
}
