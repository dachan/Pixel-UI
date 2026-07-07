import { useEffect, useRef } from "react";

// Press-and-drag to scroll a container vertically.
//
// On the Pi kiosk, labwc runs with mouseEmulation="yes" (so the touchscreen
// shows a cursor and taps register as clicks), which means a finger swipe
// arrives as a mouse drag — and a mouse drag does NOT scroll an overflow
// container. This hook makes it scroll: it watches pointer events on the
// element and moves scrollTop to follow the drag. Pointer Events cover mouse,
// emulated-mouse, and real touch alike, so it works everywhere.
//
// A short drag threshold distinguishes a tap (let the click through) from a
// scroll (swallow the click so you don't accidentally trigger a button).
// Buttons and links are excluded in onDown so their clicks are never swallowed.
export function useDragScroll<T extends HTMLElement>() {
  const ref = useRef<T>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const THRESHOLD = 8; // px of movement before it counts as a scroll
    let dragging = false;
    let startY = 0;
    let startTop = 0;
    let moved = 0;
    let suppressClick = false;

    const onDown = (e: PointerEvent) => {
      if (e.button !== 0 && e.pointerType === "mouse") return; // left/primary only
      // Don't hijack draggable form controls (sliders move on drag too).
      const target = e.target as HTMLElement;
      if (target.closest("input, textarea, select, [role='slider'], button, a")) {
        return;
      }
      dragging = true;
      startY = e.clientY;
      startTop = el.scrollTop;
      moved = 0;
    };
    const onMove = (e: PointerEvent) => {
      if (!dragging) return;
      const dy = e.clientY - startY;
      moved = Math.max(moved, Math.abs(dy));
      el.scrollTop = startTop - dy;
    };
    const onUp = () => {
      if (dragging && moved > THRESHOLD) suppressClick = true;
      dragging = false;
    };
    // Capture-phase click swallow: if the gesture was a scroll, cancel the
    // click it would otherwise fire on a button/link underneath.
    const onClick = (e: MouseEvent) => {
      if (suppressClick) {
        e.stopPropagation();
        e.preventDefault();
        suppressClick = false;
      }
    };

    // Cancel native drag-and-drop (e.g. image/link dragging) inside the scroll
    // area — it would otherwise hijack the pointer stream and stop scrolling.
    const onDragStart = (e: Event) => e.preventDefault();

    el.addEventListener("pointerdown", onDown);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    el.addEventListener("click", onClick, true);
    el.addEventListener("dragstart", onDragStart);

    return () => {
      el.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      el.removeEventListener("click", onClick, true);
      el.removeEventListener("dragstart", onDragStart);
    };
  }, []);

  return ref;
}
