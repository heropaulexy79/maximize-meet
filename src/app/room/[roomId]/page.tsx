"use client";

import { useEffect, useState } from "react";
import {
  LiveKitRoom,
  RoomAudioRenderer,
  TrackToggle,
  useLocalParticipant,
  useRoomContext,
} from "@livekit/components-react";
import "@livekit/components-styles";
import { Track, RoomEvent } from "livekit-client";
import { useAuth } from "@/context/AuthContext";
import { useParams, useRouter } from "next/navigation";
import { useWakeLock } from "@/hooks/useWakeLock";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  MonitorUp,
  MessageSquare,
  Users,
  LogOut,
  Settings,
  Circle,
  Maximize2,
  User,
  UserPlus,
  Copy,
  Check,
  Mail,
  Link2,
  CircleDot,
  CircleStop,
  Hand,
  LayoutGrid,
  Square,
  Captions,
  HelpCircle,
  Plus,
  Sparkles,
  Smile,
  Heart,
  ThumbsUp,
  PartyPopper,
  Laugh,
  MoreVertical,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ParticipantsSidebar } from "@/components/room/ParticipantsSidebar";
import { ChatSidebar } from "@/components/room/ChatSidebar";
import { InteractionsSidebar } from "@/components/room/InteractionsSidebar";
import { MeetingGrid } from "@/components/room/MeetingGrid";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// ─── Session Timer ─────────────────────────────────────────────────────────────
function SessionTimer() {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  const fmt = (n: number) => n.toString().padStart(2, "0");
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;

  return (
    <div className="text-white/60 font-mono text-sm tracking-widest">
      {fmt(h)}:{fmt(m)}:{fmt(s)}
    </div>
  );
}

// ─── Invite Dialog ─────────────────────────────────────────────────────────────
function InviteDialog({
  open,
  onClose,
  roomId,
}: {
  open: boolean;
  onClose: () => void;
  roomId: string;
}) {
  const [copied, setCopied] = useState(false);
  const [copiedId, setCopiedId] = useState(false);
  const roomLink =
    typeof window !== "undefined"
      ? `${window.location.origin}/room/${roomId}`
      : "";

  const copyLink = async () => {
    await navigator.clipboard.writeText(roomLink);
    setCopied(true);
    toast.success("Room link copied!");
    setTimeout(() => setCopied(false), 2500);
  };

  const copyRoomId = async () => {
    await navigator.clipboard.writeText(roomId);
    setCopiedId(true);
    toast.success("Room ID copied!");
    setTimeout(() => setCopiedId(false), 2500);
  };

  const shareViaEmail = () => {
    const subject = encodeURIComponent("You're invited to a Leadership Session");
    const body = encodeURIComponent(
      `Hi,\n\nYou've been invited to join a live leadership session on the MAXIMIZE NATION Academy.\n\nClick the link below to join:\n${roomLink}\n\nRoom ID: ${roomId}\n\nSee you there!`
    );
    window.open(`mailto:?subject=${subject}&body=${body}`);
  };

  const shareViaWhatsApp = () => {
    const text = encodeURIComponent(
      `🎯 You're invited to a Leadership Session on MAXIMIZE NATION Academy!\n\nJoin here: ${roomLink}\nRoom ID: *${roomId}*`
    );
    window.open(`https://wa.me/?text=${text}`, "_blank");
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-black/90 border-white/10 backdrop-blur-2xl rounded-[2rem] p-0 overflow-hidden">
        {/* Dialog Header */}
        <div className="p-8 pb-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
              <UserPlus className="w-6 h-6 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-xl font-outfit font-bold text-white">
                Invite to Leadership Room
              </DialogTitle>
              <DialogDescription className="text-muted-foreground text-sm mt-0.5">
                Share this session with your cohort members.
              </DialogDescription>
            </div>
          </div>

          {/* Room ID */}
          <div className="flex items-center gap-3 p-4 rounded-2xl bg-white/[0.03] border border-white/5 mb-4">
            <div className="flex-1">
              <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">
                Room ID
              </p>
              <p className="text-white font-mono font-bold text-lg">{roomId}</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={copyRoomId}
              className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 text-white shrink-0"
            >
              {copiedId ? (
                <Check className="w-4 h-4 text-green-400" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </Button>
          </div>

          {/* Room Link */}
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground uppercase tracking-widest ml-1">
              Session Link
            </p>
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  readOnly
                  value={roomLink}
                  className="pl-10 h-12 rounded-xl bg-white/[0.03] border-white/5 text-white font-mono text-sm truncate"
                />
              </div>
              <Button
                onClick={copyLink}
                className="h-12 px-5 rounded-xl bg-primary hover:bg-primary/90 text-white font-medium shrink-0"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 mr-2 text-green-300" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-2" />
                    Copy
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        <Separator className="bg-white/5" />

        {/* Share Options */}
        <div className="p-6 pt-4">
          <p className="text-xs text-muted-foreground uppercase tracking-widest mb-4">
            Share via
          </p>
          <div className="grid grid-cols-2 gap-3">
            {/* WhatsApp */}
            <button
              onClick={shareViaWhatsApp}
              className="flex items-center gap-3 p-4 rounded-2xl bg-green-500/5 border border-green-500/10 hover:bg-green-500/10 hover:border-green-500/20 transition-all"
            >
              <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 text-green-400" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                </svg>
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-white">WhatsApp</p>
                <p className="text-xs text-muted-foreground">Send via chat</p>
              </div>
            </button>

            {/* Email */}
            <button
              onClick={shareViaEmail}
              className="flex items-center gap-3 p-4 rounded-2xl bg-blue-500/5 border border-blue-500/10 hover:bg-blue-500/10 hover:border-blue-500/20 transition-all"
            >
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0">
                <Mail className="w-5 h-5 text-blue-400" />
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-white">Email</p>
                <p className="text-xs text-muted-foreground">Send invite email</p>
              </div>
            </button>
          </div>
        </div>

        <div className="px-6 pb-6">
          <p className="text-xs text-muted-foreground text-center">
            Anyone with this link can join the Leadership Room.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Control Dock ─────────────────────────────────────────────────────────────
const REACTIONS = [
  { emoji: "💖", label: "love", icon: Heart },
  { emoji: "👍", label: "up", icon: ThumbsUp },
  { emoji: "👏", label: "clap", icon: Hand },
  { emoji: "🎉", label: "party", icon: PartyPopper },
  { emoji: "😂", label: "laugh", icon: Laugh },
  { emoji: "😮", label: "wow", icon: Laugh },
];

function CustomControlDock({
  isRecording,
  onStartRecording,
  onStopRecording,
  setInviteOpen,
  setParticipantsSidebarOpen,
  participantsSidebarOpen,
  chatOpen,
  setChatOpen,
  isHandRaised,
  toggleHand,
  layout,
  setLayout,
  showCaptions,
  setShowCaptions,
  interactionsOpen,
  setInteractionsOpen,
  isBlurred,
  setIsBlurred,
  isAdmin,
  unreadChat,
}: {
  isRecording: boolean;
  onStartRecording: () => void;
  onStopRecording: () => void;
  setInviteOpen: (open: boolean) => void;
  setParticipantsSidebarOpen: (open: boolean) => void;
  participantsSidebarOpen: boolean;
  chatOpen: boolean;
  setChatOpen: (open: boolean) => void;
  isHandRaised: boolean;
  toggleHand: () => void;
  layout: "tiled" | "spotlight" | "sidebar";
  setLayout: (l: "tiled" | "spotlight" | "sidebar") => void;
  showCaptions: boolean;
  setShowCaptions: (s: boolean) => void;
  interactionsOpen: boolean;
  setInteractionsOpen: (open: boolean) => void;
  isBlurred: boolean;
  setIsBlurred: (b: boolean) => void;
  isAdmin: boolean;
  unreadChat: number;
}) {
  const router = useRouter();
  const room = useRoomContext();
  const { roomId } = useParams();
  const { isMicrophoneEnabled, isCameraEnabled, isScreenShareEnabled } =
    useLocalParticipant();
  const [showReactions, setShowReactions] = useState(false);
  const [showLayoutMenu, setShowLayoutMenu] = useState(false);

  const sendReaction = async (emoji: string) => {
    if (!room) return;
    const encoder = new TextEncoder();
    const data = encoder.encode(JSON.stringify({ type: "reaction", emoji }));
    await room.localParticipant.publishData(data, { reliable: true });
    setShowReactions(false);
    window.dispatchEvent(new CustomEvent("local-reaction", { detail: { emoji } }));
  };

  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4 px-8 py-4 glass shadow-2xl rounded-[2.5rem] border-white/20">
      {/* Session Info - Only on Desktop */}
      <div className="hidden lg:flex items-center gap-4 border-r border-white/10 pr-6 mr-2">
        <div className="flex flex-col">
          <span className="text-[10px] font-bold uppercase tracking-widest text-primary">Leadership Session</span>
          <SessionTimer />
        </div>
      </div>

      {/* Main Controls */}
      <div className="flex items-center gap-3">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <TrackToggle 
                source={Track.Source.Microphone} 
                showIcon={false}
                className={cn(
                  "flex items-center justify-center w-14 h-14 rounded-2xl transition-all border duration-300",
                  !isMicrophoneEnabled
                    ? "bg-red-500/10 border-red-500/50 text-red-500 hover:bg-red-500/20"
                    : "bg-white/5 border-white/10 hover:bg-white/10 text-white"
                )}
              >
                {isMicrophoneEnabled ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
              </TrackToggle>
            </TooltipTrigger>
            <TooltipContent>{isMicrophoneEnabled ? "Mute" : "Unmute"}</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger>
              <TrackToggle 
                source={Track.Source.Camera} 
                showIcon={false}
                className={cn(
                  "flex items-center justify-center w-14 h-14 rounded-2xl transition-all border duration-300",
                  !isCameraEnabled
                    ? "bg-red-500/10 border-red-500/50 text-red-500 hover:bg-red-500/20"
                    : "bg-white/5 border-white/10 hover:bg-white/10 text-white"
                )}
              >
                {isCameraEnabled ? <Video className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
              </TrackToggle>
            </TooltipTrigger>
            <TooltipContent>{isCameraEnabled ? "Stop Video" : "Start Video"}</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger>
              <Button
                variant="ghost"
                onClick={toggleHand}
                className={cn(
                  "w-14 h-14 rounded-2xl transition-all border duration-300",
                  isHandRaised ? "bg-amber-500/20 border-amber-500/50 text-amber-500 shadow-lg shadow-amber-500/20" : "bg-white/5 border-white/10 text-white hover:bg-white/10"
                )}
              >
                <Hand className="w-6 h-6" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Raise Hand</TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <Separator orientation="vertical" className="h-8 bg-white/10 mx-2" />

        <div className="flex items-center gap-3">
          {/* Reaction Button */}
          <div className="relative">
            <Button
              variant="ghost"
              onClick={() => setShowReactions(!showReactions)}
              className={cn(
                "w-14 h-14 rounded-2xl transition-all border duration-300",
                showReactions ? "bg-primary/20 border-primary/50 text-primary" : "bg-white/5 border-white/10 text-white hover:bg-white/10"
              )}
            >
              <Smile className="w-6 h-6" />
            </Button>
            <AnimatePresence>
              {showReactions && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.9 }}
                  className="absolute bottom-20 left-1/2 -translate-x-1/2 glass border border-white/20 rounded-[1.5rem] p-2 flex gap-1 shadow-2xl z-50"
                >
                  {REACTIONS.map((r) => (
                    <button
                      key={r.label}
                      onClick={() => sendReaction(r.emoji)}
                      className="w-12 h-12 flex items-center justify-center text-3xl hover:bg-white/5 rounded-xl transition-all hover:scale-125"
                    >
                      {r.emoji}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Screen Share */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <TrackToggle 
                  source={Track.Source.ScreenShare} 
                  showIcon={false}
                  className={cn(
                    "flex items-center justify-center w-14 h-14 rounded-2xl transition-all border duration-300",
                    isScreenShareEnabled ? "bg-primary/20 border-primary text-primary shadow-lg shadow-primary/20" : "bg-white/5 border-white/10 text-white hover:bg-white/10"
                  )}
                >
                  <MonitorUp className="w-6 h-6" />
                </TrackToggle>
              </TooltipTrigger>
              <TooltipContent>Present Screen</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* Recording (Admin Only) */}
          {isAdmin && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Button
                    variant="ghost"
                    onClick={isRecording ? onStopRecording : onStartRecording}
                    className={cn(
                      "w-14 h-14 rounded-2xl transition-all border duration-300",
                      isRecording ? "bg-red-500/20 border-red-500 text-red-500 animate-pulse" : "bg-white/5 border-white/10 text-white hover:bg-white/10"
                    )}
                  >
                    {isRecording ? <CircleStop className="w-6 h-6" /> : <CircleDot className="w-6 h-6" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{isRecording ? "Stop Recording" : "Record Session"}</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>

        <Separator orientation="vertical" className="h-8 bg-white/10 mx-2" />

        {/* Sidebars Controls */}
        <div className="flex items-center gap-3">
          <TooltipProvider>
            {[
              { icon: Users, open: participantsSidebarOpen, setOpen: setParticipantsSidebarOpen, label: "Participants", count: 0 },
              { icon: MessageSquare, open: chatOpen, setOpen: setChatOpen, label: "Chat", count: unreadChat },
              { icon: Sparkles, open: isBlurred, setOpen: setIsBlurred, label: "Visual Effects", count: 0 },
              { icon: HelpCircle, open: interactionsOpen, setOpen: setInteractionsOpen, label: "Activities", count: 0 },
            ].map((item, i) => (
              <Tooltip key={i}>
                <TooltipTrigger>
                  <Button
                    variant="ghost"
                    onClick={() => item.setOpen(!item.open)}
                    className={cn(
                      "relative w-14 h-14 rounded-2xl transition-all border duration-300",
                      item.open ? "bg-primary/20 border-primary/50 text-primary shadow-lg shadow-primary/10" : "bg-white/5 border-white/10 text-white hover:bg-white/10"
                    )}
                  >
                    <item.icon className="w-6 h-6" />
                    {item.count > 0 && (
                      <span className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-primary text-[10px] font-bold text-primary-foreground flex items-center justify-center animate-bounce border-2 border-background">
                        {item.count}
                      </span>
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{item.label}</TooltipContent>
              </Tooltip>
            ))}
          </TooltipProvider>
        </div>

        <Separator orientation="vertical" className="h-8 bg-white/10 mx-2" />

        {/* Leave Button */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <Button
                variant="destructive"
                onClick={() => router.push("/dashboard")}
                className="w-16 h-14 rounded-2xl bg-red-500 hover:bg-red-600 shadow-xl shadow-red-500/20 active:scale-95 transition-all"
              >
                <LogOut className="w-6 h-6" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Leave Session</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
}

// ─── Reaction Display Overlay ────────────────────────────────────────────────
function ReactionOverlay() {
  const room = useRoomContext();
  const [activeReactions, setActiveReactions] = useState<{ id: string; emoji: string; name: string }[]>([]);

  useEffect(() => {
    if (!room) return;

    const handleData = (payload: Uint8Array, participant?: any) => {
      const decoder = new TextDecoder();
      try {
        const data = JSON.parse(decoder.decode(payload));
        if (data.type === "reaction") {
          const id = Math.random().toString(36).substring(7);
          const name = participant?.name || participant?.identity || "Someone";
          setActiveReactions((prev) => [...prev, { id, emoji: data.emoji, name }]);
          setTimeout(() => {
            setActiveReactions((prev) => prev.filter((r) => r.id !== id));
          }, 3000);
        }
      } catch (e) {}
    };

    const handleLocal = (e: any) => {
      const id = Math.random().toString(36).substring(7);
      setActiveReactions((prev) => [...prev, { id, emoji: e.detail.emoji, name: "You" }]);
      setTimeout(() => {
        setActiveReactions((prev) => prev.filter((r) => r.id !== id));
      }, 3000);
    };

    room.on("dataReceived", handleData);
    window.addEventListener("local-reaction", handleLocal);
    return () => {
      room.off("dataReceived", handleData);
      window.removeEventListener("local-reaction", handleLocal);
    };
  }, [room]);

  return (
    <div className="fixed inset-0 pointer-events-none z-[100] flex items-end justify-center pb-32 overflow-hidden">
      <div className="relative w-full h-full max-w-lg">
        <AnimatePresence>
          {activeReactions.map((r) => (
            <motion.div
              key={r.id}
              initial={{ y: 0, x: Math.random() * 100 - 50, opacity: 0, scale: 0.5 }}
              animate={{ y: -400, opacity: [0, 1, 1, 0], scale: [0.5, 1.2, 1.2, 0.8] }}
              exit={{ opacity: 0 }}
              transition={{ duration: 2.5, ease: "easeOut" }}
              className="absolute bottom-0 left-1/2 flex flex-col items-center"
            >
              <div className="text-4xl filter drop-shadow-lg mb-1">{r.emoji}</div>
              <div className="bg-black/40 backdrop-blur-md px-2 py-0.5 rounded-full text-[10px] text-white/80 border border-white/5 whitespace-nowrap">
                {r.name}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ─── Hand Status Manager ──────────────────────────────────────────────────────
function HandStatusManager({ isHandRaised }: { isHandRaised: boolean }) {
  const room = useRoomContext();
  
  // Update local metadata when state changes
  useEffect(() => {
    if (room) {
      room.localParticipant.setMetadata(JSON.stringify({ handRaised: isHandRaised }));
    }
  }, [isHandRaised, room]);

  // Listen for other participants raising their hands
  useEffect(() => {
    if (!room) return;

    const handleMetadataChange = (participant: any) => {
      const metadata = participant.metadata;
      if (!metadata) return;
      try {
        const data = JSON.parse(metadata);
        if (data.handRaised && participant.identity !== room.localParticipant.identity) {
          const name = participant.name || participant.identity || "Someone";
          toast(`${name} raised their hand`, {
            icon: "✋",
            duration: 4000,
          });
        }
      } catch (e) {
        // Metadata might not be JSON, ignore
      }
    };

    room.on(RoomEvent.ParticipantMetadataChanged, handleMetadataChange);
    return () => {
      room.off(RoomEvent.ParticipantMetadataChanged, handleMetadataChange);
    };
  }, [room]);

  return null;
}

// ─── Background Blur Manager ──────────────────────────────────────────────────
function BlurManager({ isBlurred }: { isBlurred: boolean }) {
  const room = useRoomContext();
  
  useEffect(() => {
    const applyBlur = async () => {
      if (!room) return;
      const trackPublication = room.localParticipant.getTrackPublication(Track.Source.Camera);
      const track = trackPublication?.videoTrack;
      if (!track) return;

      try {
        if (isBlurred) {
          const { BackgroundBlur } = await import("@livekit/track-processors");
          const processor = BackgroundBlur(10);
          await track.setProcessor(processor);
        } else {
          // Only stop if there is a processor
          if (track.getProcessor()) {
            await track.stopProcessor();
          }
        }
      } catch (e) {
        console.error("Blur processing error:", e);
      }
    };

    applyBlur();
  }, [isBlurred, room]);

  return null;
}

// ─── Participant Event Notifier ───────────────────────────────────────────────
function ParticipantEventNotifier() {
  const room = useRoomContext();

  useEffect(() => {
    if (!room) return;

    const handleConnected = (participant: any) => {
      const name = participant.name || participant.identity || "Someone";
      toast.success(`${name} joined the room`);
    };

    const handleDisconnected = (participant: any) => {
      const name = participant.name || participant.identity || "Someone";
      toast(`${name} left the room`);
    };

    room.on(RoomEvent.ParticipantConnected, handleConnected);
    room.on(RoomEvent.ParticipantDisconnected, handleDisconnected);

    return () => {
      room.off(RoomEvent.ParticipantConnected, handleConnected);
      room.off(RoomEvent.ParticipantDisconnected, handleDisconnected);
    };
  }, [room]);

  return null;
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function RoomPage() {
  // Keep screen awake during the session
  useWakeLock(true);
  const { roomId } = useParams();
  const { user, isAdmin } = useAuth();
  const [token, setToken] = useState<string>("");
  const [inviteOpen, setInviteOpen] = useState(false);
  const [participantsSidebarOpen, setParticipantsSidebarOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [interactionsOpen, setInteractionsOpen] = useState(false);
  const [isHandRaised, setIsHandRaised] = useState(false);
  const [layout, setLayout] = useState<"tiled" | "spotlight" | "sidebar">("tiled");
  const [showCaptions, setShowCaptions] = useState(false);
  const [captions, setCaptions] = useState<{ id: string; text: string; user: string }[]>([]);
  const [isBlurred, setIsBlurred] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [egressId, setEgressId] = useState<string | null>(null);
  const [unreadChat, setUnreadChat] = useState(0);
  const router = useRouter();



  // Speech Recognition for Captions
  useEffect(() => {
    if (!showCaptions) return;
    
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error("Captions are not supported in this browser");
      setShowCaptions(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event: any) => {
      const result = event.results[event.results.length - 1];
      if (result.isFinal) {
        const text = result[0].transcript;
        const id = Math.random().toString(36).substring(7);
        setCaptions((prev) => [...prev.slice(-3), { id, text, user: user?.displayName || "You" }]);
        setTimeout(() => {
          setCaptions((prev) => prev.filter((c) => c.id !== id));
        }, 5000);
      }
    };

    recognition.start();
    return () => recognition.stop();
  }, [showCaptions, user]);

  const toggleHand = () => {
    const newState = !isHandRaised;
    setIsHandRaised(newState);
    if (newState) {
      toast("You raised your hand", { icon: "✋" });
    }
  };

  const startRecording = async () => {
    try {
      const res = await fetch("/api/recording", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "start", roomName: roomId }),
      });
      const data = await res.json();
      if (data.success) {
        setIsRecording(true);
        setEgressId(data.egressId);
        toast.success("Recording started");
      } else {
        toast.error(data.error || "Failed to start recording");
      }
    } catch {
      toast.error("Failed to connect to recording service");
    }
  };

  const stopRecording = async () => {
    if (!egressId) return;
    try {
      const res = await fetch("/api/recording", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "stop", egressId }),
      });
      const data = await res.json();
      if (data.success) {
        setIsRecording(false);
        setEgressId(null);
        toast.success("Recording saved to the Replay Vault");
      } else {
        toast.error(data.error || "Failed to stop recording");
      }
    } catch {
      toast.error("Failed to stop recording");
    }
  };

  const [guestName, setGuestName] = useState("");
  const [isJoining, setIsJoining] = useState(false);

  useEffect(() => {
    // Only auto-authenticate if the user is already logged in
    if (user && token === "") {
      (async () => {
        try {
          const idToken = await user.getIdToken();
          const resp = await fetch(
            `/api/livekit?room=${roomId}&username=${user.displayName || user.email}`,
            {
              headers: {
                Authorization: `Bearer ${idToken}`,
              },
            }
          );
          const data = await resp.json();
          if (data.token) setToken(data.token);
        } catch (e) {
          console.error(e);
          toast.error("Failed to authenticate session");
        }
      })();
    }
  }, [roomId, user, token]);

  const handleGuestJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestName.trim()) {
      toast.error("Please enter your name to join");
      return;
    }

    setIsJoining(true);
    try {
      const resp = await fetch(
        `/api/livekit?room=${roomId}&username=${encodeURIComponent(guestName)}`
      );
      const data = await resp.json();
      if (data.token) {
        setToken(data.token);
        toast.success(`Welcome to the room, ${guestName}!`);
      } else {
        toast.error(data.error || "Failed to join room");
      }
    } catch (e) {
      toast.error("Connection failed");
    } finally {
      setIsJoining(false);
    }
  };

  if (token === "") {
    // If not logged in and no token yet, show Guest Join UI
    if (!user) {
      return (
        <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 relative overflow-hidden">
          {/* Background Gradients */}
          <div className="absolute inset-0 z-0">
            <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/20 blur-[120px] rounded-full" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-primary/10 blur-[120px] rounded-full" />
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-md z-10"
          >
            <Card className="bg-white/[0.02] border-white/10 backdrop-blur-3xl rounded-[2.5rem] p-10 overflow-hidden shadow-2xl">
              <div className="flex flex-col items-center text-center space-y-6">
                <div className="w-20 h-20 rounded-3xl bg-primary flex items-center justify-center shadow-2xl shadow-primary/30">
                  <Video className="w-10 h-10 text-white" />
                </div>
                <div>
                  <h2 className="text-3xl font-outfit font-bold text-white mb-2">Join Leadership Session</h2>
                  <p className="text-muted-foreground">Enter your name to step into the room.</p>
                </div>

                <form onSubmit={handleGuestJoin} className="w-full space-y-4">
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input 
                      placeholder="Your Full Name"
                      value={guestName}
                      onChange={(e) => setGuestName(e.target.value)}
                      className="h-14 pl-12 rounded-2xl bg-white/[0.05] border-white/10 text-white text-lg focus:border-primary/50 transition-all"
                    />
                  </div>
                  <Button 
                    type="submit" 
                    disabled={isJoining}
                    className="w-full h-14 rounded-2xl bg-primary hover:bg-primary/90 text-white font-bold text-lg shadow-xl shadow-primary/20 transition-all"
                  >
                    {isJoining ? (
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                        Joining...
                      </div>
                    ) : "Enter Room"}
                  </Button>
                </form>

                <div className="pt-4 border-t border-white/5 w-full">
                  <p className="text-xs text-muted-foreground">
                    By joining, you agree to the academy's code of conduct.
                  </p>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>
      );
    }

    // If logged in but still authenticating
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center space-y-6">
        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="w-16 h-16 rounded-full border-4 border-primary border-t-transparent"
        />
        <div className="text-center">
          <h2 className="text-2xl font-outfit font-bold text-white mb-2">
            Preparing Leadership Room
          </h2>
          <p className="text-muted-foreground">
            Authenticating your secure session...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-screen w-full bg-luxe-gradient overflow-hidden flex flex-col font-sans">
      <LiveKitRoom
        serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL}
        token={token}
        connect={true}
        video={true}
        audio={true}
        onDisconnected={() => router.push("/dashboard")}
        className="flex-1 flex flex-col relative"
      >
        <RoomAudioRenderer />
        
        {/* Managers & Notifiers */}
        <BlurManager isBlurred={isBlurred} />
        <HandStatusManager isHandRaised={isHandRaised} />
        <ParticipantEventNotifier />
        
        {/* Top Header Overlay */}
        <div className="absolute top-0 left-0 right-0 z-40 p-8 flex items-center justify-between pointer-events-none">
          <div className="flex items-center gap-5 pointer-events-auto">
            <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20 group">
              <Sparkles className="w-7 h-7 text-primary-foreground group-hover:scale-110 transition-transform" />
            </div>
            <div>
              <h2 className="text-white font-bold tracking-tight text-xl leading-tight">Leadership Masterclass</h2>
              <div className="flex items-center gap-2 mt-0.5">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <span className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em]">Live Academy Session</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4 pointer-events-auto">
            <Badge variant="outline" className="bg-white/5 border-white/10 text-white/80 px-5 py-2 rounded-full backdrop-blur-md font-bold tracking-wide">
              Cohort Alpha
            </Badge>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex overflow-hidden p-6 pt-28 pb-36">
          <div className="flex-1 relative rounded-[3.5rem] overflow-hidden border border-white/10 bg-black/40 backdrop-blur-md shadow-2xl group/grid">
            <MeetingGrid 
              layout={layout} 
            />
            
            {/* Reaction Layer */}
            <ReactionOverlay />

            {/* Captions Overlay */}
            <AnimatePresence>
              {showCaptions && (
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: 20, opacity: 0 }}
                  className="absolute bottom-8 left-1/2 -translate-x-1/2 w-full max-w-2xl px-8 pointer-events-none z-40"
                >
                  <div className="glass rounded-2xl p-6 shadow-2xl border-primary/20">
                    <p className="text-primary font-bold text-[10px] uppercase tracking-widest mb-2">Live Transcript</p>
                    <p className="text-white/90 text-base leading-relaxed font-medium">
                      "Listening to the speaker..."
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Sidebars */}
          <AnimatePresence>
            {(participantsSidebarOpen || chatOpen || interactionsOpen) && (
              <motion.div
                initial={{ x: 400, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 400, opacity: 0 }}
                className="w-[400px] ml-8 h-full glass rounded-[3.5rem] overflow-hidden shadow-2xl border-white/10 relative"
              >
                {participantsSidebarOpen && <ParticipantsSidebar onClose={() => setParticipantsSidebarOpen(false)} roomId={roomId as string} />}
                {chatOpen && <ChatSidebar onClose={() => setChatOpen(false)} onUnreadChange={setUnreadChat} />}
                {interactionsOpen && <InteractionsSidebar onClose={() => setInteractionsOpen(false)} />}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Floating Controls Dock */}
        <CustomControlDock
          isRecording={isRecording}
          onStartRecording={startRecording}
          onStopRecording={stopRecording}
          setInviteOpen={setInviteOpen}
          setParticipantsSidebarOpen={setParticipantsSidebarOpen}
          participantsSidebarOpen={participantsSidebarOpen}
          chatOpen={chatOpen}
          setChatOpen={setChatOpen}
          isHandRaised={isHandRaised}
          toggleHand={toggleHand}
          layout={layout}
          setLayout={setLayout}
          showCaptions={showCaptions}
          setShowCaptions={setShowCaptions}
          interactionsOpen={interactionsOpen}
          setInteractionsOpen={setInteractionsOpen}
          isBlurred={isBlurred}
          setIsBlurred={setIsBlurred}
          isAdmin={isAdmin}
          unreadChat={unreadChat}
        />

        <InviteDialog
          open={inviteOpen}
          onClose={() => setInviteOpen(false)}
          roomId={roomId as string}
        />
      </LiveKitRoom>
    </div>
  );
}
