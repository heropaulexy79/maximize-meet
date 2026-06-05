"use client";

import { useState, useCallback, useEffect, useRef } from "react";

/**
 * usePictureInPicture
 * Manages Picture-in-Picture state for the meeting room.
 * - Desktop (Chrome 116+): Uses Document PiP API (new window)
 * - Fallback (mobile/other): Uses in-app floating mini-player overlay
 */
export function usePictureInPicture() {
  const [isPipActive, setIsPipActive] = useState(false);
  const [pipWindow, setPipWindow] = useState<any>(null);
  const isEnteringRef = useRef(false);

  // Detect if we should use the in-app fallback (no documentPictureInPicture support)
  const isMobileMode = typeof window !== "undefined"
    ? !("documentPictureInPicture" in window)
    : true;

  const enterPip = useCallback(async (videoElement?: HTMLVideoElement) => {
    if (isEnteringRef.current) return;
    isEnteringRef.current = true;
    console.log("[PiP] Attempting to enter PiP... isMobileMode:", isMobileMode);

    try {
      // 1. Try Document Picture-in-Picture (Desktop Chrome 116+)
      if ("documentPictureInPicture" in window) {
        console.log("[PiP] Using Document Picture-in-Picture API");

        if (pipWindow) {
          pipWindow.focus();
          isEnteringRef.current = false;
          return pipWindow;
        }

        const newPipWindow = await (window as any).documentPictureInPicture.requestWindow({
          width: 420,
          height: 340,
        });

        setPipWindow(newPipWindow);
        setIsPipActive(true);

        // Copy styles to the new window
        setTimeout(() => {
          const allStyleSheets = Array.from(document.styleSheets);
          allStyleSheets.forEach((styleSheet) => {
            try {
              if (styleSheet.href) {
                const link = document.createElement("link");
                link.rel = "stylesheet";
                link.href = styleSheet.href;
                newPipWindow.document.head.appendChild(link);
              } else {
                const cssRules = Array.from(styleSheet.cssRules).map((r) => r.cssText).join("");
                const style = document.createElement("style");
                style.textContent = cssRules;
                newPipWindow.document.head.appendChild(style);
              }
            } catch (e) {
              if (styleSheet.href) {
                const link = document.createElement("link");
                link.rel = "stylesheet";
                link.href = styleSheet.href;
                newPipWindow.document.head.appendChild(link);
              }
            }
          });
        }, 0);

        newPipWindow.addEventListener("pagehide", () => {
          setIsPipActive(false);
          setPipWindow(null);
        });

        isEnteringRef.current = false;
        return newPipWindow;
      }

      // 2. Fallback: Standard Video PiP
      let video = videoElement;
      if (!video) {
        const videos = Array.from(document.querySelectorAll("video"));
        video = videos.find((v) => v.readyState >= 2 && v.videoWidth > 0) || videos[0];
      }

      if (video && video.requestPictureInPicture) {
        await video.requestPictureInPicture();
        setIsPipActive(true);
        video.addEventListener("leavepictureinpicture", () => setIsPipActive(false), { once: true });
        isEnteringRef.current = false;
        return true;
      }

      if (video && (video as any).webkitSetPresentationMode) {
        (video as any).webkitSetPresentationMode("picture-in-picture");
        setIsPipActive(true);
        isEnteringRef.current = false;
        return true;
      }

      // 3. Final fallback: In-app floating overlay (works everywhere on mobile)
      console.log("[PiP] Using in-app floating mini-player fallback.");
      setIsPipActive(true);
      isEnteringRef.current = false;
      return true;

    } catch (err) {
      console.error("[PiP] Failed to enter Picture-in-Picture:", err);
      // Even on error, activate the in-app fallback
      console.log("[PiP] Falling back to in-app overlay after error.");
      setIsPipActive(true);
    }

    isEnteringRef.current = false;
    return null;
  }, [pipWindow, isMobileMode]);

  const exitPip = useCallback(async () => {
    console.log("[PiP] Exiting PiP...");
    if (pipWindow) {
      pipWindow.close();
      setPipWindow(null);
    } else if (document.pictureInPictureElement) {
      await document.exitPictureInPicture();
    }
    setIsPipActive(false);
  }, [pipWindow]);

  const togglePip = useCallback(
    async (videoElement?: HTMLVideoElement) => {
      if (isPipActive) {
        await exitPip();
      } else {
        await enterPip(videoElement);
      }
    },
    [isPipActive, enterPip, exitPip]
  );

  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === "hidden" && !isPipActive) {
        const video = document.querySelector("video");
        if (video) {
          (video as any).autoPictureInPicture = true;
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [isPipActive]);

  return { isPipActive, isMobileMode, enterPip, exitPip, togglePip, pipWindow };
}
