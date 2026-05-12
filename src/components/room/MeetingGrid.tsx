"use client";

import { useState, useEffect } from "react";
import { ParticipantTile, useTracks, useRemoteParticipant } from "@livekit/components-react";
import { Track } from "livekit-client";
import { motion, AnimatePresence } from "framer-motion";
import { Hand, ChevronLeft, ChevronRight, User, MicOff, Monitor } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const MAX_PER_PAGE = 8;

// Premium color palette for tile placeholders
const TILE_COLORS = [
  "bg-emerald-500/20 border-emerald-500/50 text-emerald-400",
  "bg-indigo-500/20 border-indigo-500/50 text-indigo-400",
  "bg-rose-500/20 border-rose-500/50 text-rose-400",
  "bg-amber-500/20 border-amber-500/50 text-amber-400",
  "bg-cyan-500/20 border-cyan-500/50 text-cyan-400",
  "bg-fuchsia-500/20 border-fuchsia-500/50 text-fuchsia-400",
  "bg-violet-500/20 border-violet-500/50 text-violet-400",
  "bg-orange-500/20 border-orange-500/50 text-orange-400",
];

function getParticipantColor(identity: string) {
  let hash = 0;
  for (let i = 0; i < identity.length; i++) {
    hash = identity.charCodeAt(i) + ((hash << 5) - hash);
  }
  return TILE_COLORS[Math.abs(hash) % TILE_COLORS.length];
}

function getInitials(name: string) {
  if (!name) return "??";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function getGridCols(count: number) {
  if (count === 1) return "grid-cols-1";
  if (count === 2) return "grid-cols-2";
  if (count <= 4) return "grid-cols-2";
  if (count <= 6) return "grid-cols-2 lg:grid-cols-3";
  return "grid-cols-2 lg:grid-cols-4";
}

export function MeetingGrid({ layout }: { layout: "tiled" | "spotlight" | "sidebar" }) {
  const [page, setPage] = useState(0);

  const tracks = useTracks(
    [
      { source: Track.Source.Camera, withPlaceholder: true },
      { source: Track.Source.ScreenShare, withPlaceholder: false },
    ],
    { onlySubscribed: false }
  );

  const screenShareTrack = tracks.find((t) => t.source === Track.Source.ScreenShare);
  const participantTracks = tracks.filter((t) => t.source === Track.Source.Camera);

  // If someone is sharing screen, force a spotlight-style layout
  if (screenShareTrack) {
    return (
      <div className="w-full h-full flex flex-col lg:flex-row p-2 gap-2 overflow-hidden bg-zinc-950">
        {/* Main Screen Share Area */}
        <div className="flex-1 relative rounded-[2rem] overflow-hidden border border-white/10 shadow-2xl bg-black group/screen">
          <ParticipantTile
            trackRef={screenShareTrack}
            className="w-full h-full [&>video]:object-contain"
          />
          <div className="absolute top-6 left-6 flex items-center gap-3 px-4 py-2 rounded-xl bg-black/60 backdrop-blur-xl border border-white/10 text-white z-10">
            <Monitor className="w-4 h-4 text-primary animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-widest">
              {screenShareTrack.participant.name || screenShareTrack.participant.identity}'s Screen
            </span>
          </div>
        </div>

        {/* Participants Sidebar (Right on Desktop, Bottom on Mobile) */}
        <div className="w-full lg:w-72 flex lg:flex-col gap-2 overflow-x-auto lg:overflow-y-auto lg:overflow-x-hidden p-1 custom-scrollbar shrink-0">
          {participantTracks.map((trackRef) => (
            <div 
              key={trackRef.participant.sid} 
              className="w-48 lg:w-full aspect-video rounded-2xl overflow-hidden border border-white/5 bg-zinc-900 shrink-0 relative"
            >
              <ParticipantTile
                trackRef={trackRef}
                className="w-full h-full [&>video]:object-cover [&_.lk-participant-metadata]:hidden"
              />
              <ParticipantOverlay 
                participant={trackRef.participant} 
                isCameraOn={!!(trackRef.publication && !trackRef.publication.isMuted && trackRef.publication.track)} 
                compact
              />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Spotlight layout (e.g. for speaker)
  if (layout === "spotlight") {
    const spotlightTrack = participantTracks.find((t) => t.participant.isSpeaking) || participantTracks[0];
    if (!spotlightTrack) return null;

    const isCameraOn = !!(spotlightTrack.publication && !spotlightTrack.publication.isMuted && spotlightTrack.publication.track);

    return (
      <div className="w-full h-full flex items-center justify-center p-4">
        <div className="relative w-full max-w-5xl aspect-video rounded-[2rem] overflow-hidden border border-white/10 shadow-2xl bg-zinc-950">
          <ParticipantTile
            trackRef={spotlightTrack}
            className="w-full h-full [&>video]:object-cover [&_.lk-participant-metadata]:hidden"
          />
          <ParticipantOverlay 
            participant={spotlightTrack.participant} 
            isCameraOn={isCameraOn} 
          />
        </div>
      </div>
    );
  }

  // Default Tiled Layout
  const totalPages = Math.ceil(participantTracks.length / MAX_PER_PAGE);
  const currentTracks = participantTracks.slice(page * MAX_PER_PAGE, (page + 1) * MAX_PER_PAGE);

  return (
    <div className="w-full h-full relative flex flex-col overflow-hidden">
      <div
        className={`flex-1 min-h-0 grid auto-rows-fr gap-1.5 md:gap-2 p-1.5 md:p-3 ${getGridCols(currentTracks.length)}`}
      >
        <AnimatePresence mode="popLayout">
          {currentTracks.map((trackRef, idx) => {
            const isCameraOn = !!(trackRef.publication && !trackRef.publication.isMuted && trackRef.publication.track);
            
            return (
              <motion.div
                key={`${trackRef.participant.sid}-${trackRef.source}`}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3, delay: idx * 0.03 }}
                className="relative min-h-0 rounded-xl md:rounded-2xl overflow-hidden border border-white/5 shadow-xl bg-zinc-900 group/tile"
              >
                <ParticipantTile
                  trackRef={trackRef}
                  className="absolute inset-0 w-full h-full [&>video]:object-cover [&_.lk-participant-metadata]:!hidden"
                />
                <ParticipantOverlay 
                  participant={trackRef.participant} 
                  isCameraOn={isCameraOn} 
                />
                {trackRef.participant.isSpeaking && (
                  <div className="absolute inset-0 border-2 border-primary/50 rounded-xl md:rounded-2xl pointer-events-none z-30" />
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {totalPages > 1 && (
        <>
          <Button
            onClick={() => setPage((p) => p - 1)}
            disabled={page === 0}
            variant="ghost"
            size="icon"
            className="absolute left-3 top-1/2 -translate-y-1/2 z-50 w-11 h-11 rounded-full bg-black/50 backdrop-blur border border-white/10 text-white disabled:opacity-0 transition-opacity"
          >
            <ChevronLeft className="w-6 h-6" />
          </Button>
          <Button
            onClick={() => setPage((p) => p + 1)}
            disabled={page === totalPages - 1}
            variant="ghost"
            size="icon"
            className="absolute right-3 top-1/2 -translate-y-1/2 z-50 w-11 h-11 rounded-full bg-black/50 backdrop-blur border border-white/10 text-white disabled:opacity-0 transition-opacity"
          >
            <ChevronRight className="w-6 h-6" />
          </Button>
        </>
      )}
    </div>
  );
}

function ReactionOverlay({ identity }: { identity: string }) {
  const [reactions, setReactions] = useState<{ id: number; emoji: string }[]>([]);

  useEffect(() => {
    const handleReaction = (e: any) => {
      if (e.detail.identity === identity) {
        const id = Date.now();
        setReactions((prev) => [...prev, { id, emoji: e.detail.emoji }]);
        setTimeout(() => {
          setReactions((prev) => prev.filter((r) => r.id !== id));
        }, 3000);
      }
    };

    window.addEventListener("remote-reaction", handleReaction);
    return () => window.removeEventListener("remote-reaction", handleReaction);
  }, [identity]);

  return (
    <div className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden z-40">
      <AnimatePresence>
        {reactions.map((r) => (
          <motion.div
            key={r.id}
            initial={{ y: 20, opacity: 0, scale: 0.5 }}
            animate={{ y: -100, opacity: 1, scale: 1.5 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            className="absolute text-4xl select-none"
          >
            {r.emoji}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

function ParticipantOverlay({ participant, isCameraOn, compact = false }: { participant: any; isCameraOn: boolean; compact?: boolean }) {
  const metadata = (() => {
    try { return participant.metadata ? JSON.parse(participant.metadata) : {}; }
    catch { return {}; }
  })();
  
  const isHandRaised = metadata.handRaised;
  const isMuted = !participant.isMicrophoneEnabled;
  const colorClass = getParticipantColor(participant.identity || participant.sid);
  const initials = getInitials(participant.name || participant.identity || "User");
  
  // Sophisticated check: If it's not a known email/auth, mark as "Cohort Member"
  const isScholar = !participant.identity?.includes("@") && !participant.isLocal;

  return (
    <div className="absolute inset-0 z-20 flex flex-col justify-between p-2 md:p-3 pointer-events-none">
      {/* Background Placeholder when Camera is Off */}
      <AnimatePresence>
        {!isCameraOn && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={cn("absolute inset-0 flex items-center justify-center border transition-all duration-700 bg-zinc-950", colorClass)}
          >
            <div className="relative">
              <div className={cn(
                "rounded-full flex items-center justify-center font-bold tracking-tighter bg-white/5 backdrop-blur-sm border border-white/10 shadow-2xl relative z-10",
                compact ? "w-12 h-12 text-xl" : "w-20 h-20 md:w-24 md:h-24 text-3xl md:text-4xl"
              )}>
                {initials}
              </div>
              <motion.div 
                animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.1, 0.3] }}
                transition={{ duration: 4, repeat: Infinity }}
                className="absolute inset-0 bg-current rounded-full blur-3xl opacity-20" 
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top section: Hand raise & Reactions */}
      <div className="flex justify-between items-start w-full h-full relative">
        <div className="flex flex-col gap-2">
          <AnimatePresence>
            {isHandRaised && (
              <motion.div
                initial={{ scale: 0, rotate: -20 }}
                animate={{ scale: 1, rotate: 0 }}
                exit={{ scale: 0, rotate: 20 }}
                className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-amber-500 flex items-center justify-center shadow-[0_0_15px_rgba(245,158,11,0.4)] border border-amber-400/50"
              >
                <Hand className="w-4 h-4 md:w-5 md:h-5 fill-current text-black" />
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Mute Indicator */}
          {isMuted && (
            <div className="w-7 h-7 md:w-8 md:h-8 rounded-lg bg-red-500/80 backdrop-blur-md flex items-center justify-center border border-red-400/50 shadow-lg">
              <MicOff className="w-3.5 h-3.5 md:w-4 md:h-4 text-white" />
            </div>
          )}
        </div>
        
        <ReactionOverlay identity={participant.identity} />
      </div>

      {/* Bottom section: Name label */}
      <div className="flex items-end">
        <div className="flex flex-col gap-1 items-start max-w-[90%]">
          {isScholar && !compact && (
            <div className="w-6 h-6 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-[10px] font-bold text-primary mb-1">
              G
            </div>
          )}
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-black/60 backdrop-blur-md border border-white/10 w-full overflow-hidden">
            <div
              className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                participant.isSpeaking
                  ? "bg-primary animate-pulse shadow-[0_0_6px_rgba(59,130,246,0.8)]"
                  : participant.isLocal
                  ? "bg-cyan-400"
                  : "bg-white/30"
              }`}
            />
            <span className="text-white text-[10px] md:text-xs font-semibold uppercase tracking-wider truncate">
              {participant.name || participant.identity}
              {participant.isLocal && " (You)"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
