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

  const requestWakeLock = useCallback(async () => {
    // 1. Try the native Screen Wake Lock API (Chrome, Edge, Safari 16.4+)
    if ("wakeLock" in navigator) {
      try {
        wakeLockRef.current = await (navigator as any).wakeLock.request("screen");
        console.log("[WakeLock] Screen wake lock acquired.");
        return;
      } catch (err) {
        console.warn("[WakeLock] Native wake lock failed, trying audio fallback:", err);
      }
    }

    // 2. Fallback: Play a tiny looped silent audio track to keep the audio session
    //    alive on iOS — this prevents the browser from fully suspending the tab.
    try {
      if (!audioRef.current) {
        // Create a 1-second silent audio blob
        const ctx = new AudioContext();
        const buffer = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.connect(ctx.destination);

        const dest = ctx.createMediaStreamDestination();
        source.connect(dest);

        const silentBlob = new Blob(
          [new Uint8Array(44).fill(0)],
          { type: "audio/wav" }
        );
        const url = URL.createObjectURL(silentBlob);
        const audio = new Audio(url);
        audio.loop = true;
        audio.volume = 0.001; // nearly silent but enough to keep session alive
        audioRef.current = audio;
      }
      await audioRef.current.play();
      console.log("[WakeLock] Audio fallback started.");
    } catch (err) {
      console.warn("[WakeLock] Audio fallback also failed:", err);
    }

    // 3. Last resort: periodic no-op to fight browser background throttling
    intervalRef.current = setInterval(() => {
      // Requesting animation frame keeps the event loop from being fully suspended
      requestAnimationFrame(() => {});
    }, 10_000);
  }, []);

  const releaseWakeLock = useCallback(async () => {
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

    requestWakeLock();

    // Re-acquire the lock when the page becomes visible again
    // (browsers release it automatically when the page is hidden)
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
}
