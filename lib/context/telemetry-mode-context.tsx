"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export type TelemetryMode = "production" | "simulation";

interface TelemetryModeContextType {
  mode: TelemetryMode;
  setMode: (mode: TelemetryMode) => void;
  toggleMode: () => void;
  isSimulation: boolean;
}

const TelemetryModeContext = createContext<TelemetryModeContextType>({
  mode: "simulation",
  setMode: () => {},
  toggleMode: () => {},
  isSimulation: true,
});

export function TelemetryModeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<TelemetryMode>("simulation");

  useEffect(() => {
    try {
      const stored = localStorage.getItem("tokenguard_telemetry_mode");
      if (stored === "production" || stored === "simulation") {
        setModeState(stored);
      }
    } catch {}
  }, []);

  const setMode = (newMode: TelemetryMode) => {
    setModeState(newMode);
    try {
      localStorage.setItem("tokenguard_telemetry_mode", newMode);
    } catch {}
  };

  const toggleMode = () => {
    const next = mode === "production" ? "simulation" : "production";
    setMode(next);
  };

  return (
    <TelemetryModeContext.Provider
      value={{
        mode,
        setMode,
        toggleMode,
        isSimulation: mode === "simulation",
      }}
    >
      {children}
    </TelemetryModeContext.Provider>
  );
}

export function useTelemetryMode() {
  return useContext(TelemetryModeContext);
}
