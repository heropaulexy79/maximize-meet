"use client";

import { useState } from "react";
import { 
  ParticipantTile, 
  useTracks,
} from "@livekit/components-react";
import { Track } from "livekit-client";
import { motion, AnimatePresence } from "framer-motion";
import { Hand, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const MAX_PER_PAGE = 8;

export function MeetingGrid({
  layout,
}: {
  layout: "tiled" | "spotlight" | "sidebar";
}) {
  const [page, setPage] = useState(0);

  const tracks = useTracks(
    [
      { source: Track.Source.Camera, withPlaceholder: true },
      { source: Track.Source.ScreenShare, withPlaceholder: false },
    ],
    { onlySubscribed: false }
  );

  const totalPages = Math.ceil(tracks.length / MAX_PER_PAGE);
  const currentTracks = tracks.slice(page * MAX_PER_PAGE, (page + 1) * MAX_PER_PAGE);

  // Spotlight Logic
  if (layout === "spotlight") {
    const spotlightTrack = tracks.find(t => t.participant.isSpeaking) || tracks[0];
    return (
      <div className="w-full h-full flex items-center justify-center p-4">
        {spotlightTrack && (
          <div className="relative w-full max-w-5xl aspect-video rounded-[2rem] overflow-hidden border border-white/10 shadow-2xl bg-zinc-950">
            <ParticipantTile trackRef={spotlightTrack} className="w-full h-full [&>video]:object-cover" />
            <ParticipantOverlay participant={spotlightTrack.participant} />
          </div>
        )}
      </div>
    );
  }

  // Define grid layout based on participant count
  const getGridClasses = (count: number) => {
    if (count === 1) return 'grid-cols-1 max-w-4xl';
    if (count === 2) return 'grid-cols-1 md:grid-cols-2 max-w-6xl';
    if (count === 3) return 'grid-cols-1 md:grid-cols-3 max-w-7xl';
    if (count === 4) return 'grid-cols-2 lg:grid-cols-4 max-w-7xl';
    if (count <= 6) return 'grid-cols-2 lg:grid-cols-3 max-w-7xl';
    return 'grid-cols-2 lg:grid-cols-4 max-w-7xl';
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-center relative group/grid min-h-0 overflow-hidden">
      <div className={`w-full mx-auto grid gap-3 md:gap-4 p-4 md:p-8 flex-1 content-center items-center ${getGridClasses(currentTracks.length)}`}>
        <AnimatePresence mode="wait">
          {currentTracks.map((trackRef, idx) => (
            <motion.div 
              key={`${trackRef.participant.sid}-${trackRef.source}`}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.4, ease: "easeOut", delay: idx * 0.05 }}
              className="relative aspect-video rounded-2xl md:rounded-[2.5rem] overflow-hidden border border-white/5 shadow-2xl bg-zinc-950/50 backdrop-blur-md flex items-center justify-center transition-all duration-500 hover:scale-[1.01] hover:z-10 group/tile"
            >
              <ParticipantTile trackRef={trackRef} className="w-full h-full [&>video]:object-cover" />
              <ParticipantOverlay participant={trackRef.participant} />
              
              {/* Speaking indicator border */}
              {trackRef.participant.isSpeaking && (
                <div className="absolute inset-0 border-[3px] border-primary/40 rounded-2xl md:rounded-[2.5rem] pointer-events-none animate-pulse" />
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <>
          <div className="absolute left-6 top-1/2 -translate-y-1/2 z-50">
            <Button
              variant="ghost"
              size="icon"
              disabled={page === 0}
              onClick={() => setPage(p => p - 1)}
              className="w-14 h-14 rounded-full bg-black/50 backdrop-blur-2xl border border-white/10 hover:bg-black/70 text-white disabled:opacity-0 transition-all shadow-2xl"
            >
              <ChevronLeft className="w-8 h-8" />
            </Button>
          </div>
          <div className="absolute right-6 top-1/2 -translate-y-1/2 z-50">
            <Button
              variant="ghost"
              size="icon"
              disabled={page === totalPages - 1}
              onClick={() => setPage(p => p + 1)}
              className="w-14 h-14 rounded-full bg-black/50 backdrop-blur-2xl border border-white/10 hover:bg-black/70 text-white disabled:opacity-0 transition-all shadow-2xl"
            >
              <ChevronRight className="w-8 h-8" />
            </Button>
          </div>

          {/* Page Indicators */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-50">
            {Array.from({ length: totalPages }).map((_, i) => (
              <div 
                key={i} 
                className={`h-2 rounded-full transition-all duration-500 ${i === page ? 'w-8 bg-primary shadow-[0_0_10px_rgba(59,130,246,0.5)]' : 'w-2 bg-white/20'}`} 
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function ParticipantOverlay({ participant }: { participant: any }) {
  const metadata = participant.metadata ? JSON.parse(participant.metadata) : {};
  const isHandRaised = metadata.handRaised;

  return (
    <div className="absolute inset-0 z-30 p-4 md:p-6 flex flex-col justify-between pointer-events-none">
      <div className="flex justify-between items-start w-full">
        <AnimatePresence>
          {isHandRaised && (
            <motion.div
              initial={{ scale: 0, x: -20 }}
              animate={{ scale: 1, x: 0 }}
              exit={{ scale: 0, x: -20 }}
              className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-amber-500 text-black flex items-center justify-center shadow-lg shadow-amber-500/30 border border-amber-400"
            >
              <Hand className="w-6 h-6 fill-current" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      <div className="mt-auto flex justify-start items-end z-50">
        <div className="px-3 md:px-5 py-2 md:py-2.5 rounded-xl md:rounded-2xl bg-black/50 backdrop-blur-3xl border border-white/10 text-[10px] md:text-xs text-white font-bold shadow-2xl flex items-center gap-2.5 max-w-[90%]">
          <div className={trackStatusCn(participant)} />
          <span className="truncate tracking-widest opacity-95 font-outfit uppercase">
            {participant.name || participant.identity}
            {participant.isLocal && " (You)"}
          </span>
        </div>
      </div>
    </div>
  );
}

function trackStatusCn(participant: any) {
  const base = "w-2 h-2 md:w-2.5 md:h-2.5 rounded-full";
  if (participant.isSpeaking) return `${base} bg-primary animate-pulse shadow-[0_0_10px_rgba(59,130,246,0.8)]`;
  if (participant.isLocal) return `${base} bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.5)]`;
  return `${base} bg-white/30`;
}
