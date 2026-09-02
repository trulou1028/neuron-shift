import { useEffect, useState } from "react";
import { telemetryBaseline } from "./data/scenario";

// Site load and PUE drift slightly on each simulated refresh so the bar reads as live
// without drawing attention away from the learning flow.
const REFRESH_SECONDS = 6;
const SITE_LOAD_JITTER_MW = 0.3;
const PUE_JITTER = 0.01;

const jitter = (base: number, range: number) => base + (Math.random() * 2 - 1) * range;

export function useMockTelemetry() {
  const [telemetry, setTelemetry] = useState({ ...telemetryBaseline, secondsAgo: 0, elapsedSeconds: 0 });

  useEffect(() => {
    const timer = window.setInterval(() => {
      setTelemetry((current) => {
        const elapsedSeconds = current.elapsedSeconds + 1;
        if (current.secondsAgo + 1 < REFRESH_SECONDS) return { ...current, elapsedSeconds, secondsAgo: current.secondsAgo + 1 };
        return {
          ...current,
          elapsedSeconds,
          secondsAgo: 0,
          siteLoadMw: jitter(telemetryBaseline.siteLoadMw, SITE_LOAD_JITTER_MW),
          pue: jitter(telemetryBaseline.pue, PUE_JITTER),
        };
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, []);

  return telemetry;
}
