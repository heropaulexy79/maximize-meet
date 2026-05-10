"use client";

import { 
  ParticipantTile, 
  useTracks,
} from "@livekit/components-react";
import { Track } from "livekit-client";
import { motion, AnimatePresence } from "framer-motion";
import { Hand } from "lucide-react";

export function MeetingGrid({
  layout,
}: {
  layout: "tiled" | "spotlight" | "sidebar";
}) {
  // useTracks automatically manages the lifecycle of tracks and handles dynamic publishing/unpublishing
  const tracks = useTracks(
    [
      { source: Track.Source.Camera, withPlaceholder: true },
      { source: Track.Source.ScreenShare, withPlaceholder: false },
    ],
    { onlySubscribed: false }
  );

  if (layout === "spotlight") {
    // Spotlight the first speaking or just the first track
    const spotlightTrack = tracks.find(t => t.participant.isSpeaking) || tracks[0];
    
    return (
      <div className="w-full h-full flex items-center justify-center">
        {spotlightTrack && (
          <div className="relative w-full max-w-5xl aspect-video rounded-3xl overflow-hidden border border-white/10 shadow-2xl flex items-center justify-center bg-zinc-900">
            <ParticipantTile trackRef={spotlightTrack} className="w-full h-full [&>video]:object-cover" />
            <ParticipantOverlay participant={spotlightTrack.participant} />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`w-full h-full grid gap-4 p-4 auto-rows-fr ${
      tracks.length === 1 ? 'grid-cols-1' :
      tracks.length === 2 ? 'grid-cols-1 md:grid-cols-2' :
      tracks.length <= 4 ? 'grid-cols-1 md:grid-cols-2' :
      'grid-cols-2 lg:grid-cols-3'
    }`}>
      {tracks.map((trackRef) => (
        <div key={`${trackRef.participant.sid}-${trackRef.source}`} className="relative aspect-video rounded-2xl overflow-hidden border border-white/10 shadow-xl bg-zinc-900 flex items-center justify-center">
          <ParticipantTile trackRef={trackRef} className="w-full h-full [&>video]:object-cover" />
          <ParticipantOverlay participant={trackRef.participant} />
        </div>
      ))}
    </div>
  );
}

function ParticipantOverlay({ participant }: { participant: any }) {
  const metadata = participant.metadata ? JSON.parse(participant.metadata) : {};
  const isHandRaised = metadata.handRaised;

  return (
    <div className="absolute inset-0 z-30 p-3 flex flex-col justify-between pointer-events-none">
      <div className="flex justify-between items-start w-full">
        <AnimatePresence>
          {isHandRaised && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              className="w-10 h-10 rounded-full bg-amber-500 text-black flex items-center justify-center shadow-lg shadow-amber-500/20"
            >
              <Hand className="w-5 h-5 fill-current" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      <div className="absolute bottom-3 left-3 right-3 flex justify-between items-end pointer-events-none z-50">
        <div className="px-4 py-2 rounded-2xl bg-black/80 backdrop-blur-3xl border border-white/20 text-sm text-white font-bold shadow-2xl flex items-center gap-3">
          <div className={`w-2.5 h-2.5 rounded-full ${participant.isLocal ? 'bg-primary animate-pulse shadow-[0_0_10px_rgba(59,130,246,0.5)]' : 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]'}`} />
          <span className="truncate max-w-[200px] drop-shadow-lg tracking-wide">
            {participant.name || participant.identity}
            {participant.isLocal && " (You)"}
          </span>
        </div>
      </div>
    </div>
  );
}
