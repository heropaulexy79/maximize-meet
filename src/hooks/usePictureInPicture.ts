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

  /**
   * enterPip
   * Triggers Picture-in-Picture mode.
   * If documentPictureInPicture is supported, it opens a custom UI window.
   * Fallback: Standard video Picture-in-Picture.
   */
  const enterPip = useCallback(async (videoElement?: HTMLVideoElement) => {
    try {
      // 1. Try Document Picture-in-Picture (Full UI support)
      if ("documentPictureInPicture" in window) {
        // If already active, don't re-open
        if (pipWindowRef.current) return pipWindowRef.current;

        const pipWindow = await (window as any).documentPictureInPicture.requestWindow({
          width: 420,
          height: 320,
        });

        pipWindowRef.current = pipWindow;
        setIsPipActive(true);

        // Copy styles to the new window
        const allStyleSheets = Array.from(document.styleSheets);
        allStyleSheets.forEach((styleSheet) => {
          try {
            if (styleSheet.href) {
              const link = document.createElement("link");
              link.rel = "stylesheet";
              link.href = styleSheet.href;
              pipWindow.document.head.appendChild(link);
            } else {
              const cssRules = Array.from(styleSheet.cssRules)
                .map((rule) => rule.cssText)
                .join("");
              const style = document.createElement("style");
              style.textContent = cssRules;
              pipWindow.document.head.appendChild(style);
            }
          } catch (e) {
            // Fallback for cross-origin or failed rules
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
      const video = videoElement || document.querySelector("video");
      if (video && video.requestPictureInPicture) {
        await video.requestPictureInPicture();
        setIsPipActive(true);
        video.addEventListener("leavepictureinpicture", () => {
          setIsPipActive(false);
        }, { once: true });
        return true;
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

  // Handle automatic PiP on visibility change (minimize)
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === "hidden" && !isPipActive) {
        // Try to find a video element and enable autoPiP if supported
        const video = document.querySelector("video");
        if (video) {
          (video as any).autoPictureInPicture = true;
          // We can't always call enterPip() here due to gesture requirement,
          // but some browsers allow it if autoPictureInPicture is true.
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [isPipActive]);

  return { isPipActive, enterPip, exitPip, togglePip, pipWindow: pipWindowRef.current };
}
