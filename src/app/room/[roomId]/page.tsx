"use client";

import { useEffect, useState, useRef } from "react";
import {
  LiveKitRoom,
  RoomAudioRenderer,
  TrackToggle,
  useLocalParticipant,
  useRoomContext,
  useChat,
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
  X,
  AlertCircle,
  Power
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
  DialogFooter
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

// ─── Recording Indicator ──────────────────────────────────────────────────────
function RecordingIndicator({ isRecording }: { isRecording: boolean }) {
  return (
    <AnimatePresence>
      {isRecording && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="fixed top-6 left-1/2 -translate-x-1/2 z-[60] pointer-events-none"
        >
          <div className="flex items-center gap-3 px-4 py-2 rounded-full bg-red-500/10 backdrop-blur-xl border border-red-500/30 shadow-[0_0_20px_rgba(239,68,68,0.2)]">
            <div className="relative">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
              <div className="absolute inset-0 w-2.5 h-2.5 rounded-full bg-red-500 animate-ping opacity-75" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-red-500">Recording is Live</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

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

// ─── Data & Metadata Listener ──────────────────────────────────────────────────
function RoomEventsListener({ onRecordingChange }: { onRecordingChange: (rec: boolean) => void }) {
  const room = useRoomContext();
  
  useEffect(() => {
    if (!room) return;

    // Handle Data (Reactions)
    const handleData = (payload: Uint8Array, participant: any) => {
      try {
        const str = new TextDecoder().decode(payload);
        const data = JSON.parse(str);
        
        if (data.type === "reaction") {
          window.dispatchEvent(new CustomEvent("remote-reaction", { 
            detail: { emoji: data.emoji, identity: participant.identity } 
          }));
        }
      } catch (e) {
        console.error("Error parsing room data:", e);
      }
    };

    // Handle Metadata (Recording sync)
    const handleMetadata = (metadata: string | undefined) => {
      if (!metadata) return;
      try {
        const data = JSON.parse(metadata);
        if (typeof data.isRecording === "boolean") {
          onRecordingChange(data.isRecording);
        }
      } catch (e) {
        console.error("Error parsing room metadata:", e);
      }
    };

    // Initial check
    handleMetadata(room.metadata);

    room.on(RoomEvent.DataReceived, handleData);
    room.on(RoomEvent.RoomMetadataChanged, handleMetadata);
    
    return () => {
      room.off(RoomEvent.DataReceived, handleData);
      room.off(RoomEvent.RoomMetadataChanged, handleMetadata);
    };
  }, [room, onRecordingChange]);

  return null;
}

// ─── Control Dock ─────────────────────────────────────────────────────────────
function CustomControlDock({
  isRecording,
  onToggleRecording,
  setInviteOpen,
  setParticipantsSidebarOpen,
  participantsSidebarOpen,
  chatOpen,
  setChatOpen,
  isHandRaised,
  toggleHand,
  layout,
  setLayout,
  interactionsOpen,
  setInteractionsOpen,
  isAdmin,
  unreadChat,
  lastMessage,
  setLeaveOpen,
}: any) {
  const room = useRoomContext();
  const { isMicrophoneEnabled, isCameraEnabled, isScreenShareEnabled } =
    useLocalParticipant();

  const sendReaction = async (emoji: string) => {
    if (!room) return;
    const encoder = new TextEncoder();
    const data = encoder.encode(JSON.stringify({ type: "reaction", emoji }));
    await room.localParticipant.publishData(data, { reliable: true });
    window.dispatchEvent(new CustomEvent("remote-reaction", { 
      detail: { emoji, identity: room.localParticipant.identity } 
    }));
  };

  return (
    <div className="w-full px-4 md:px-6 py-4 bg-zinc-950/90 backdrop-blur-3xl border-t border-white/5 relative flex items-center justify-between">
      {/* Session Info - Left Wing */}
      <div className="flex-1 flex items-center gap-3 md:gap-6">
        <div className="flex flex-col">
          <span className="hidden md:block text-[10px] font-bold uppercase tracking-widest text-primary mb-1 text-glow">Live Academy Session</span>
          <SessionTimer />
        </div>
      </div>

      {/* Main Controls - Dead Center */}
      <div className="flex items-center gap-1 md:gap-3 bg-white/5 p-1 md:p-1.5 rounded-2xl md:rounded-3xl border border-white/5 shadow-2xl relative z-10">
        <TooltipProvider>
          <TrackToggle source={Track.Source.Microphone} showIcon={false} className={cn(
            "flex items-center justify-center w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl transition-all border duration-300",
            !isMicrophoneEnabled ? "bg-red-500/20 border-red-500/50 text-red-500" : "bg-transparent border-transparent hover:bg-white/5 text-white"
          )}>
            {isMicrophoneEnabled ? <Mic className="w-4 h-4 md:w-5 md:h-5" /> : <MicOff className="w-4 h-4 md:w-5 md:h-5" />}
          </TrackToggle>

          <TrackToggle source={Track.Source.Camera} showIcon={false} className={cn(
            "flex items-center justify-center w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl transition-all border duration-300",
            !isCameraEnabled ? "bg-red-500/20 border-red-500/50 text-red-500" : "bg-transparent border-transparent hover:bg-white/5 text-white"
          )}>
            {isCameraEnabled ? <Video className="w-4 h-4 md:w-5 md:h-5" /> : <VideoOff className="w-4 h-4 md:w-5 md:h-5" />}
          </TrackToggle>

          {/* Reactions */}
          <DropdownMenu>
            <DropdownMenuTrigger>
              <Button variant="ghost" className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-transparent border-transparent text-white hover:bg-white/5">
                <Smile className="w-4 h-4 md:w-5 md:h-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="glass border-white/10 p-2 mb-4 grid grid-cols-3 gap-1">
              {["💖", "👍", "👏", "🎉", "😂", "😮"].map(emoji => (
                <button key={emoji} onClick={() => sendReaction(emoji)} className="w-10 h-10 text-xl hover:bg-white/5 rounded-lg flex items-center justify-center">{emoji}</button>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Mobile "More" Toggle */}
          <div className="sm:hidden">
            <DropdownMenu>
              <DropdownMenuTrigger>
                <Button variant="ghost" className="w-10 h-10 rounded-xl bg-white/5 border-white/10 text-white">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="glass border-white/10 p-2 mb-4 min-w-[200px] space-y-1">
                <DropdownMenuItem onClick={() => setInviteOpen(true)} className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 text-white cursor-pointer">
                  <UserPlus className="w-4 h-4 text-primary" />
                  <span className="font-medium">Invite Others</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setChatOpen(true)} className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 text-white cursor-pointer">
                  <MessageSquare className="w-4 h-4 text-primary" />
                  <span className="font-medium">Open Chat</span>
                  {unreadChat > 0 && <div className="ml-auto w-2 h-2 bg-primary rounded-full" />}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setParticipantsSidebarOpen(true)} className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 text-white cursor-pointer">
                  <Users className="w-4 h-4 text-primary" />
                  <span className="font-medium">Participants</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={toggleHand} className={cn("flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 text-white cursor-pointer", isHandRaised && "bg-amber-500/10")}>
                  <Hand className={cn("w-4 h-4", isHandRaised ? "text-amber-500" : "text-primary")} />
                  <span className="font-medium">{isHandRaised ? "Lower Hand" : "Raise Hand"}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <Separator orientation="vertical" className="h-6 md:h-8 bg-white/10 mx-0.5 md:mx-1" />

          {/* Tablet + Desktop Extra Controls */}
          <div className="hidden sm:flex items-center gap-1 md:gap-3">
            <Button variant="ghost" onClick={toggleHand} className={cn(
              "w-11 h-11 md:w-12 md:h-12 rounded-xl md:rounded-2xl transition-all border duration-300",
              isHandRaised ? "bg-amber-500/20 border-amber-500/50 text-amber-500" : "bg-transparent border-transparent text-white hover:bg-white/5"
            )}>
              <Hand className="w-5 h-5" />
            </Button>

            <Button variant="ghost" onClick={() => setInviteOpen(true)} className="w-11 h-11 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-transparent border-transparent text-white hover:bg-white/5">
              <UserPlus className="w-5 h-5" />
            </Button>

            <TrackToggle source={Track.Source.ScreenShare} showIcon={false} className={cn(
              "items-center justify-center w-11 h-11 md:w-12 md:h-12 rounded-xl md:rounded-2xl transition-all border duration-300",
              isScreenShareEnabled ? "bg-primary/20 border-primary text-primary shadow-lg shadow-primary/10" : "bg-transparent border-transparent text-white hover:bg-white/5"
            )}>
              <MonitorUp className="w-5 h-5" />
            </TrackToggle>

            {isAdmin && (
              <Button variant="ghost" onClick={onToggleRecording} className={cn(
                "w-11 h-11 md:w-12 md:h-12 rounded-xl md:rounded-2xl transition-all border duration-300",
                isRecording ? "bg-red-500/20 border-red-500 text-red-500" : "bg-transparent border-transparent text-white hover:bg-white/5"
              )}>
                {isRecording ? <CircleStop className="w-5 h-5" /> : <CircleDot className="w-5 h-5" />}
              </Button>
            )}
          </div>

          <Button variant="destructive" onClick={() => setLeaveOpen(true)} className="w-12 md:w-14 h-10 md:h-12 rounded-xl md:rounded-2xl bg-red-500 hover:bg-red-600 shadow-xl shadow-red-500/20 transition-all active:scale-95">
            <LogOut className="w-4 h-4 md:w-5 md:h-5" />
          </Button>
        </TooltipProvider>
      </div>

      {/* Sidebars Controls - Right Wing (Desktop Only) */}
      <div className="flex-1 hidden sm:flex items-center justify-end gap-1.5 md:gap-2 relative">
        <Button variant="ghost" onClick={() => setParticipantsSidebarOpen(!participantsSidebarOpen)} className={cn(
          "w-11 h-11 md:w-12 md:h-12 rounded-xl border transition-all duration-300",
          participantsSidebarOpen ? "bg-primary/20 border-primary/50 text-primary" : "bg-transparent border-transparent text-white/60 hover:text-white"
        )}>
          <Users className="w-5 h-5" />
        </Button>

        {/* Chat Button with Floating Preview */}
        <div className="relative">
          <AnimatePresence>
            {!chatOpen && lastMessage && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.8 }}
                animate={{ opacity: 1, y: -65, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.8 }}
                className="absolute left-1/2 -translate-x-1/2 w-48 bg-zinc-900 border border-white/10 rounded-2xl p-3 shadow-2xl z-50 pointer-events-none"
              >
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-bold text-primary uppercase tracking-tighter truncate">
                    {lastMessage.from?.name || lastMessage.from?.identity || "Someone"}
                  </span>
                  <p className="text-[11px] text-white/80 line-clamp-2 leading-tight">
                    {lastMessage.message}
                  </p>
                </div>
                <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-zinc-900 border-r border-b border-white/10 rotate-45" />
              </motion.div>
            )}
          </AnimatePresence>

          <Button variant="ghost" onClick={() => setChatOpen(!chatOpen)} className={cn(
            "relative w-11 h-11 md:w-12 md:h-12 rounded-xl border transition-all duration-300",
            chatOpen ? "bg-primary/20 border-primary/50 text-primary" : "bg-transparent border-transparent text-white/60 hover:text-white",
            unreadChat > 0 && !chatOpen && "animate-pulse shadow-[0_0_15px_rgba(59,130,246,0.3)] border-primary/30"
          )}>
            <MessageSquare className="w-5 h-5" />
            {unreadChat > 0 && (
              <div className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-white shadow-lg">
                {unreadChat}
              </div>
            )}
          </Button>
        </div>

        <Button variant="ghost" onClick={() => setInteractionsOpen(!interactionsOpen)} className={cn(
          "w-11 h-11 md:w-12 md:h-12 rounded-xl border transition-all duration-300",
          interactionsOpen ? "bg-primary/20 border-primary/50 text-primary" : "bg-transparent border-transparent text-white/60 hover:text-white"
        )}>
          <HelpCircle className="w-4 h-4 md:w-5 md:h-5" />
        </Button>
      </div>
    </div>
  );
}

// ─── Guest Name Dialog ────────────────────────────────────────────────────────
function GuestNameDialog({ open, onJoin }: { open: boolean; onJoin: (name: string) => void }) {
  const [name, setName] = useState("");
  return (
    <Dialog open={open}>
      <DialogContent className="bg-zinc-950 border-white/10 rounded-[2.5rem] p-8 max-w-md w-[90%]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-white text-center">Join Session</DialogTitle>
          <DialogDescription className="text-zinc-400 text-center">Please enter your name to join the cohort.</DialogDescription>
        </DialogHeader>
        <div className="space-y-6 mt-4">
          <Input 
            value={name} 
            onChange={(e) => setName(e.target.value)} 
            placeholder="Your Display Name" 
            className="bg-white/5 border-white/10 text-white rounded-xl h-12 text-center" 
          />
          <Button 
            disabled={!name.trim()} 
            onClick={() => onJoin(name)} 
            className="w-full bg-primary hover:bg-primary/90 h-12 rounded-xl font-bold text-lg shadow-xl shadow-primary/20 transition-all active:scale-95"
          >
            Enter Meeting Room
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Leave Meeting Dialog ─────────────────────────────────────────────────────
function LeaveMeetingDialog({ open, onOpenChange, onLeave, onEndForAll, isAdmin }: any) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-zinc-950 border-white/10 rounded-[2.5rem] p-8 max-w-md w-[95%]">
        <DialogHeader className="flex flex-col items-center text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center border border-red-500/20">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <DialogTitle className="text-2xl font-bold text-white tracking-tight">Ready to leave?</DialogTitle>
          <DialogDescription className="text-zinc-400 text-balance">
            Select how you would like to exit this leadership session.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-3 mt-8">
          <Button 
            variant="ghost" 
            onClick={onLeave}
            className="w-full h-14 rounded-2xl bg-white/5 hover:bg-white/10 text-white font-bold border border-white/5 flex items-center justify-between px-6"
          >
            <div className="flex items-center gap-4">
              <LogOut className="w-5 h-5 text-zinc-400" />
              <div className="text-left">
                <p className="text-sm">Leave Meeting</p>
                <p className="text-[10px] text-zinc-500 font-medium">Others will continue the session</p>
              </div>
            </div>
          </Button>

          {isAdmin && (
            <Button 
              onClick={onEndForAll}
              className="w-full h-14 rounded-2xl bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white font-bold border border-red-500/20 hover:border-red-500 flex items-center justify-between px-6 transition-all group"
            >
              <div className="flex items-center gap-4">
                <Power className="w-5 h-5 text-red-500 group-hover:text-white" />
                <div className="text-left">
                  <p className="text-sm">End Meeting for All</p>
                  <p className="text-[10px] opacity-60 font-medium">Conclude session for the entire cohort</p>
                </div>
              </div>
            </Button>
          )}
        </div>

        <DialogFooter className="mt-4">
          <Button variant="ghost" onClick={() => onOpenChange(false)} className="w-full h-12 text-zinc-500 hover:text-white hover:bg-transparent font-bold">
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
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
  const router = useRouter();
  const { roomId } = useParams();
  const { user, isAdmin: firebaseAdmin, loading: authLoading } = useAuth();
  const [token, setToken] = useState("");
  const [guestName, setGuestName] = useState("");
  const [showNameEntry, setShowNameEntry] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [leaveOpen, setLeaveOpen] = useState(false);
  const [participantsSidebarOpen, setParticipantsSidebarOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [interactionsOpen, setInteractionsOpen] = useState(false);
  const [isHandRaised, setIsHandRaised] = useState(false);
  const [layout, setLayout] = useState<"tiled" | "spotlight" | "sidebar">("tiled");
  const [unreadChat, setUnreadChat] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [lastMessage, setLastMessage] = useState<any>(null);
  const [meetingTitle, setMeetingTitle] = useState("");

  useEffect(() => {
    const fetchSessionInfo = async () => {
      try {
        const res = await fetch("/api/sessions");
        const data = await res.json();
        if (data.sessions) {
          const session = data.sessions.find((s: any) => s.roomId === roomId);
          if (session) setMeetingTitle(session.title);
        }
      } catch (err) {
        console.error("Failed to fetch session title:", err);
      }
    };
    if (roomId) fetchSessionInfo();
  }, [roomId]);

  useEffect(() => {
    if (authLoading) return;
    if (!user && !guestName) {
      setShowNameEntry(true);
      return;
    }
    
    const fetchToken = async () => {
      try {
        const idToken = user ? await user.getIdToken() : null;
        const displayName = user?.displayName || user?.email || guestName;
        const url = `/api/livekit?room=${roomId}&username=${encodeURIComponent(displayName)}`;
        
        const res = await fetch(url, {
          headers: idToken ? { 'Authorization': `Bearer ${idToken}` } : {}
        });
        
        const data = await res.json();
        if (data.token) {
          setToken(data.token);
          setShowNameEntry(false);
        } else {
          toast.error(data.error || "Failed to generate token.");
        }
      } catch (err) {
        console.error("Connection error:", err);
        toast.error("Failed to connect to room.");
      }
    };
    
    if (roomId) fetchToken();
  }, [user, guestName, roomId, authLoading]);

  // Reset unread when chat opens
  useEffect(() => {
    if (chatOpen) {
      setUnreadChat(0);
      setLastMessage(null);
    }
  }, [chatOpen]);

  const handleEndForAll = async () => {
    try {
      const idToken = await user?.getIdToken();
      const res = await fetch("/api/livekit/admin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${idToken}`
        },
        body: JSON.stringify({
          action: "deleteRoom",
          roomName: roomId
        })
      });
      
      if (res.ok) {
        toast.success("Meeting ended for all.");
        router.push("/dashboard");
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to end meeting.");
      }
    } catch (error) {
      toast.error("An error occurred while ending the meeting.");
    }
  };

  if (!token) return (
    <div className="h-screen w-full bg-black flex flex-col items-center justify-center gap-6">
      <GuestNameDialog open={showNameEntry} onJoin={(name) => setGuestName(name)} />
      {!showNameEntry && (
        <>
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin shadow-[0_0_20px_rgba(59,130,246,0.3)]" />
          <p className="text-zinc-500 font-medium animate-pulse tracking-widest uppercase text-xs">Establishing Secure Connection...</p>
        </>
      )}
    </div>
  );

  // Request notification permission for background alerts
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  return (
    <div className="h-screen w-full bg-zinc-950 flex flex-col overflow-hidden relative">
      <LiveKitRoom
        token={token}
        serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL}
        connect={true}
        options={{
          publishDefaults: {
            videoCodec: 'h264',
          },
          adaptiveStream: true,
          dynacast: true,
        }}
        className="flex-1 flex flex-col min-h-0"
        onDisconnected={() => {
          toast.info("Disconnected from meeting.");
          router.push(user ? "/dashboard" : "/login");
        }}
      >
        <RoomContent 
          user={user}
          roomId={roomId as string}
          firebaseAdmin={firebaseAdmin}
          isRecording={isRecording}
          setIsRecording={setIsRecording}
          meetingTitle={meetingTitle}
          layout={layout}
          setLayout={setLayout}
          chatOpen={chatOpen}
          setChatOpen={setChatOpen}
          participantsSidebarOpen={participantsSidebarOpen}
          setParticipantsSidebarOpen={setParticipantsSidebarOpen}
          interactionsOpen={interactionsOpen}
          setInteractionsOpen={setInteractionsOpen}
          unreadChat={unreadChat}
          setUnreadChat={setUnreadChat}
          lastMessage={lastMessage}
          setLastMessage={setLastMessage}
          isHandRaised={isHandRaised}
          setIsHandRaised={setIsHandRaised}
          inviteOpen={inviteOpen}
          setInviteOpen={setInviteOpen}
          leaveOpen={leaveOpen}
          setLeaveOpen={setLeaveOpen}
          handleEndForAll={handleEndForAll}
        />
      </LiveKitRoom>
    </div>
  );
}

// ─── Room Content Component (Inside LiveKit Context) ──────────────────────────
function RoomContent({ 
  user, roomId, firebaseAdmin, isRecording, setIsRecording, meetingTitle,
  layout, setLayout, chatOpen, setChatOpen, participantsSidebarOpen, setParticipantsSidebarOpen,
  interactionsOpen, setInteractionsOpen, unreadChat, setUnreadChat, lastMessage, setLastMessage,
  isHandRaised, setIsHandRaised, inviteOpen, setInviteOpen, leaveOpen, setLeaveOpen, handleEndForAll
}: any) {
  const { localParticipant } = useLocalParticipant();
  const [isAdmin, setIsAdmin] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const meta = localParticipant.metadata ? JSON.parse(localParticipant.metadata) : {};
    setIsAdmin(firebaseAdmin || meta.role === "admin");
  }, [firebaseAdmin, localParticipant.metadata]);

  return (
    <>
      <RecordingIndicator isRecording={isRecording} />
      <RoomEventsListener onRecordingChange={setIsRecording} />
      
      {/* Main Interaction Area */}
      <div className="flex-1 flex overflow-hidden relative">
        <div className="flex-1 flex flex-col min-w-0">
          <MeetingGrid layout={layout} />
        </div>

        {/* Persistent Sidebar Container */}
        <div className={cn(
          "fixed md:relative right-0 top-0 bottom-0 w-full md:w-96 bg-zinc-950 border-l border-white/5 h-full z-[100] flex flex-col shadow-2xl transition-transform duration-300 ease-in-out",
          (participantsSidebarOpen || chatOpen || interactionsOpen) ? "translate-x-0" : "translate-x-full md:hidden"
        )}>
          <div className={cn("h-full", !participantsSidebarOpen && "hidden")}>
            <ParticipantsSidebar 
              onClose={() => setParticipantsSidebarOpen(false)} 
              roomId={roomId} 
              isAdmin={isAdmin}
            />
          </div>
          
          <div className={cn("h-full", !chatOpen && "hidden")}>
            <ChatSidebarWrapper 
              onNewMessage={(msg) => {
                if (!chatOpen) {
                  setUnreadChat((prev: number) => prev + 1);
                  setLastMessage(msg);
                  setTimeout(() => setLastMessage(null), 5000);
                }
              }}
              onClose={() => setChatOpen(false)} 
            />
          </div>
          
          <div className={cn("h-full", !interactionsOpen && "hidden")}>
            <InteractionsSidebar onClose={() => setInteractionsOpen(false)} />
          </div>
        </div>
      </div>

      {/* Control Footer */}
      <div className="relative">
        <RoomContextWrapper 
          user={user}
          roomId={roomId}
          meetingTitle={meetingTitle}
          isAdmin={isAdmin}
          isRecording={isRecording}
          onToggleRecording={(rec: boolean) => setIsRecording(rec)}
          setInviteOpen={setInviteOpen}
          setLeaveOpen={setLeaveOpen}
          participantsSidebarOpen={participantsSidebarOpen}
          setParticipantsSidebarOpen={setParticipantsSidebarOpen}
          chatOpen={chatOpen}
          setChatOpen={setChatOpen}
          interactionsOpen={interactionsOpen}
          setInteractionsOpen={setInteractionsOpen}
          unreadChat={unreadChat}
          isHandRaised={isHandRaised}
          setIsHandRaised={setIsHandRaised}
          layout={layout}
          setLayout={setLayout}
          lastMessage={lastMessage}
        />
      </div>

      <InviteDialog open={inviteOpen} onClose={() => setInviteOpen(false)} roomId={roomId} />
      
      <LeaveMeetingDialog 
        open={leaveOpen} 
        onOpenChange={setLeaveOpen}
        onLeave={() => router.push(user ? "/dashboard" : "/login")}
        onEndForAll={handleEndForAll}
        isAdmin={isAdmin}
      />

      <RoomAudioRenderer />
    </>
  );
}
function ChatSidebarWrapper({ onNewMessage, onClose }: { onNewMessage: (msg: any) => void; onClose: () => void }) {
  const { chatMessages } = useChat();
  const prevCountRef = useRef(0);

  useEffect(() => {
    const currentCount = chatMessages.length;
    if (currentCount > prevCountRef.current) {
      const newMsgs = chatMessages.slice(prevCountRef.current);
      newMsgs.forEach(msg => {
        onNewMessage(msg);
        
        // Show notification if app is in background
        if (document.visibilityState === "hidden" && Notification.permission === "granted") {
          new Notification(`New message from ${msg.from?.name || msg.from?.identity || "Someone"}`, {
            body: msg.message,
            icon: "/icons/icon-192x192.png",
          });
        }
      });
    }
    prevCountRef.current = currentCount;
  }, [chatMessages, onNewMessage]);

  return <ChatSidebar onClose={onClose} />;
}

// ─── Room Context Wrapper ──────────────────────────────────────────────────────
function RoomContextWrapper({ 
  user,
  roomId,
  meetingTitle,
  isAdmin, 
  isRecording, 
  onToggleRecording, 
  setInviteOpen,
  setLeaveOpen,
  participantsSidebarOpen,
  setParticipantsSidebarOpen,
  chatOpen,
  setChatOpen,
  interactionsOpen,
  setInteractionsOpen,
  unreadChat,
  isHandRaised,
  setIsHandRaised,
  layout,
  setLayout,
  lastMessage
}: any) {
  const room = useRoomContext();
  
  const handleToggleHand = async () => {
    if (!room) return;
    const newState = !isHandRaised;
    setIsHandRaised(newState);
    
    // Sync to LiveKit server metadata
    await room.localParticipant.setMetadata(JSON.stringify({ handRaised: newState }));
    
    if (newState) {
      toast.success("Hand raised");
    }
  };

  const handleToggleRecording = async () => {
    if (!room) return;
    const newState = !isRecording;
    
    try {
      const idToken = await user?.getIdToken();
      
      // 0. Ensure meetingTitle is available (fallback fetch)
      let activeTitle = meetingTitle;
      if (!activeTitle) {
        try {
          const sRes = await fetch("/api/sessions");
          const sData = await sRes.json();
          const session = sData.sessions?.find((s: any) => s.roomId === roomId);
          if (session) activeTitle = session.title;
        } catch (e) {
          console.error("Fallback title fetch failed:", e);
        }
      }

      // 1. If starting, call the recording API first to get egressId
      let currentEgressId = null;
      if (newState) {
        const recRes = await fetch("/api/recording", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            action: "start", 
            roomName: roomId,
            meetingTitle: activeTitle // Use the fetched title
          })
        });
        const recData = await recRes.json();
        if (!recRes.ok) throw new Error(recData.error || "Failed to start recording");
        currentEgressId = recData.egressId;
      } else {
        // If stopping, get egressId from room metadata
        try {
          const roomMeta = room.metadata ? JSON.parse(room.metadata) : {};
          currentEgressId = roomMeta.egressId;
        } catch (e) {
          console.error("Failed to parse room metadata for egressId:", e);
        }

        if (currentEgressId) {
          const stopRes = await fetch("/api/recording", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "stop", egressId: currentEgressId })
          });
          if (!stopRes.ok) {
            const stopData = await stopRes.json();
            console.error("Stop recording failed:", stopData.error);
          }
        }
      }

      // 2. Sync to Room Metadata for all participants (visual state + egressId)
      const res = await fetch("/api/livekit/admin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${idToken}`
        },
        body: JSON.stringify({
          action: "updateRoom",
          roomName: roomId,
          metadata: JSON.stringify({ 
            isRecording: newState,
            egressId: newState ? currentEgressId : null
          })
        })
      });

      if (res.ok) {
        onToggleRecording(newState);
        if (newState) {
          toast.success("Recording started and saving to cloud");
        } else {
          toast.info("Recording stopped and finalizing");
        }
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to update recording status");
      }
    } catch (error: any) {
      console.error("Failed to toggle recording:", error);
      toast.error(error.message || "Failed to update recording status");
    }
  };

  return (
    <CustomControlDock
      isRecording={isRecording}
      onToggleRecording={handleToggleRecording}
      setInviteOpen={setInviteOpen}
      setLeaveOpen={setLeaveOpen}
      setParticipantsSidebarOpen={setParticipantsSidebarOpen}
      participantsSidebarOpen={participantsSidebarOpen}
      chatOpen={chatOpen}
      setChatOpen={setChatOpen}
      isHandRaised={isHandRaised}
      toggleHand={handleToggleHand}
      layout={layout}
      setLayout={setLayout}
      interactionsOpen={interactionsOpen}
      setInteractionsOpen={setInteractionsOpen}
      isAdmin={isAdmin}
      unreadChat={unreadChat}
      lastMessage={lastMessage}
    />
  );
}
