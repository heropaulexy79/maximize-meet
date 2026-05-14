"use client";

import React from "react";
import { Mic, MicOff, Video, VideoOff, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PipWindowProps {
  activeSpeakerName: string;
  isMuted: boolean;
  isCameraOff: boolean;
  onToggleMic: () => void;
  onToggleCamera: () => void;
  onLeave: () => void;
}

/**
 * PipWindow
 * A minimal UI designed for the Document Picture-in-Picture window.
 */
export function PipWindow({
  activeSpeakerName,
  isMuted,
  isCameraOff,
  onToggleMic,
  onToggleCamera,
  onLeave,
}: PipWindowProps) {
  return (
    <div className="fixed inset-0 bg-[#050a1a] flex flex-col items-center justify-center p-4 overflow-hidden text-white font-sans antialiased">
      {/* Speaker Info */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-[0_0_8px_rgba(0,229,255,0.5)]" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-primary truncate max-w-[150px]">
            {activeSpeakerName}
          </span>
        </div>
        <div className="text-[10px] font-mono text-white/40 tracking-tighter">
          LIVE SESSION
        </div>
      </div>

      {/* Main Avatar Area */}
      <div className="flex-1 flex items-center justify-center w-full">
        <div className="w-24 h-24 rounded-full bg-white/5 border border-white/10 flex items-center justify-center relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <span className="text-3xl font-bold text-white/20 select-none">
            {activeSpeakerName.charAt(0).toUpperCase()}
          </span>
        </div>
      </div>

      {/* Mini Controls */}
      <div className="mt-4 flex items-center gap-3 bg-white/5 p-2 rounded-2xl border border-white/10">
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleMic}
          className={`w-10 h-10 rounded-xl ${isMuted ? "text-red-500 bg-red-500/10" : "text-white hover:bg-white/10"}`}
        >
          {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
        </Button>
        
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleCamera}
          className={`w-10 h-10 rounded-xl ${isCameraOff ? "text-red-500 bg-red-500/10" : "text-white hover:bg-white/10"}`}
        >
          {isCameraOff ? <VideoOff className="w-4 h-4" /> : <Video className="w-4 h-4" />}
        </Button>

        <div className="w-px h-6 bg-white/10 mx-1" />

        <Button
          variant="destructive"
          size="icon"
          onClick={onLeave}
          className="w-10 h-10 rounded-xl bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/20"
        >
          <LogOut className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
