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
    // Also show locally
    window.dispatchEvent(new CustomEvent("local-reaction", { detail: { emoji } }));
  };

  return (
    <div className="relative z-50 px-2 md:px-8 flex items-center justify-between bg-[#050505] border-t border-white/5 h-20 md:h-24 w-full">
      {/* Left side info (Time) - Hidden on Mobile */}
      <div className="hidden md:flex items-center gap-4 w-1/4">
        <div className="text-white font-mono text-sm tracking-widest opacity-60">
          {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
        <div className="h-4 w-px bg-white/10" />
        <div className="text-white/60 text-sm font-outfit font-medium truncate">
          Leadership Room
        </div>
      </div>

      {/* Center Controls */}
      <div className="flex items-center gap-1.5 md:gap-3 mx-auto md:mx-0">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <TrackToggle 
                source={Track.Source.Microphone} 
                showIcon={false}
                className={`flex items-center justify-center w-10 h-10 md:w-12 md:h-12 rounded-full transition-all border ${
                  !isMicrophoneEnabled
                    ? "bg-red-500 border-red-500 text-white hover:bg-red-600"
                    : "bg-white/5 border-white/10 hover:bg-white/10 text-white"
                }`}
              >
                {isMicrophoneEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
              </TrackToggle>
            </TooltipTrigger>
            <TooltipContent>{isMicrophoneEnabled ? "Mute Mic" : "Unmute Mic"}</TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <TrackToggle 
                source={Track.Source.Camera} 
                showIcon={false}
                className={`flex items-center justify-center w-10 h-10 md:w-12 md:h-12 rounded-full transition-all border ${
                  !isCameraEnabled
                    ? "bg-red-500 border-red-500 text-white hover:bg-red-600"
                    : "bg-white/5 border-white/10 hover:bg-white/10 text-white"
                }`}
              >
                {isCameraEnabled ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
              </TrackToggle>
            </TooltipTrigger>
            <TooltipContent>{isCameraEnabled ? "Stop Video" : "Start Video"}</TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {/* Essential Mobile Controls */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleHand}
                className={`w-10 h-10 md:w-12 md:h-12 rounded-full transition-all border ${
                  isHandRaised ? "bg-amber-500 border-amber-500 text-black" : "bg-white/5 border-white/10 text-white"
                }`}
              >
                <Hand className="w-5 h-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Raise Hand</TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {/* Desktop-only secondary controls */}
        <div className="hidden lg:flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsBlurred(!isBlurred)}
            className={`w-12 h-12 rounded-full transition-all border ${isBlurred ? "bg-primary border-primary text-white" : "bg-white/5 border-white/10 text-white"}`}
          >
            <Sparkles className="w-5 h-5" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowReactions(!showReactions)}
            className={`w-12 h-12 rounded-full transition-all border ${showReactions ? "bg-primary/20 border-primary text-primary" : "bg-white/5 border-white/10 text-white"}`}
          >
            <Smile className="w-5 h-5" />
          </Button>

          <TrackToggle 
            source={Track.Source.ScreenShare} 
            showIcon={false}
            className={`flex items-center justify-center w-12 h-12 rounded-full transition-all border ${isScreenShareEnabled ? "bg-primary/20 border-primary text-primary" : "bg-white/5 border-white/10 text-white"}`}
          >
            <MonitorUp className="w-5 h-5" />
          </TrackToggle>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowCaptions(!showCaptions)}
            className={`w-12 h-12 rounded-full transition-all border ${showCaptions ? "bg-primary border-primary text-white" : "bg-white/5 border-white/10 text-white"}`}
          >
            <Captions className="w-5 h-5" />
          </Button>

          {isAdmin && (
            <Button
              variant="ghost"
              size="icon"
              onClick={isRecording ? onStopRecording : onStartRecording}
              className={`w-12 h-12 rounded-full transition-all border ${isRecording ? "bg-red-500/20 border-red-500/50 text-red-400 animate-pulse" : "bg-white/5 border-white/10 text-white"}`}
            >
              {isRecording ? <CircleStop className="w-5 h-5" /> : <CircleDot className="w-5 h-5" />}
            </Button>
          )}
        </div>

        {/* Mobile 'More' Menu */}
        <div className="lg:hidden relative">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowLayoutMenu(!showLayoutMenu)}
            className="w-10 h-10 rounded-full bg-white/5 border border-white/10 text-white"
          >
            <MoreVertical className="w-5 h-5" />
          </Button>
          
          <AnimatePresence>
            {showLayoutMenu && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute bottom-16 right-0 w-48 bg-zinc-900/95 border border-white/10 backdrop-blur-xl rounded-2xl p-2 shadow-2xl z-50 overflow-hidden"
              >
                <button onClick={() => { setShowCaptions(!showCaptions); setShowLayoutMenu(false); }} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs text-white/70 hover:bg-white/5">
                  <Captions className="w-4 h-4" /> {showCaptions ? "Hide" : "Show"} Captions
                </button>
                <button onClick={() => { setIsBlurred(!isBlurred); setShowLayoutMenu(false); }} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs text-white/70 hover:bg-white/5">
                  <Sparkles className="w-4 h-4" /> {isBlurred ? "Disable" : "Enable"} Blur
                </button>
                <button onClick={() => { setShowReactions(true); setShowLayoutMenu(false); }} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs text-white/70 hover:bg-white/5">
                  <Smile className="w-4 h-4" /> Send Reaction
                </button>
                <button onClick={() => { setChatOpen(true); setShowLayoutMenu(false); }} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs text-white/70 hover:bg-white/5 border-t border-white/5 mt-1 pt-3">
                  <MessageSquare className="w-4 h-4" /> Open Chat
                </button>
                <button onClick={() => { setParticipantsSidebarOpen(true); setShowLayoutMenu(false); }} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs text-white/70 hover:bg-white/5">
                  <Users className="w-4 h-4" /> Participants
                </button>
                <button onClick={() => { setInteractionsOpen(true); setShowLayoutMenu(false); }} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs text-white/70 hover:bg-white/5">
                  <HelpCircle className="w-4 h-4" /> Activities
                </button>
                <button onClick={() => { setInviteOpen(true); setShowLayoutMenu(false); }} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs text-white/70 hover:bg-white/5 border-t border-white/5 mt-1 pt-3">
                  <UserPlus className="w-4 h-4" /> Invite People
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="mx-1 md:mx-2" />

        <Button
          onClick={() => router.push("/dashboard")}
          className="w-12 md:w-16 h-10 rounded-full bg-red-500 hover:bg-red-600 text-white transition-all shadow-lg shadow-red-500/20 flex items-center justify-center shrink-0"
        >
          <LogOut className="w-5 h-5" />
        </Button>
      </div>

      {/* Right side - Google Meet style actions */}
      <div className="hidden md:flex items-center gap-2 w-1/4 justify-end">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setInviteOpen(true)}
                className="w-12 h-12 rounded-full bg-white/5 hover:bg-white/10 text-white/70 hover:text-white"
              >
                <UserPlus className="w-5 h-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Invite People</TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setParticipantsSidebarOpen(!participantsSidebarOpen)}
                className={`w-12 h-12 rounded-full transition-all ${
                  participantsSidebarOpen 
                    ? "bg-primary/20 text-primary" 
                    : "bg-white/5 hover:bg-white/10 text-white/70 hover:text-white"
                }`}
              >
                <Users className="w-5 h-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Participants</TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setInteractionsOpen(!interactionsOpen)}
                className={`w-12 h-12 rounded-full transition-all ${
                  interactionsOpen 
                    ? "bg-primary/20 text-primary" 
                    : "bg-white/5 hover:bg-white/10 text-white/70 hover:text-white"
                }`}
              >
                <HelpCircle className="w-5 h-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Activities (Polls & Q&A)</TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setChatOpen(!chatOpen)}
                className={`relative w-12 h-12 rounded-full transition-all ${
                  chatOpen 
                    ? "bg-primary/20 text-primary" 
                    : "bg-white/5 hover:bg-white/10 text-white/70 hover:text-white"
                }`}
              >
                <MessageSquare className="w-5 h-5" />
                {unreadChat > 0 && !chatOpen && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-primary text-[10px] font-bold text-primary-foreground flex items-center justify-center animate-bounce">
                    {unreadChat > 9 ? "9+" : unreadChat}
                  </span>
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>Chat</TooltipContent>
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
  useEffect(() => {
    if (room) {
      room.localParticipant.setMetadata(JSON.stringify({ handRaised: isHandRaised }));
    }
  }, [isHandRaised, room]);
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
    <LiveKitRoom
      video={true}
      audio={true}
      token={token}
      serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL}
      data-lk-theme="default"
      onDisconnected={() => router.push("/dashboard")}
      className="h-screen bg-[#050505]"
    >
      <div className="relative h-screen flex flex-col">
        {/* ── Header ── */}
        <div className="absolute top-0 left-0 right-0 z-50 p-6 flex items-center justify-between pointer-events-none">
          {/* Room Info */}
          <div className="flex items-center gap-4 pointer-events-auto">
            <div className="bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl p-4 flex items-center gap-4 shadow-2xl">
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
                <Circle className="w-4 h-4 fill-primary-foreground text-primary-foreground animate-pulse" />
              </div>
              <div>
                <h3 className="text-white font-bold text-sm leading-none mb-1 uppercase tracking-widest">
                  Live Session
                </h3>
                <p className="text-muted-foreground text-xs font-mono">{roomId}</p>
              </div>
              <div className="h-8 w-px bg-white/10 mx-2" />
              <SessionTimer />
            </div>
            {isRecording && (
              <Badge className="bg-red-500/10 text-red-400 border-red-500/20 px-3 py-1 rounded-full animate-pulse flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                REC
              </Badge>
            )}
          </div>

          {/* Right Actions - Moved to bottom bar */}
          <div className="flex items-center gap-3 pointer-events-auto invisible md:visible">
            {/* Empty space to keep layout balanced if needed, or just remove */}
          </div>
        </div>

        {/* ── Video Grid ── */}
        <div className={`flex-1 flex items-center justify-center p-2 md:p-4 pt-16 md:pt-20 pb-4 transition-all duration-300 ${participantsSidebarOpen || chatOpen || interactionsOpen ? 'lg:mr-96' : ''}`}>
          <MeetingGrid layout={layout} />
          
          {/* Live Captions Overlay */}
          <AnimatePresence>
            {showCaptions && captions.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="absolute bottom-32 left-1/2 -translate-x-1/2 w-full max-w-2xl px-6 pointer-events-none z-40"
              >
                <div className="bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl">
                  <div className="space-y-3">
                    {captions.map((cap) => (
                      <motion.div 
                        key={cap.id} 
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex gap-3"
                      >
                        <span className="text-primary font-bold text-xs uppercase min-w-[60px]">{cap.user}</span>
                        <p className="text-white/90 text-sm leading-relaxed font-outfit">{cap.text}</p>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Control Dock ── */}
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
        />

        <RoomAudioRenderer />

        {/* ── Invite Dialog ── */}
        <InviteDialog
          open={inviteOpen}
          onClose={() => setInviteOpen(false)}
          roomId={roomId as string}
        />

        {/* ── Sidebars ── */}
        <ParticipantsSidebar
          open={participantsSidebarOpen}
          onClose={() => setParticipantsSidebarOpen(false)}
          roomId={roomId as string}
        />

        <ChatSidebar 
          open={chatOpen}
          onClose={() => setChatOpen(false)}
          onUnreadChange={setUnreadChat}
        />

        <InteractionsSidebar
          open={interactionsOpen}
          onClose={() => setInteractionsOpen(false)}
        />

        <ReactionOverlay />
        <BlurManager isBlurred={isBlurred} />
        <HandStatusManager isHandRaised={isHandRaised} />
        <ParticipantEventNotifier />
      </div>
    </LiveKitRoom>
  );
}
