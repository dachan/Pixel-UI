"use client";

import {
  createContext,
  type InputHTMLAttributes,
  type ReactNode,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

type Orientation = "vertical" | "horizontal";

type SliderLockContextValue = {
  locked: boolean;
  setLocked: (locked: boolean) => void;
};

const SliderLockContext = createContext<SliderLockContextValue | null>(null);

function LockIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden
      className="relative -top-0.5 block size-3 shrink-0 fill-none stroke-current stroke-2"
    >
      <rect x="5" y="10" width="14" height="10" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </svg>
  );
}

export function SliderInput({
  orientation = "vertical",
  className,
  disabled,
  onChange,
  onPointerCancel,
  onPointerDown,
  onPointerLeave,
  onPointerMove,
  onPointerUp,
  onClick,
  onTap,
  thumbContent,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & {
  orientation?: Orientation;
  /** Runs for a press without movement or a completed hold. */
  onTap?: () => void;
  /** Visual content shown inside the slider thumb while it is unlocked. */
  thumbContent?: ReactNode;
}) {
  const vertical = orientation === "vertical";
  const lockContext = useContext(SliderLockContext);
  const [standaloneLocked, setStandaloneLocked] = useState(false);
  const locked = lockContext?.locked ?? standaloneLocked;
  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const movedDuringPress = useRef(false);
  const completedHold = useRef(false);
  const min = Number(props.min ?? 0);
  const max = Number(props.max ?? 100);
  const value = Number(props.value ?? min);
  const fraction =
    Number.isFinite(value) && max > min
      ? Math.min(1, Math.max(0, (value - min) / (max - min)))
      : 0;
  // White-balance sliders use an intentionally smaller 32px thumb.
  const thumbSize = className?.includes("thumb]:!size-8") ? 32 : 48;
  const thumbOffset = thumbSize / 2;
  const thumbPosition = vertical
    ? {
        top: `calc(${(1 - fraction) * 100}% + ${
          fraction * thumbSize - thumbOffset
        }px)`,
      }
    : {
        left: `calc(${fraction * 100}% + ${
          thumbOffset - fraction * thumbSize
        }px)`,
      };

  function cancelHold() {
    if (holdTimer.current !== null) {
      clearTimeout(holdTimer.current);
      holdTimer.current = null;
    }
  }

  function startHold() {
    if (disabled) return;
    cancelHold();
    movedDuringPress.current = false;
    completedHold.current = false;
    holdTimer.current = setTimeout(() => {
      completedHold.current = true;
      if (lockContext) {
        lockContext.setLocked(!lockContext.locked);
      } else {
        setStandaloneLocked((current) => !current);
      }
      holdTimer.current = null;
    }, 2000);
  }

  useEffect(() => cancelHold, []);

  return (
    <span
      className={[
        "relative",
        vertical
          ? "flex min-h-0 w-12 flex-1 self-stretch"
          : "block h-12 min-w-0 flex-1",
      ].join(" ")}
    >
      <input
        {...props}
        type="range"
        disabled={disabled}
        onChange={(event) => {
          if (!locked) onChange?.(event);
        }}
        onPointerDown={(event) => {
          startHold();
          onPointerDown?.(event);
        }}
        onPointerMove={(event) => {
          movedDuringPress.current = true;
          cancelHold();
          onPointerMove?.(event);
        }}
        onPointerUp={(event) => {
          cancelHold();
          onPointerUp?.(event);
        }}
        onPointerCancel={(event) => {
          cancelHold();
          onPointerCancel?.(event);
        }}
        onPointerLeave={(event) => {
          cancelHold();
          onPointerLeave?.(event);
        }}
        onClick={(event) => {
          if (!locked && !movedDuringPress.current && !completedHold.current) {
            onTap?.();
          }
          onClick?.(event);
        }}
        className={[
          "cursor-pointer appearance-none bg-transparent",
          vertical
            ? [
                "block min-h-0 w-12 flex-1 self-stretch",
                "[direction:rtl] [writing-mode:vertical-lr]",
                "[&::-moz-range-track]:h-full [&::-moz-range-track]:w-1.5 [&::-moz-range-track]:rounded-full [&::-moz-range-track]:border-0 [&::-moz-range-track]:bg-stone-300",
                "[&::-webkit-slider-runnable-track]:h-full [&::-webkit-slider-runnable-track]:w-1.5 [&::-webkit-slider-runnable-track]:rounded-full [&::-webkit-slider-runnable-track]:border-0 [&::-webkit-slider-runnable-track]:bg-stone-300",
                "[&::-moz-range-thumb]:size-12 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-stone-100",
                "[&::-webkit-slider-thumb]:-ml-5.25 [&::-webkit-slider-thumb]:size-12 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-0 [&::-webkit-slider-thumb]:bg-stone-100",
              ]
            : [
                "block h-12 w-full min-w-0 flex-1",
                "[&::-moz-range-track]:h-1.5 [&::-moz-range-track]:w-full [&::-moz-range-track]:rounded-full [&::-moz-range-track]:border-0 [&::-moz-range-track]:bg-stone-300",
                "[&::-webkit-slider-runnable-track]:h-1.5 [&::-webkit-slider-runnable-track]:w-full [&::-webkit-slider-runnable-track]:rounded-full [&::-webkit-slider-runnable-track]:border-0 [&::-webkit-slider-runnable-track]:bg-stone-300",
                "[&::-moz-range-thumb]:size-12 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-stone-100",
                "[&::-webkit-slider-thumb]:-mt-5.25 [&::-webkit-slider-thumb]:size-12 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-0 [&::-webkit-slider-thumb]:bg-stone-100",
              ],
          locked && "pointer-events-none opacity-60",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "disabled:[&::-moz-range-thumb]:bg-stone-100",
          "disabled:[&::-webkit-slider-thumb]:bg-stone-100",
          className,
        ]
          .flat()
          .filter(Boolean)
          .join(" ")}
        {...(vertical
          ? ({ orient: "vertical" } as InputHTMLAttributes<HTMLInputElement>)
          : {})}
      />
      {!locked && thumbContent != null && (
        <span
          aria-hidden
          style={thumbPosition}
          className={[
            "pointer-events-none absolute z-10 flex items-center justify-center rounded-full font-mono text-xs font-semibold text-stone-700",
            vertical
              ? "left-1/2 -translate-x-1/2 -translate-y-1/2"
              : "top-1/2 -translate-x-1/2 -translate-y-1/2",
            thumbSize === 32 ? "size-8" : "size-12",
          ].join(" ")}
        >
          {thumbContent}
        </span>
      )}
      {locked && (
        <button
          type="button"
          aria-label="Slider locked. Press and hold for two seconds to unlock."
          style={thumbPosition}
          className={[
            "absolute z-20 flex items-center justify-center rounded-full bg-stone-100 text-stone-800",
            vertical
              ? "left-1/2 -translate-x-1/2 -translate-y-1/2"
              : "top-1/2 -translate-x-1/2 -translate-y-1/2",
            thumbSize === 32 ? "size-8" : "size-12",
          ].join(" ")}
          onPointerDown={startHold}
          onPointerUp={cancelHold}
          onPointerCancel={cancelHold}
          onPointerLeave={cancelHold}
          onClick={(event) => event.preventDefault()}
        >
          <svg
            viewBox="0 0 24 24"
            aria-hidden
            className="size-5 fill-none stroke-current stroke-2"
          >
            <rect x="5" y="10" width="14" height="10" rx="2" />
            <path d="M8 10V7a4 4 0 0 1 8 0v3" />
          </svg>
        </button>
      )}
    </span>
  );
}

type SliderProps = {
  orientation?: Orientation;
  label?: string;
  value?: ReactNode;
  children: ReactNode;
  onLockedChange?: (locked: boolean) => void;
};

export default function Slider({
  orientation = "vertical",
  label,
  value,
  children,
  onLockedChange,
}: SliderProps) {
  const [locked, setLocked] = useState(false);
  function updateLocked(next: boolean) {
    setLocked(next);
    onLockedChange?.(next);
  }
  const lockContext = { locked, setLocked: updateLocked };

  if (orientation === "horizontal") {
    return (
      <SliderLockContext value={lockContext}>
        <label className="flex w-full min-w-0 items-center gap-3">
          {label != null && (
            <span className="inline-flex w-10 shrink-0 items-center gap-1 font-mono text-xs leading-none font-semibold text-stone-500">
              <span className="truncate">{label}</span>
              {locked && <LockIcon />}
            </span>
          )}
          <div className="flex min-h-0 min-w-0 flex-1 items-center">
            {children}
          </div>
          {value != null && (
            <span className="w-10 shrink-0 text-right font-mono text-xs text-stone-700">
              {value}
            </span>
          )}
        </label>
      </SliderLockContext>
    );
  }

  return (
    <SliderLockContext value={lockContext}>
      <label className="flex h-full w-full min-w-0 flex-col items-center gap-4">
        <div className="flex w-full min-w-0 flex-col items-center">
          {label != null && (
            <span className="inline-flex max-w-full items-center gap-1 text-center font-mono text-xs leading-none font-semibold text-stone-500">
              <span className="truncate">{label}</span>
              {locked && <LockIcon />}
            </span>
          )}
          {value != null && (
            <span className="font-mono text-xs text-stone-700">{value}</span>
          )}
        </div>
        <div className="flex h-full min-h-0 w-full justify-center">
          {children}
        </div>
      </label>
    </SliderLockContext>
  );
}
