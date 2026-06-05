"use client";

import React, { useRef, useState, useCallback, useEffect } from "react";
import { Mic, MicOff, Video, VideoOff, LogOut, Maximize2, GripHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FloatingMiniPlayerProps {
  activeSpeakerName: string;
  isMuted: boolean;
  isCameraOff: boolean;
  onToggleMic: () => void;
  onToggleCamera: () => void;
  onLeave: () => void;
  onExpand: () => void;
}

/**
 * FloatingMiniPlayer
 * A draggable in-app mini player for mobile. Works on all browsers.
 * Used as a fallback when the Document PiP API is not available.
 */
export function FloatingMiniPlayer({
  activeSpeakerName,
  isMuted,
  isCameraOff,
  onToggleMic,
  onToggleCamera,
  onLeave,
  onExpand,
}: FloatingMiniPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef({ startX: 0, startY: 0, startLeft: 0, startTop: 0, dragging: false });
  const [pos, setPos] = useState({ bottom: 100, right: 16 });

  const getElementPos = useCallback(() => {
    const el = containerRef.current;
    if (!el) return null;
    const rect = el.getBoundingClientRect();
    return { left: rect.left, top: rect.top };
  }, []);

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    const elPos = getElementPos();
    if (!elPos) return;
    const el = containerRef.current!;
    el.setPointerCapture(e.pointerId);
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startLeft: elPos.left,
      startTop: elPos.top,
      dragging: true,
    };
  }, [getElementPos]);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragRef.current.dragging) return;
    e.preventDefault();
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    const el = containerRef.current;
    if (!el) return;

    const newLeft = dragRef.current.startLeft + dx;
    const newTop = dragRef.current.startTop + dy;

    // Convert to bottom/right for positioning
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const rect = el.getBoundingClientRect();

    const newRight = vw - newLeft - rect.width;
    const newBottom = vh - newTop - rect.height;

    setPos({
      right: Math.max(0, Math.min(vw - rect.width, newRight)),
      bottom: Math.max(0, Math.min(vh - rect.height, newBottom)),
    });
  }, []);

  const onPointerUp = useCallback(() => {
    dragRef.current.dragging = false;
  }, []);

  // Elapsed time counter
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setSeconds(s => s + 1), 1000);
    return () => clearInterval(interval);
  }, []);
  const fmt = (n: number) => n.toString().padStart(2, "0");
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;

  return (
    <div
      ref={containerRef}
      className="fixed z-[9999] select-none touch-none"
      style={{ bottom: pos.bottom, right: pos.right }}
    >
      <div className="w-[220px] rounded-3xl bg-zinc-950/95 backdrop-blur-2xl border border-white/10 shadow-2xl overflow-hidden">
        {/* Drag Handle */}
        <div
          className="flex items-center justify-between px-3 pt-2 pb-1 cursor-grab active:cursor-grabbing"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
        >
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            <span className="text-[9px] font-bold text-primary uppercase tracking-widest truncate max-w-[100px]">
              {activeSpeakerName}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-mono text-white/40">
              {fmt(h)}:{fmt(m)}:{fmt(s)}
            </span>
            <GripHorizontal className="w-3 h-3 text-white/20" />
          </div>
        </div>

        {/* Avatar */}
        <div className="flex items-center justify-center py-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary/20 to-white/5 border border-white/10 flex items-center justify-center shadow-inner">
            <span className="text-2xl font-bold text-white/30 select-none">
              {activeSpeakerName?.charAt(0).toUpperCase() || "?"}
            </span>
          </div>
        </div>

        {/* LIVE badge */}
        <div className="flex justify-center -mt-2 mb-2">
          <span className="text-[9px] font-bold uppercase tracking-widest text-white/30 bg-white/5 px-3 py-1 rounded-full border border-white/5">
            Meeting Active
          </span>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-2 p-3 border-t border-white/5">
          <button
            onClick={onToggleMic}
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all active:scale-90 ${
              isMuted ? "bg-red-500/20 text-red-500" : "bg-white/5 text-white hover:bg-white/10"
            }`}
          >
            {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>

          <button
            onClick={onToggleCamera}
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all active:scale-90 ${
              isCameraOff ? "bg-red-500/20 text-red-500" : "bg-white/5 text-white hover:bg-white/10"
            }`}
          >
            {isCameraOff ? <VideoOff className="w-4 h-4" /> : <Video className="w-4 h-4" />}
          </button>

          <button
            onClick={onExpand}
            className="w-10 h-10 rounded-xl flex items-center justify-center bg-primary/10 text-primary hover:bg-primary/20 transition-all active:scale-90"
          >
            <Maximize2 className="w-4 h-4" />
          </button>

          <button
            onClick={onLeave}
            className="w-10 h-10 rounded-xl flex items-center justify-center bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/20 transition-all active:scale-90"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
