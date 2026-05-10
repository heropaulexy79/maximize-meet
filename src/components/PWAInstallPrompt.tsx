"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, X, Smartphone, Wifi, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check if already installed (running as standalone PWA)
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true;

    if (isStandalone) {
      setIsInstalled(true);
      return;
    }

    // Check if user previously permanently dismissed
    const permanentlyDismissed = localStorage.getItem("pwa-prompt-dismissed");
    if (permanentlyDismissed === "true") {
      setDismissed(true);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Show prompt after a short delay for better UX
      setTimeout(() => setShowPrompt(true), 2000);
    };

    window.addEventListener("beforeinstallprompt", handler);

    // Also show on iOS where beforeinstallprompt doesn't fire
    const isIOS =
      /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    if (isIOS && isSafari) {
      setTimeout(() => setShowPrompt(true), 2000);
    }

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setShowPrompt(false);
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
  };

  const handlePermanentDismiss = () => {
    localStorage.setItem("pwa-prompt-dismissed", "true");
    setDismissed(true);
    setShowPrompt(false);
  };

  if (isInstalled || dismissed || !showPrompt) return null;

  return (
    <AnimatePresence>
      {showPrompt && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[200]"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 40 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed inset-0 z-[201] flex items-end sm:items-center justify-center p-4"
          >
            <div className="w-full max-w-sm bg-[#050a1a] border border-[#00e5ff]/20 rounded-3xl shadow-2xl overflow-hidden"
              style={{ boxShadow: "0 0 60px rgba(0,229,255,0.15), 0 25px 50px rgba(0,0,0,0.5)" }}
            >
              {/* Top gradient bar */}
              <div className="h-1 w-full bg-gradient-to-r from-[#1a2080] via-[#00e5ff] to-[#1a2080]" />

              <div className="p-6">
                {/* Header */}
                <div className="flex items-start justify-between mb-5">
                  <div className="flex items-center gap-4">
                    {/* Icon */}
                    <div className="w-16 h-16 rounded-2xl overflow-hidden border border-[#00e5ff]/20 shadow-lg shadow-cyan-500/20 shrink-0">
                      <img src="/icons/icon-512x512.png" alt="Maximize Meet" className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <h2 className="text-white font-bold text-lg leading-tight">Maximize Meet</h2>
                      <p className="text-[#00e5ff] text-xs font-medium tracking-widest uppercase mt-0.5">by Maximize Nation</p>
                    </div>
                  </div>
                  <button
                    onClick={handleDismiss}
                    className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-white/40 hover:text-white flex items-center justify-center transition-colors shrink-0"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Message */}
                <p className="text-white/70 text-sm leading-relaxed mb-5">
                  Install the app for the best experience — instant access, offline support, and full-screen sessions without browser distractions.
                </p>

                {/* Feature pills */}
                <div className="flex flex-wrap gap-2 mb-6">
                  {[
                    { icon: Smartphone, text: "Works like a native app" },
                    { icon: Wifi, text: "Offline ready" },
                    { icon: Bell, text: "Push notifications" },
                  ].map(({ icon: Icon, text }) => (
                    <div key={text} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#00e5ff]/5 border border-[#00e5ff]/15 text-[#00e5ff] text-xs">
                      <Icon className="w-3 h-3" />
                      <span>{text}</span>
                    </div>
                  ))}
                </div>

                {/* CTA Buttons */}
                <div className="space-y-3">
                  <Button
                    onClick={handleInstall}
                    className="w-full h-12 rounded-2xl font-bold text-sm"
                    style={{
                      background: "linear-gradient(135deg, #1a2080 0%, #00e5ff 100%)",
                      color: "#050a1a",
                      boxShadow: "0 4px 20px rgba(0,229,255,0.3)"
                    }}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Install Maximize Meet
                  </Button>
                  <button
                    onClick={handlePermanentDismiss}
                    className="w-full text-center text-xs text-white/30 hover:text-white/50 transition-colors py-1"
                  >
                    No thanks, continue in browser
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
