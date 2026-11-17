import { useEffect, useState } from "react";
import { continueRender, delayRender } from "remotion";

// Measures label widths once the web fonts are ready, so the morphing pill can
// spring to each label's exact width.
export function useTextWidths(labels: string[], font: string, letterSpacingPx: number) {
  const [widths, setWidths] = useState<Record<string, number> | null>(null);
  const [handle] = useState(() => delayRender("measure pill labels"));
  useEffect(() => {
    let cancelled = false;
    document.fonts.load(font).then(() => document.fonts.ready).then(() => {
      if (cancelled) return;
      const ctx = document.createElement("canvas").getContext("2d")!;
      ctx.font = font;
      const out: Record<string, number> = {};
      for (const l of labels) {
        out[l] = ctx.measureText(l).width + letterSpacingPx * l.length;
      }
      setWidths(out);
      continueRender(handle);
    });
    return () => {
      cancelled = true;
    };
    // labels/font are static for the film
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return widths;
}
