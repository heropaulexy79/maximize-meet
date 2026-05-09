"use client";

import { useEffect, useState } from "react";
import { useLocalParticipant, useParticipants } from "@livekit/components-react";
import { Track } from "livekit-client";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Video, VideoOff, ShieldAlert, X, VolumeX } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

interface ParticipantsSidebarProps {
  open: boolean;
  onClose: () => void;
  roomId: string;
}

export function ParticipantsSidebar({ open, onClose, roomId }: ParticipantsSidebarProps) {
  const participants = useParticipants();
  const { localParticipant } = useLocalParticipant();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkAdmin = async () => {
      const user = auth.currentUser;
      if (user) {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists() && userDoc.data().role === "admin") {
          setIsAdmin(true);
        }
      }
    };
    checkAdmin();
  }, []);

  const handleAdminAction = async (action: "mute" | "kick" | "muteAll", identity?: string, trackSid?: string) => {
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
        body: JSON.stringify({ action, roomName: roomId, identity, trackSid }),
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
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ x: 400, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 400, opacity: 0 }}
          className="fixed right-0 top-0 bottom-0 md:top-0 md:bottom-0 md:right-0 w-full md:w-80 bg-black/80 backdrop-blur-3xl border-l border-white/10 z-[100] flex flex-col shadow-2xl"
        >
          <div className="p-6 border-b border-white/10 flex items-center justify-between">
            <h2 className="text-xl font-outfit font-bold text-white flex items-center gap-2">
              People <span className="bg-primary/20 text-primary text-xs px-2 py-0.5 rounded-full">{participants.length}</span>
            </h2>
            <Button variant="ghost" size="icon" onClick={onClose} className="text-muted-foreground hover:text-white rounded-full">
              <X className="w-5 h-5" />
            </Button>
          </div>

          {isAdmin && (
            <div className="p-4 border-b border-white/10">
              <Button 
                onClick={() => handleAdminAction("muteAll")}
                className="w-full bg-white/5 hover:bg-white/10 text-white border border-white/10"
              >
                <VolumeX className="w-4 h-4 mr-2" />
                Mute All Audio
              </Button>
            </div>
          )}

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {participants.map((p) => {
              const isLocal = p.identity === localParticipant.identity;
              const isAudioMuted = !p.isMicrophoneEnabled;
              const isVideoMuted = !p.isCameraEnabled;
              const audioTrack = p.getTrackPublication(Track.Source.Microphone);

              return (
                <div key={p.identity} className="flex items-center justify-between p-3 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.05] transition-colors">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                      <span className="text-primary font-bold uppercase">{p.identity.charAt(0)}</span>
                    </div>
                    <div className="truncate">
                      <div className="text-sm font-medium text-white truncate flex items-center gap-2">
                        {p.identity} {isLocal && <span className="text-xs text-muted-foreground">(You)</span>}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {/* Status Icons */}
                    <div className="flex items-center gap-1 mr-2 text-muted-foreground">
                      {isAudioMuted ? <MicOff className="w-4 h-4 text-red-400" /> : <Mic className="w-4 h-4 text-green-400" />}
                      {isVideoMuted ? <VideoOff className="w-4 h-4 text-red-400" /> : <Video className="w-4 h-4 text-blue-400" />}
                    </div>

                    {/* Admin Actions */}
                    {isAdmin && !isLocal && (
                      <>
                        {!isAudioMuted && audioTrack && (
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="w-8 h-8 rounded-full text-muted-foreground hover:text-white hover:bg-white/10"
                            onClick={() => handleAdminAction("mute", p.identity, audioTrack.trackSid)}
                            title="Mute Microphone"
                          >
                            <MicOff className="w-4 h-4" />
                          </Button>
                        )}
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="w-8 h-8 rounded-full text-red-400 hover:text-red-300 hover:bg-red-500/20"
                          onClick={() => handleAdminAction("kick", p.identity)}
                          title="Remove from room"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
