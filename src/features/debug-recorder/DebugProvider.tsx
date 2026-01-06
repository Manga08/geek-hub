"use client";

import * as React from "react";
import { DEBUG_STORAGE_KEY } from "./types";
import { initStore } from "./store";
import { installFetchCapture, uninstallFetchCapture } from "./captureFetch";
import { installConsoleCapture, uninstallConsoleCapture } from "./captureConsole";
import { installWebVitalsCapture, uninstallWebVitalsCapture } from "./captureWebVitals";
import { RouteRenderCapture } from "./captureRouteRender";
import { DebugPanel } from "./DebugPanel";

// =========================
// Check if Debug is Enabled
// =========================

function useDebugEnabled(): boolean {
  const [enabled, setEnabled] = React.useState(false);

  React.useEffect(() => {
    // Check query param: ?debug=1
    const params = new URLSearchParams(window.location.search);
    const queryDebug = params.get("debug") === "1";

    // Check localStorage: GH_DEBUG=1
    const storageDebug = localStorage.getItem(DEBUG_STORAGE_KEY) === "1";

    // If query param is present, persist to localStorage
    if (queryDebug && !storageDebug) {
      localStorage.setItem(DEBUG_STORAGE_KEY, "1");
    }

    setEnabled(queryDebug || storageDebug);
  }, []);

  return enabled;
}

// =========================
// Debug Provider Component
// =========================

interface DebugProviderProps {
  children: React.ReactNode;
}

export function DebugProvider({ children }: DebugProviderProps) {
  const enabled = useDebugEnabled();
  const installedRef = React.useRef(false);

  React.useEffect(() => {
    if (!enabled || installedRef.current) return;

    // Initialize store from localStorage
    initStore();

    // Install capture wrappers
    installFetchCapture();
    installConsoleCapture();
    installWebVitalsCapture();
    installedRef.current = true;

    // Cleanup on unmount
    return () => {
      uninstallFetchCapture();
      uninstallConsoleCapture();
      uninstallWebVitalsCapture();
      installedRef.current = false;
    };
  }, [enabled]);

  return (
    <>
      {children}
      {enabled && (
        <>
          <RouteRenderCapture />
          <DebugPanel />
        </>
      )}
    </>
  );
}
