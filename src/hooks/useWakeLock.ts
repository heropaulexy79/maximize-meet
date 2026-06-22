"use client";

import { useEffect, useRef, useCallback } from "react";

/**
 * useWakeLock
 * Prevents the screen from sleeping while active.
 * Uses the Screen Wake Lock API with a silent audio fallback for iOS.
 */
export function useWakeLock(enabled: boolean = true) {
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isActiveRef = useRef(false);

  const requestWakeLock = useCallback(async () => {
    if (isActiveRef.current) return;
    isActiveRef.current = true;

    console.log("[WakeLock] Requesting background persistence...");

    // 1. Try the native Screen Wake Lock API
    if ("wakeLock" in navigator) {
      try {
        wakeLockRef.current = await (navigator as any).wakeLock.request("screen");
        console.log("[WakeLock] Screen wake lock acquired.");
      } catch (err) {
        console.warn("[WakeLock] Native wake lock failed, trying audio fallback:", err);
      }
    }

    // 2. Fallback: Ultra-persistent silent audio
    try {
      if (!audioRef.current) {
        // Create a minimal silent audio blob
        const silentBlob = new Blob(
          [new Uint8Array([0x52, 0x49, 0x46, 0x46, 0x24, 0x00, 0x00, 0x00, 0x57, 0x41, 0x56, 0x45, 0x66, 0x6d, 0x74, 0x20, 0x10, 0x00, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x44, 0xac, 0x00, 0x00, 0x88, 0x58, 0x01, 0x00, 0x02, 0x00, 0x10, 0x00, 0x64, 0x61, 0x74, 0x61, 0x00, 0x00, 0x00, 0x00])],
          { type: "audio/wav" }
        );
        const url = URL.createObjectURL(silentBlob);
        const audio = new Audio(url);
        audio.loop = true;
        audio.volume = 0.001; 
        audioRef.current = audio;
      }
      
      // Safari requires a user gesture. If we fail here, it's okay, we'll try again on next visibility change
      // which is often triggered by user interaction.
      await audioRef.current.play().catch(err => {
        console.warn("[WakeLock] Audio play blocked by browser (gesture needed):", err);
        // Don't set isActiveRef.current to false here, so we can try again later
      });
      console.log("[WakeLock] Audio persistence active.");
    } catch (err) {
      console.warn("[WakeLock] Audio persistence failed totally:", err);
      isActiveRef.current = false;
    }

    // 3. Heartbeat to fight throttling
    if (!intervalRef.current) {
      intervalRef.current = setInterval(() => {
        if (typeof requestAnimationFrame !== "undefined") {
          requestAnimationFrame(() => {});
        }
        if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
          navigator.serviceWorker.controller.postMessage({ type: "HEARTBEAT" });
        }
      }, 15_000);
    }
  }, []);

  const releaseWakeLock = useCallback(async () => {
    isActiveRef.current = false;
    if (wakeLockRef.current) {
      try {
        await wakeLockRef.current.release();
        wakeLockRef.current = null;
        console.log("[WakeLock] Screen wake lock released.");
      } catch {}
    }
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;

    // Only auto-request if we are visible, otherwise wait for manual trigger
    if (document.visibilityState === "visible") {
      requestWakeLock();
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        requestWakeLock();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      releaseWakeLock();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [enabled, requestWakeLock, releaseWakeLock]);

  return { requestWakeLock, releaseWakeLock };
}
