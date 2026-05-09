"use client";

import { 
  useParticipants, 
  ParticipantTile, 
  TrackRefContext,
  useParticipantContext,
} from "@livekit/components-react";
import { Participant, Track } from "livekit-client";
import { motion, AnimatePresence } from "framer-motion";
import { Hand } from "lucide-react";

export function MeetingGrid({
  layout,
}: {
  layout: "tiled" | "spotlight" | "sidebar";
}) {
  const participants = useParticipants();

  if (layout === "spotlight") {
    // Only show active speaker or first participant
    const spotlightParticipant = participants.find(p => p.isSpeaking) || participants[0];
    return (
      <div className="w-full h-full flex items-center justify-center">
        {spotlightParticipant && (
          <div className="relative w-full max-w-5xl aspect-video rounded-3xl overflow-hidden border border-white/10 shadow-2xl">
            <ParticipantTile trackRef={{ participant: spotlightParticipant, source: Track.Source.Camera }}>
               <ParticipantOverlay participant={spotlightParticipant} />
            </ParticipantTile>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`w-full h-full grid gap-4 p-4 auto-rows-fr ${
      participants.length === 1 ? 'grid-cols-1' :
      participants.length === 2 ? 'grid-cols-1 md:grid-cols-2' :
      participants.length <= 4 ? 'grid-cols-1 md:grid-cols-2' :
      'grid-cols-2 lg:grid-cols-3'
    }`}>
      {participants.map((p) => (
        <div key={p.sid} className="relative aspect-video rounded-2xl overflow-hidden border border-white/10 shadow-xl bg-zinc-900">
          <ParticipantTile trackRef={{ participant: p, source: Track.Source.Camera }}>
            <ParticipantOverlay participant={p} />
          </ParticipantTile>
        </div>
      ))}
    </div>
  );
}

function ParticipantOverlay({ participant }: { participant: Participant }) {
  const metadata = participant.metadata ? JSON.parse(participant.metadata) : {};
  const isHandRaised = metadata.handRaised;

  return (
    <div className="absolute inset-0 pointer-events-none z-10 p-4">
      <AnimatePresence>
        {isHandRaised && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="absolute top-4 left-4 w-10 h-10 rounded-full bg-amber-500 text-black flex items-center justify-center shadow-lg shadow-amber-500/20"
          >
            <Hand className="w-5 h-5 fill-current" />
          </motion.div>
        )}
      </AnimatePresence>
      
      <div className="absolute bottom-4 left-4 px-3 py-1 rounded-lg bg-black/40 backdrop-blur-md border border-white/10 text-[10px] text-white/90 font-medium">
        {participant.name || participant.identity}
        {participant.isLocal && " (You)"}
      </div>
    </div>
  );
}
