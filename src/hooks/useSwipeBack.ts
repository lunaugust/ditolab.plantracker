import { useEffect } from "react";

interface SwipeBackOptions {
  enabled?: boolean;
  edgeStartPx?: number;
  minDistancePx?: number;
  maxOffAxisPx?: number;
  maxDurationMs?: number;
}

/**
 * Lightweight hook to enable swipe-back navigation on touch devices.
 * Triggers `onBack` when a quick rightward swipe starts near the left edge.
 */
export function useSwipeBack(onBack: () => void, options: SwipeBackOptions = {}) {
  const {
    enabled = true,
    edgeStartPx = 60,
    minDistancePx = 60,
    maxOffAxisPx = 40,
    maxDurationMs = 600,
  } = options;

  useEffect(() => {
    if (!enabled || typeof window === "undefined" || typeof TouchEvent === "undefined") return;

    let startX = 0;
    let startY = 0;
    let startTime = 0;

    const onTouchStart = (event: TouchEvent) => {
      const touch = event.touches[0];
      if (!touch) return;
      startX = touch.clientX;
      startY = touch.clientY;
      startTime = performance.now();
    };

    const onTouchEnd = (event: TouchEvent) => {
      if (!startTime) return;
      const touch = event.changedTouches[0];
      if (!touch) {
        startTime = 0;
        return;
      }

      const dx = touch.clientX - startX;
      const dy = Math.abs(touch.clientY - startY);
      const duration = performance.now() - startTime;

      const startedAtEdge = startX <= edgeStartPx;
      const traveledEnough = dx >= minDistancePx;
      const stayedOnAxis = dy <= maxOffAxisPx;
      const quickEnough = duration <= maxDurationMs;

      if (startedAtEdge && traveledEnough && stayedOnAxis && quickEnough) {
        onBack();
      }

      startTime = 0;
    };

    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchend", onTouchEnd);

    return () => {
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchend", onTouchEnd);
    };
  }, [enabled, edgeStartPx, maxDurationMs, maxOffAxisPx, minDistancePx, onBack]);
}
