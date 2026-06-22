"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { toast } from "sonner";

/**
 * usePictureInPicture
 * 
 * Priority order:
 * 1. Document PiP (Desktop Chrome 116+) — full UI in a separate window
 * 2. Video PiP (Android Chrome) — native OS-level floating video widget over other apps
 * 3. In-app FloatingMiniPlayer (iOS/unsupported) — overlay inside the browser tab
 */
export function usePictureInPicture() {
  const [isPipActive, setIsPipActive] = useState(false);
  const [pipMode, setPipMode] = useState<"document" | "video" | "inapp" | null>(null);
  const [pipWindow, setPipWindow] = useState<any>(null);
  const isEnteringRef = useRef(false);

  // Enable autoPictureInPicture on all video elements so home button triggers PiP automatically
  const enableAutoPip = useCallback(() => {
    const videos = Array.from(document.querySelectorAll("video"));
    videos.forEach((v) => {
      (v as any).autoPictureInPicture = true;
      v.disablePictureInPicture = false;
    });
  }, []);

  const disableAutoPip = useCallback(() => {
    const videos = Array.from(document.querySelectorAll("video"));
    videos.forEach((v) => {
      (v as any).autoPictureInPicture = false;
    });
  }, []);

  const enterPip = useCallback(async () => {
    if (isEnteringRef.current) return;
    isEnteringRef.current = true;

    try {
      // ── 1. Document PiP (Desktop Chrome 116+) ────────────────────────────
      if ("documentPictureInPicture" in window) {
        if (pipWindow) { pipWindow.focus(); isEnteringRef.current = false; return pipWindow; }

        const newPipWindow = await (window as any).documentPictureInPicture.requestWindow({
          width: 420, height: 340,
        });

        setPipWindow(newPipWindow);
        setIsPipActive(true);
        setPipMode("document");

        // Copy styles
        setTimeout(() => {
          Array.from(document.styleSheets).forEach((ss) => {
            try {
              if (ss.href) {
                const link = document.createElement("link");
                link.rel = "stylesheet"; link.href = ss.href;
                newPipWindow.document.head.appendChild(link);
              } else {
                const style = document.createElement("style");
                style.textContent = Array.from(ss.cssRules).map((r) => r.cssText).join("");
                newPipWindow.document.head.appendChild(style);
              }
            } catch {
              if (ss.href) {
                const link = document.createElement("link");
                link.rel = "stylesheet"; link.href = ss.href;
                newPipWindow.document.head.appendChild(link);
              }
            }
          });
        }, 0);

        newPipWindow.addEventListener("pagehide", () => {
          setIsPipActive(false); setPipWindow(null); setPipMode(null);
        });

        isEnteringRef.current = false;
        return newPipWindow;
      }

      // ── 2. Native Video PiP (Android Chrome, some desktop browsers) ──────
      const videos = Array.from(document.querySelectorAll("video"));
      const bestVideo = videos.find((v) => v.readyState >= 2 && v.videoWidth > 0 && !v.paused)
        || videos.find((v) => v.readyState >= 2)
        || videos[0];

      if (bestVideo) {
        // Enable autoPip so home button also triggers this
        enableAutoPip();

        if (bestVideo.requestPictureInPicture) {
          try {
            await bestVideo.requestPictureInPicture();
            setIsPipActive(true);
            setPipMode("video");
            // The native PiP UI is managed by the OS — notify user they can now go home
            toast.info("You can now switch to another app. The call will continue.", {
              duration: 5000,
              icon: "📱",
            });
            bestVideo.addEventListener("leavepictureinpicture", () => {
              setIsPipActive(false); setPipMode(null); disableAutoPip();
            }, { once: true });
            isEnteringRef.current = false;
            return true;
          } catch (err) {
            console.warn("[PiP] Video PiP failed:", err);
          }
        }

        // Safari iOS
        if ((bestVideo as any).webkitSetPresentationMode) {
          try {
            (bestVideo as any).webkitSetPresentationMode("picture-in-picture");
            setIsPipActive(true);
            setPipMode("video");
            toast.info("You can now switch to another app.", { duration: 5000, icon: "📱" });
            
            const handleWebKitExit = () => {
              if ((bestVideo as any).webkitPresentationMode === "inline") {
                setIsPipActive(false); 
                setPipMode(null);
                bestVideo.removeEventListener("webkitpresentationmodechanged", handleWebKitExit);
              }
            };
            bestVideo.addEventListener("webkitpresentationmodechanged", handleWebKitExit);
            
            isEnteringRef.current = false;
            return true;
          } catch (err) {
            console.warn("[PiP] WebKit PiP failed:", err);
          }
        }
      }

      // ── 3. In-app FloatingMiniPlayer fallback (iOS / no video PiP) ───────
      console.log("[PiP] Using in-app floating mini-player.");
      setIsPipActive(true);
      setPipMode("inapp");
      // Enable autoPip to at least try for next time
      enableAutoPip();
      toast.info(
        "Mini player active — press your home button to go to another app. Your call stays connected.",
        { duration: 6000, icon: "📱" }
      );

    } catch (err) {
      console.error("[PiP] Unexpected error:", err);
      // still activate in-app fallback
      setIsPipActive(true);
      setPipMode("inapp");
    }

    isEnteringRef.current = false;
  }, [pipWindow, enableAutoPip, disableAutoPip]);

  const exitPip = useCallback(async () => {
    disableAutoPip();
    if (pipWindow) {
      pipWindow.close(); setPipWindow(null);
    } else if (document.pictureInPictureElement) {
      await document.exitPictureInPicture();
    } else if (
      document.querySelector("video") &&
      (document.querySelector("video") as any)?.webkitPresentationMode === "picture-in-picture"
    ) {
      ((document.querySelector("video") as any)).webkitSetPresentationMode("inline");
    }
    setIsPipActive(false);
    setPipMode(null);
  }, [pipWindow, disableAutoPip]);

  const togglePip = useCallback(async () => {
    if (isPipActive) await exitPip();
    else await enterPip();
  }, [isPipActive, enterPip, exitPip]);

  // Auto-enter video PiP when user presses home / switches apps
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === "hidden" && !isPipActive) {
        // Enable autoPictureInPicture so the browser automatically shows video PiP
        enableAutoPip();
        // For browsers that don't support autoPiP attribute, try manually
        const video = document.querySelector("video");
        if (video && video.requestPictureInPicture && !document.pictureInPictureElement) {
          try {
            await video.requestPictureInPicture();
            setIsPipActive(true);
            setPipMode("video");
            video.addEventListener("leavepictureinpicture", () => {
              setIsPipActive(false); setPipMode(null);
            }, { once: true });
          } catch {
            // Silently fail — user just minimized without wanting PiP
          }
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [isPipActive, enableAutoPip]);

  // isMobileMode = true when document PiP is not available (i.e., mobile or old desktop)
  const isMobileMode = typeof window !== "undefined"
    ? !("documentPictureInPicture" in window)
    : true;

  // In-app overlay only when pipMode is "inapp" (native video PiP not supported)
  const showInAppPlayer = isPipActive && pipMode === "inapp";

  return { isPipActive, isMobileMode, showInAppPlayer, pipMode, enterPip, exitPip, togglePip, pipWindow };
}
