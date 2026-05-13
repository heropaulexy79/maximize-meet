"use client";

import { useEffect, useState } from "react";
import { useLocalParticipant, useParticipants } from "@livekit/components-react";
import { Track } from "livekit-client";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Video, VideoOff, ShieldAlert, X, VolumeX, Hand } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

export function ParticipantsSidebar({ onClose, roomId, isAdmin }: { onClose: () => void; roomId: string; isAdmin: boolean }) {
  const participants = useParticipants();
  const { localParticipant } = useLocalParticipant();

  const handleAdminAction = async (action: string, identity?: string, trackSid?: string, metadata?: string) => {
    try {
      const user = auth.currentUser;
      if (!user) return;
      const idToken = await user.getIdToken();

      const res = await fetch("/api/livekit/admin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`
        },
        body: JSON.stringify({ action, roomName: roomId, identity, trackSid, metadata }),
      });

      const data = await res.json();
      if (!data.success) {
        toast.error(data.error || "Action failed");
      } else {
        if (action === "muteAll") toast.success("Muted all participants");
        else if (action === "kick") toast.success(`Removed ${identity}`);
        else if (action === "mute") toast.success(`Muted ${identity}`);
      }
    } catch (error) {
      toast.error("Failed to perform admin action");
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-8 border-b border-white/5 flex items-center justify-between">
        <h2 className="text-xl font-heading font-bold text-white flex items-center gap-3">
          People <span className="bg-primary/20 text-primary text-[10px] px-2.5 py-1 rounded-full uppercase tracking-widest">{participants.length}</span>
        </h2>
        <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full hover:bg-white/5 text-white/40">
          <X className="w-5 h-5" />
        </Button>
      </div>

      {isAdmin && (
        <div className="p-6 border-b border-white/5 bg-white/[0.02]">
          <Button 
            onClick={() => handleAdminAction("muteAll")}
            className="w-full h-12 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-xl font-bold text-xs uppercase tracking-widest"
          >
            <VolumeX className="w-4 h-4 mr-2" />
            Mute All Audio
          </Button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {participants.map((p) => {
          const isLocal = p.identity === localParticipant.identity;
          const isAudioMuted = !p.isMicrophoneEnabled;
          const isVideoMuted = !p.isCameraEnabled;
          const audioTrack = p.getTrackPublication(Track.Source.Microphone);
          const metadata = p.metadata ? JSON.parse(p.metadata) : {};
          const isHandRaised = metadata.handRaised;

          return (
            <div key={p.identity} className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.05] transition-all group/p">
              <div className="flex items-center gap-4 overflow-hidden">
                <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center shrink-0 border border-primary/20">
                  <span className="text-primary font-bold uppercase text-lg">{p.identity.charAt(0)}</span>
                </div>
                <div className="truncate">
                  <div className="text-sm font-bold text-white truncate flex items-center gap-2">
                    {p.identity} {isLocal && <span className="text-[10px] text-muted-foreground uppercase opacity-60"> (You)</span>}
                    {isHandRaised && <Hand className="w-4 h-4 text-amber-500 fill-amber-500 animate-bounce" />}
                  </div>
                  <div className="text-[10px] text-muted-foreground uppercase tracking-widest mt-0.5">
                    {metadata.role === "admin" ? <span className="text-primary font-bold">Host</span> : "Participant"}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <div className="flex items-center gap-2 mr-3">
                  {isAudioMuted ? <MicOff className="w-4 h-4 text-red-400/60" /> : <Mic className="w-4 h-4 text-green-400" />}
                  {isVideoMuted ? <VideoOff className="w-4 h-4 text-red-400/60" /> : <Video className="w-4 h-4 text-blue-400" />}
                </div>

                {isAdmin && !isLocal && (
                  <div className="flex items-center gap-1">
                    {/* Make Host Button */}
                    {!metadata.role && (
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="w-9 h-9 rounded-xl text-primary/60 hover:text-primary hover:bg-primary/10"
                        title="Make Host"
                        onClick={() => handleAdminAction("updateParticipant", p.identity, undefined, JSON.stringify({ ...metadata, role: "admin" }))}
                      >
                        <ShieldAlert className="w-4 h-4" />
                      </Button>
                    )}
                    
                    {!isAudioMuted && audioTrack && (
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="w-9 h-9 rounded-xl text-muted-foreground hover:text-white hover:bg-white/10"
                        onClick={() => handleAdminAction("mute", p.identity, audioTrack.trackSid)}
                      >
                        <MicOff className="w-4 h-4" />
                      </Button>
                    )}
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="w-9 h-9 rounded-xl text-red-400/60 hover:text-red-400 hover:bg-red-500/10"
                      onClick={() => handleAdminAction("kick", p.identity)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
