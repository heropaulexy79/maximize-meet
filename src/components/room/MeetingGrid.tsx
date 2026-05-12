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

  // Spotlight Logic (remains unchanged but polished)
  if (layout === "spotlight") {
    const spotlightTrack = tracks.find(t => t.participant.isSpeaking) || tracks[0];
    return (
      <div className="w-full h-full flex items-center justify-center p-4">
        {spotlightTrack && (
          <div className="relative w-full max-w-5xl aspect-video rounded-[2.5rem] overflow-hidden border border-white/10 shadow-2xl bg-zinc-950">
            <ParticipantTile trackRef={spotlightTrack} className="w-full h-full [&>video]:object-cover" />
            <ParticipantOverlay participant={spotlightTrack.participant} />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col items-center justify-center relative group/grid">
      <div className={`w-full max-w-7xl mx-auto grid gap-3 md:gap-4 p-4 flex-1 content-center ${
        currentTracks.length === 1 ? 'grid-cols-1' :
        currentTracks.length === 2 ? 'grid-cols-1 md:grid-cols-2' :
        currentTracks.length <= 4 ? 'grid-cols-2' :
        'grid-cols-2 md:grid-cols-3 lg:grid-cols-4'
      }`}>
        <AnimatePresence mode="wait">
          {currentTracks.map((trackRef, idx) => (
            <motion.div 
              key={`${trackRef.participant.sid}-${trackRef.source}`}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.3, delay: idx * 0.05 }}
              className="relative aspect-video rounded-2xl md:rounded-[2rem] overflow-hidden border border-white/5 shadow-2xl bg-zinc-950/50 backdrop-blur-md flex items-center justify-center transition-all duration-500 hover:scale-[1.02] hover:z-10 group/tile"
            >
              <ParticipantTile trackRef={trackRef} className="w-full h-full [&>video]:object-cover" />
              <ParticipantOverlay participant={trackRef.participant} />
              
              {/* Speaking indicator border */}
              {trackRef.participant.isSpeaking && (
                <div className="absolute inset-0 border-2 border-primary/50 rounded-2xl md:rounded-[2rem] pointer-events-none animate-pulse" />
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <>
          <div className="absolute left-4 top-1/2 -translate-y-1/2 z-50">
            <Button
              variant="ghost"
              size="icon"
              disabled={page === 0}
              onClick={() => setPage(p => p - 1)}
              className="w-12 h-12 rounded-full bg-black/40 backdrop-blur-xl border border-white/10 hover:bg-black/60 text-white disabled:opacity-0 transition-all"
            >
              <ChevronLeft className="w-6 h-6" />
            </Button>
          </div>
          <div className="absolute right-4 top-1/2 -translate-y-1/2 z-50">
            <Button
              variant="ghost"
              size="icon"
              disabled={page === totalPages - 1}
              onClick={() => setPage(p => p + 1)}
              className="w-12 h-12 rounded-full bg-black/40 backdrop-blur-xl border border-white/10 hover:bg-black/60 text-white disabled:opacity-0 transition-all"
            >
              <ChevronRight className="w-6 h-6" />
            </Button>
          </div>

          {/* Page Indicators */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-50">
            {Array.from({ length: totalPages }).map((_, i) => (
              <div 
                key={i} 
                className={`h-1.5 rounded-full transition-all duration-300 ${i === page ? 'w-6 bg-primary' : 'w-1.5 bg-white/20'}`} 
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
    <div className="absolute inset-0 z-30 p-3 md:p-4 flex flex-col justify-between pointer-events-none">
      <div className="flex justify-between items-start w-full">
        <AnimatePresence>
          {isHandRaised && (
            <motion.div
              initial={{ scale: 0, x: -20 }}
              animate={{ scale: 1, x: 0 }}
              exit={{ scale: 0, x: -20 }}
              className="w-9 h-9 md:w-11 md:h-11 rounded-2xl bg-amber-500 text-black flex items-center justify-center shadow-lg shadow-amber-500/30 border border-amber-400"
            >
              <Hand className="w-5 h-5 md:w-6 md:h-6 fill-current" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      <div className="mt-auto flex justify-start items-end z-50">
        <div className="px-3 md:px-4 py-1.5 md:py-2 rounded-xl md:rounded-2xl bg-black/60 backdrop-blur-xl border border-white/10 text-[10px] md:text-xs text-white font-bold shadow-2xl flex items-center gap-2 max-w-[90%]">
          <div className={trackStatusCn(participant)} />
          <span className="truncate tracking-wide opacity-90 font-outfit">
            {participant.name || participant.identity}
            {participant.isLocal && " (You)"}
          </span>
        </div>
      </div>
    </div>
  );
}

function trackStatusCn(participant: any) {
  const base = "w-2 h-2 rounded-full";
  if (participant.isSpeaking) return `${base} bg-primary animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.8)]`;
  if (participant.isLocal) return `${base} bg-cyan-400`;
  return `${base} bg-white/40`;
}
