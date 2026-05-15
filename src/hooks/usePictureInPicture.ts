"use client";

import { useState, useCallback, useEffect, useRef } from "react";

/**
 * usePictureInPicture
 * Manages Picture-in-Picture state for the meeting room.
 * Supports Document PiP (Chrome 116+) and standard Video PiP fallback.
 */
export function usePictureInPicture() {
  const [isPipActive, setIsPipActive] = useState(false);
  const [pipWindow, setPipWindow] = useState<any>(null);
  const isEnteringRef = useRef(false);

  /**
   * enterPip
   * Triggers Picture-in-Picture mode.
   */
  const enterPip = useCallback(async (videoElement?: HTMLVideoElement) => {
    if (isEnteringRef.current) return;
    isEnteringRef.current = true;
    console.log("[PiP] Attempting to enter PiP...");

    try {
      // 1. Try Document Picture-in-Picture (Full UI support)
      if ("documentPictureInPicture" in window) {
        console.log("[PiP] Using Document Picture-in-Picture API");
        
        if (pipWindow) {
          console.log("[PiP] PiP window already exists, focusing...");
          pipWindow.focus();
          isEnteringRef.current = false;
          return pipWindow;
        }

        const newPipWindow = await (window as any).documentPictureInPicture.requestWindow({
          width: 420,
          height: 340,
        });

        console.log("[PiP] Document PiP window opened");
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
                const cssRules = Array.from(styleSheet.cssRules)
                  .map((rule) => rule.cssText)
                  .join("");
                const style = document.createElement("style");
                style.textContent = cssRules;
                newPipWindow.document.head.appendChild(style);
              }
            } catch (e) {
              console.warn("[PiP] Failed to copy a stylesheet:", e);
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
          console.log("[PiP] Document PiP window closed");
          setIsPipActive(false);
          setPipWindow(null);
        });

        isEnteringRef.current = false;
        return newPipWindow;
      }

      // 2. Fallback: Standard Video PiP
      console.log("[PiP] Falling back to standard Video PiP");
      
      // Find the best video element: 
      // 1. Provided element
      // 2. Largest visible video (likely the main speaker)
      // 3. Any video
      let video = videoElement;
      if (!video) {
        const videos = Array.from(document.querySelectorAll("video"));
        video = videos.find(v => v.readyState >= 2 && v.videoWidth > 0) || videos[0];
      }

      if (video && video.requestPictureInPicture) {
        console.log("[PiP] Requesting Video PiP for:", video);
        await video.requestPictureInPicture();
        setIsPipActive(true);
        video.addEventListener("leavepictureinpicture", () => {
          setIsPipActive(false);
        }, { once: true });
        isEnteringRef.current = false;
        return true;
      } else {
        console.warn("[PiP] No compatible video element found or requestPictureInPicture not supported");
        // Final attempt for mobile Safari - some older versions use webkitRequestFullscreen or similar for PiP
        if (video && (video as any).webkitSetPresentationMode) {
          (video as any).webkitSetPresentationMode("picture-in-picture");
          setIsPipActive(true);
          isEnteringRef.current = false;
          return true;
        }
      }
    } catch (err) {
      console.error("[PiP] Failed to enter Picture-in-Picture:", err);
    }
    isEnteringRef.current = false;
    return null;
  }, [pipWindow]);

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
        const video = document.querySelector("video");
        if (video) {
          (video as any).autoPictureInPicture = true;
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [isPipActive]);

  return { isPipActive, enterPip, exitPip, togglePip, pipWindow };
}
