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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
    <div className="text-white/60 font-mono text-xs md:text-sm tracking-widest bg-white/5 px-3 py-1.5 rounded-full border border-white/5">
      {fmt(h)}:{fmt(m)}:{fmt(s)}
    </div>
  );
}

// ─── Control Dock ─────────────────────────────────────────────────────────────
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
}: any) {
  const router = useRouter();
  const room = useRoomContext();
  const { isMicrophoneEnabled, isCameraEnabled, isScreenShareEnabled } =
    useLocalParticipant();

  const sendReaction = async (emoji: string) => {
    if (!room) return;
    const encoder = new TextEncoder();
    const data = encoder.encode(JSON.stringify({ type: "reaction", emoji }));
    await room.localParticipant.publishData(data, { reliable: true });
    window.dispatchEvent(new CustomEvent("local-reaction", { detail: { emoji } }));
  };

  return (
    <div className="flex items-center justify-between w-full px-6 py-4 bg-zinc-950/80 backdrop-blur-3xl border-t border-white/5">
      {/* Session Info */}
      <div className="hidden lg:flex items-center gap-6">
        <div className="flex flex-col">
          <span className="text-[10px] font-bold uppercase tracking-widest text-primary mb-1">Live Academy Session</span>
          <SessionTimer />
        </div>
      </div>

      {/* Main Controls - Compact */}
      <div className="flex items-center gap-2 md:gap-3 bg-white/5 p-1.5 rounded-2xl border border-white/5">
        <TooltipProvider>
          <TrackToggle source={Track.Source.Microphone} showIcon={false} className={cn(
            "flex items-center justify-center w-11 h-11 md:w-12 md:h-12 rounded-xl transition-all border duration-300",
            !isMicrophoneEnabled ? "bg-red-500/20 border-red-500/50 text-red-500" : "bg-transparent border-transparent hover:bg-white/5 text-white"
          )}>
            {isMicrophoneEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
          </TrackToggle>

          <TrackToggle source={Track.Source.Camera} showIcon={false} className={cn(
            "flex items-center justify-center w-11 h-11 md:w-12 md:h-12 rounded-xl transition-all border duration-300",
            !isCameraEnabled ? "bg-red-500/20 border-red-500/50 text-red-500" : "bg-transparent border-transparent hover:bg-white/5 text-white"
          )}>
            {isCameraEnabled ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
          </TrackToggle>

          <Button variant="ghost" onClick={toggleHand} className={cn(
            "w-11 h-11 md:w-12 md:h-12 rounded-xl transition-all border duration-300",
            isHandRaised ? "bg-amber-500/20 border-amber-500/50 text-amber-500" : "bg-transparent border-transparent text-white hover:bg-white/5"
          )}>
            <Hand className="w-5 h-5" />
          </Button>

          <Separator orientation="vertical" className="h-8 bg-white/10 mx-1" />

          <Button variant="ghost" onClick={() => setIsBlurred(!isBlurred)} className={cn(
            "w-11 h-11 md:w-12 md:h-12 rounded-xl hidden md:flex border transition-all duration-300",
            isBlurred ? "bg-primary/20 border-primary/50 text-primary" : "bg-transparent border-transparent text-white hover:bg-white/5"
          )}>
            <Sparkles className="w-5 h-5" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger>
              <Button variant="ghost" className="w-11 h-11 md:w-12 md:h-12 rounded-xl bg-transparent border-transparent text-white hover:bg-white/5">
                <Smile className="w-5 h-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="glass border-white/10 p-2 mb-4 grid grid-cols-3 gap-1">
              {["💖", "👍", "👏", "🎉", "😂", "😮"].map(emoji => (
                <button key={emoji} onClick={() => sendReaction(emoji)} className="w-10 h-10 text-xl hover:bg-white/5 rounded-lg">{emoji}</button>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <TrackToggle source={Track.Source.ScreenShare} showIcon={false} className={cn(
            "hidden md:flex items-center justify-center w-11 h-11 md:w-12 md:h-12 rounded-xl transition-all border duration-300",
            isScreenShareEnabled ? "bg-primary/20 border-primary text-primary shadow-lg shadow-primary/10" : "bg-transparent border-transparent text-white hover:bg-white/5"
          )}>
            <MonitorUp className="w-5 h-5" />
          </TrackToggle>

          {isAdmin && (
            <Button variant="ghost" onClick={isRecording ? onStopRecording : onStartRecording} className={cn(
              "w-11 h-11 md:w-12 md:h-12 rounded-xl transition-all border duration-300",
              isRecording ? "bg-red-500/20 border-red-500 text-red-500" : "bg-transparent border-transparent text-white hover:bg-white/5"
            )}>
              {isRecording ? <CircleStop className="w-5 h-5" /> : <CircleDot className="w-5 h-5" />}
            </Button>
          )}

          <Separator orientation="vertical" className="h-8 bg-white/10 mx-1" />

          <Button variant="destructive" onClick={() => router.push("/dashboard")} className="w-14 h-11 md:h-12 rounded-xl bg-red-500 hover:bg-red-600 shadow-xl shadow-red-500/20 transition-all active:scale-95">
            <LogOut className="w-5 h-5" />
          </Button>
        </TooltipProvider>
      </div>

      {/* Sidebars Controls */}
      <div className="flex items-center gap-2">
        <Button variant="ghost" onClick={() => setParticipantsSidebarOpen(!participantsSidebarOpen)} className={cn(
          "w-11 h-11 md:w-12 md:h-12 rounded-xl border transition-all duration-300",
          participantsSidebarOpen ? "bg-primary/20 border-primary/50 text-primary" : "bg-transparent border-transparent text-white/60 hover:text-white"
        )}>
          <Users className="w-5 h-5" />
        </Button>

        <Button variant="ghost" onClick={() => setChatOpen(!chatOpen)} className={cn(
          "relative w-11 h-11 md:w-12 md:h-12 rounded-xl border transition-all duration-300",
          chatOpen ? "bg-primary/20 border-primary/50 text-primary" : "bg-transparent border-transparent text-white/60 hover:text-white"
        )}>
          <MessageSquare className="w-5 h-5" />
          {unreadChat > 0 && <div className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full shadow-[0_0_8px_rgba(59,130,246,0.6)]" />}
        </Button>

        <Button variant="ghost" onClick={() => setInteractionsOpen(!interactionsOpen)} className={cn(
          "w-11 h-11 md:w-12 md:h-12 rounded-xl border transition-all duration-300",
          interactionsOpen ? "bg-primary/20 border-primary/50 text-primary" : "bg-transparent border-transparent text-white/60 hover:text-white"
        )}>
          <HelpCircle className="w-5 h-5" />
        </Button>
      </div>
    </div>
  );
}

// ─── Invite Dialog ─────────────────────────────────────────────────────────────
function InviteDialog({ open, onClose, roomId }: any) {
  const [copied, setCopied] = useState(false);
  const roomLink = typeof window !== "undefined" ? `${window.location.origin}/room/${roomId}` : "";
  const copyLink = async () => {
    await navigator.clipboard.writeText(roomLink);
    setCopied(true);
    toast.success("Room link copied!");
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-zinc-950 border-white/10 rounded-[2.5rem] p-8">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-white">Invite Members</DialogTitle>
          <DialogDescription className="text-zinc-400">Share this session with your cohort.</DialogDescription>
        </DialogHeader>
        <div className="space-y-6 mt-4">
          <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
            <p className="text-xs text-primary font-bold uppercase tracking-widest mb-2">Room ID</p>
            <p className="text-xl font-mono text-white font-bold">{roomId}</p>
          </div>
          <div className="space-y-2">
            <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest ml-1">Session Link</p>
            <div className="flex gap-2">
              <Input readOnly value={roomLink} className="bg-white/5 border-white/10 text-white rounded-xl h-12" />
              <Button onClick={copyLink} className="bg-primary hover:bg-primary/90 h-12 px-6 rounded-xl font-bold">
                {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Room Page ────────────────────────────────────────────────────────────
export default function RoomPage() {
  useWakeLock(true);
  const { roomId } = useParams();
  const { user, isAdmin } = useAuth();
  const [token, setToken] = useState("");
  const [inviteOpen, setInviteOpen] = useState(false);
  const [participantsSidebarOpen, setParticipantsSidebarOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [interactionsOpen, setInteractionsOpen] = useState(false);
  const [isHandRaised, setIsHandRaised] = useState(false);
  const [layout, setLayout] = useState<"tiled" | "spotlight" | "sidebar">("tiled");
  const [showCaptions, setShowCaptions] = useState(false);
  const [isBlurred, setIsBlurred] = useState(false);
  const [unreadChat, setUnreadChat] = useState(0);
  const [isRecording, setIsRecording] = useState(false);

  useEffect(() => {
    const fetchToken = async () => {
      try {
        const res = await fetch("/api/livekit-token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ room: roomId, username: user?.displayName || user?.email || "Guest" }),
        });
        const data = await res.json();
        setToken(data.token);
      } catch (err) {
        toast.error("Failed to connect to room.");
      }
    };
    if (user && roomId) fetchToken();
  }, [user, roomId]);

  if (!token) return (
    <div className="h-screen w-full bg-black flex flex-col items-center justify-center gap-6">
      <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin shadow-[0_0_20px_rgba(59,130,246,0.3)]" />
      <p className="text-zinc-500 font-medium animate-pulse tracking-widest uppercase text-xs">Establishing Secure Connection...</p>
    </div>
  );

  return (
    <div className="h-screen w-full bg-zinc-950 flex flex-col overflow-hidden relative">
      <LiveKitRoom
        token={token}
        serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL}
        connect={true}
        className="flex-1 flex flex-col min-h-0"
      >
        {/* Main Interaction Area */}
        <div className="flex-1 flex overflow-hidden relative">
          <div className="flex-1 flex flex-col min-w-0">
            <MeetingGrid layout={layout} />
          </div>

          <AnimatePresence>
            {(participantsSidebarOpen || chatOpen || interactionsOpen) && (
              <motion.div
                initial={{ opacity: 0, x: 300 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 300 }}
                className="w-80 md:w-96 bg-zinc-950 border-l border-white/5 h-full z-50 flex flex-col shadow-2xl"
              >
                {participantsSidebarOpen && (
                  <ParticipantsSidebar onClose={() => setParticipantsSidebarOpen(false)} roomId={roomId as string} />
                )}
                {chatOpen && (
                  <ChatSidebar onClose={() => setChatOpen(false)} onUnreadChange={setUnreadChat} />
                )}
                {interactionsOpen && (
                  <InteractionsSidebar onClose={() => setInteractionsOpen(false)} />
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Control Footer */}
        <CustomControlDock
          isRecording={isRecording}
          onStartRecording={() => setIsRecording(true)}
          onStopRecording={() => setIsRecording(false)}
          setInviteOpen={setInviteOpen}
          setParticipantsSidebarOpen={setParticipantsSidebarOpen}
          participantsSidebarOpen={participantsSidebarOpen}
          chatOpen={chatOpen}
          setChatOpen={setChatOpen}
          isHandRaised={isHandRaised}
          toggleHand={() => setIsHandRaised(!isHandRaised)}
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

        <InviteDialog open={inviteOpen} onClose={() => setInviteOpen(false)} roomId={roomId} />
        <RoomAudioRenderer />
      </LiveKitRoom>
    </div>
  );
}
