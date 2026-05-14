"use client";

import { useState, useCallback, useEffect, useRef } from "react";

/**
 * usePictureInPicture
 * Manages Picture-in-Picture state for the meeting room.
 * Supports Document PiP (Chrome 116+) and standard Video PiP fallback.
 */
export function usePictureInPicture() {
  const [isPipActive, setIsPipActive] = useState(false);
  const pipWindowRef = useRef<any>(null);

  const enterPip = useCallback(async (videoElement?: HTMLVideoElement) => {
    try {
      // 1. Try Document Picture-in-Picture (Full UI support)
      if ("documentPictureInPicture" in window) {
        const pipWindow = await (window as any).documentPictureInPicture.requestWindow({
          width: 400,
          height: 300,
        });

        pipWindowRef.current = pipWindow;
        setIsPipActive(true);

        // Copy styles to the new window
        const allStyleSheets = Array.from(document.styleSheets);
        allStyleSheets.forEach((styleSheet) => {
          try {
            const cssRules = Array.from(styleSheet.cssRules)
              .map((rule) => rule.cssText)
              .join("");
            const style = document.createElement("style");
            style.textContent = cssRules;
            pipWindow.document.head.appendChild(style);
          } catch (e) {
            // Fallback for cross-origin stylesheets
            if (styleSheet.href) {
              const link = document.createElement("link");
              link.rel = "stylesheet";
              link.href = styleSheet.href;
              pipWindow.document.head.appendChild(link);
            }
          }
        });

        pipWindow.addEventListener("pagehide", () => {
          setIsPipActive(false);
          pipWindowRef.current = null;
        });

        return pipWindow;
      }

      // 2. Fallback: Standard Video PiP
      if (videoElement && videoElement.requestPictureInPicture) {
        await videoElement.requestPictureInPicture();
        setIsPipActive(true);
        videoElement.addEventListener("leavepictureinpicture", () => {
          setIsPipActive(false);
        }, { once: true });
      }
    } catch (err) {
      console.error("[PiP] Failed to enter Picture-in-Picture:", err);
    }
    return null;
  }, []);

  const exitPip = useCallback(async () => {
    if (pipWindowRef.current) {
      pipWindowRef.current.close();
      pipWindowRef.current = null;
    } else if (document.pictureInPictureElement) {
      await document.exitPictureInPicture();
    }
    setIsPipActive(false);
  }, []);

  const togglePip = useCallback(async (videoElement?: HTMLVideoElement) => {
    if (isPipActive) {
      await exitPip();
    } else {
      await enterPip(videoElement);
    }
  }, [isPipActive, enterPip, exitPip]);

  // Automatic PiP on visibility change
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden" && !isPipActive) {
        // We can't automatically trigger Document PiP without user gesture
        // But we can try Video PiP if a video element is provided or tracked
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [isPipActive]);

  return { isPipActive, enterPip, exitPip, togglePip, pipWindow: pipWindowRef.current };
}
