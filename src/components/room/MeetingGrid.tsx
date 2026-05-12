"use client";

import { useState } from "react";
import { ParticipantTile, useTracks } from "@livekit/components-react";
import { Track } from "livekit-client";
import { motion, AnimatePresence } from "framer-motion";
import { Hand, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const MAX_PER_PAGE = 8;

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

  const totalPages = Math.ceil(tracks.length / MAX_PER_PAGE);
  const currentTracks = tracks.slice(page * MAX_PER_PAGE, (page + 1) * MAX_PER_PAGE);

  if (layout === "spotlight") {
    const spotlightTrack = tracks.find((t) => t.participant.isSpeaking) || tracks[0];
    return (
      <div className="w-full h-full flex items-center justify-center p-4">
        {spotlightTrack && (
          <div className="relative w-full max-w-5xl aspect-video rounded-[2rem] overflow-hidden border border-white/10 shadow-2xl bg-zinc-950">
            <ParticipantTile
              trackRef={spotlightTrack}
              className="w-full h-full [&>video]:object-cover [&_.lk-participant-metadata]:hidden"
            />
            <ParticipantOverlay participant={spotlightTrack.participant} />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="w-full h-full relative flex flex-col overflow-hidden">
      {/* Grid - fills all available space, rows stretch equally */}
      <div
        className={`flex-1 min-h-0 grid auto-rows-fr gap-1.5 md:gap-2 p-1.5 md:p-3 ${getGridCols(currentTracks.length)}`}
      >
        <AnimatePresence mode="popLayout">
          {currentTracks.map((trackRef, idx) => (
            <motion.div
              key={`${trackRef.participant.sid}-${trackRef.source}`}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.3, delay: idx * 0.03 }}
              className="relative min-h-0 rounded-xl md:rounded-2xl overflow-hidden border border-white/5 shadow-xl bg-zinc-900 group/tile"
            >
              {/* Hide LiveKit's built-in name overlay — we render our own */}
              <ParticipantTile
                trackRef={trackRef}
                className="absolute inset-0 w-full h-full [&>video]:object-cover [&_.lk-participant-metadata]:!hidden"
              />
              <ParticipantOverlay participant={trackRef.participant} />
              {trackRef.participant.isSpeaking && (
                <div className="absolute inset-0 border-2 border-primary/50 rounded-xl md:rounded-2xl pointer-events-none" />
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Pagination arrows */}
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
          <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-2 z-50">
            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i}
                onClick={() => setPage(i)}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === page ? "w-6 bg-primary shadow-[0_0_8px_rgba(59,130,246,0.5)]" : "w-1.5 bg-white/30"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function ParticipantOverlay({ participant }: { participant: any }) {
  const metadata = (() => {
    try { return participant.metadata ? JSON.parse(participant.metadata) : {}; }
    catch { return {}; }
  })();
  const isHandRaised = metadata.handRaised;

  return (
    <div className="absolute inset-0 z-20 pointer-events-none flex flex-col justify-between p-2 md:p-3">
      {/* Hand raise */}
      <div className="flex justify-start">
        <AnimatePresence>
          {isHandRaised && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="w-8 h-8 rounded-xl bg-amber-500 flex items-center justify-center shadow-lg"
            >
              <Hand className="w-4 h-4 fill-current text-black" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Name label */}
      <div className="flex items-end">
        <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-black/60 backdrop-blur-md border border-white/10 max-w-[90%]">
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
  );
}
