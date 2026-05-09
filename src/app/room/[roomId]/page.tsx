"use client";

import { useEffect, useState } from "react";
import {
  LiveKitRoom,
  VideoConference,
  RoomAudioRenderer,
  TrackToggle,
  useLocalParticipant,
} from "@livekit/components-react";
import "@livekit/components-styles";
import { Track } from "livekit-client";
import { useAuth } from "@/context/AuthContext";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
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
  UserPlus,
  Copy,
  Check,
  Mail,
  Link2,
  CircleDot,
  CircleStop,
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
function CustomControlDock({
  isRecording,
  onStartRecording,
  onStopRecording,
}: {
  isRecording: boolean;
  onStartRecording: () => void;
  onStopRecording: () => void;
}) {
  const router = useRouter();
  const { isMicrophoneEnabled, isCameraEnabled, isScreenShareEnabled } =
    useLocalParticipant();

  return (
    <div className="absolute bottom-0 left-0 right-0 z-50 p-8 flex items-center justify-center pointer-events-none">
      <div className="flex items-center gap-4 p-4 rounded-[2.5rem] bg-black/60 backdrop-blur-3xl border border-white/10 shadow-2xl pointer-events-auto">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <TrackToggle source={Track.Source.Microphone} showIcon={false}>
                <Button
                  variant="ghost"
                  size="icon"
                  className={`w-14 h-14 rounded-full transition-all ${
                    !isMicrophoneEnabled
                      ? "bg-red-500/20 text-red-500 hover:bg-red-500/30"
                      : "bg-white/5 hover:bg-white/10 text-white"
                  }`}
                >
                  {isMicrophoneEnabled ? (
                    <Mic className="w-6 h-6" />
                  ) : (
                    <MicOff className="w-6 h-6" />
                  )}
                </Button>
              </TrackToggle>
            </TooltipTrigger>
            <TooltipContent>
              {isMicrophoneEnabled ? "Mute Mic" : "Unmute Mic"}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <TrackToggle source={Track.Source.Camera} showIcon={false}>
                <Button
                  variant="ghost"
                  size="icon"
                  className={`w-14 h-14 rounded-full transition-all ${
                    !isCameraEnabled
                      ? "bg-red-500/20 text-red-500 hover:bg-red-500/30"
                      : "bg-white/5 hover:bg-white/10 text-white"
                  }`}
                >
                  {isCameraEnabled ? (
                    <Video className="w-6 h-6" />
                  ) : (
                    <VideoOff className="w-6 h-6" />
                  )}
                </Button>
              </TrackToggle>
            </TooltipTrigger>
            <TooltipContent>
              {isCameraEnabled ? "Stop Video" : "Start Video"}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <div className="h-10 w-px bg-white/10 mx-2" />

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <TrackToggle source={Track.Source.ScreenShare} showIcon={false}>
                <Button
                  variant="ghost"
                  size="icon"
                  className={`w-14 h-14 rounded-full transition-all ${
                    isScreenShareEnabled
                      ? "bg-primary/20 text-primary hover:bg-primary/30"
                      : "bg-white/5 hover:bg-white/10 text-white"
                  }`}
                >
                  <MonitorUp className="w-6 h-6" />
                </Button>
              </TrackToggle>
            </TooltipTrigger>
            <TooltipContent>Share Screen</TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {/* Record Button */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <Button
                variant="ghost"
                size="icon"
                onClick={isRecording ? onStopRecording : onStartRecording}
                className={`w-14 h-14 rounded-full transition-all ${
                  isRecording
                    ? "bg-red-500/20 text-red-400 hover:bg-red-500/30 animate-pulse"
                    : "bg-white/5 hover:bg-white/10 text-white"
                }`}
              >
                {isRecording ? (
                  <CircleStop className="w-6 h-6" />
                ) : (
                  <CircleDot className="w-6 h-6" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {isRecording ? "Stop Recording" : "Start Recording"}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <Button
                variant="ghost"
                size="icon"
                className="w-14 h-14 rounded-full bg-white/5 hover:bg-white/10 text-white transition-all"
              >
                <Maximize2 className="w-6 h-6" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Fullscreen</TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <Button
                variant="ghost"
                size="icon"
                className="w-14 h-14 rounded-full bg-white/5 hover:bg-white/10 text-white transition-all"
              >
                <Settings className="w-6 h-6" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Settings</TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <div className="h-10 w-px bg-white/10 mx-2" />

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <Button
                onClick={() => router.push("/dashboard")}
                className="w-20 h-14 rounded-full bg-red-500 hover:bg-red-600 text-white transition-all shadow-lg shadow-red-500/20"
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

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function RoomPage() {
  const { roomId } = useParams();
  const { user } = useAuth();
  const [token, setToken] = useState<string>("");
  const [inviteOpen, setInviteOpen] = useState(false);
  const [participantsSidebarOpen, setParticipantsSidebarOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [egressId, setEgressId] = useState<string | null>(null);
  const router = useRouter();

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

          {/* Right Actions */}
          <div className="flex items-center gap-3 pointer-events-auto">
            {/* ✅ Invite Button */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Button
                    onClick={() => setInviteOpen(true)}
                    className="h-12 px-5 rounded-2xl bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20 backdrop-blur-xl font-medium gap-2"
                  >
                    <UserPlus className="w-4 h-4" />
                    Invite
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Invite people to this room</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setParticipantsSidebarOpen(!participantsSidebarOpen)}
                    className="w-12 h-12 rounded-2xl bg-black/60 border border-white/10 text-white/70 hover:text-white hover:bg-black/80 backdrop-blur-xl"
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
                    className="w-12 h-12 rounded-2xl bg-black/60 border border-white/10 text-white/70 hover:text-white hover:bg-black/80 backdrop-blur-xl"
                  >
                    <MessageSquare className="w-5 h-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Chat</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        {/* ── Video Grid ── */}
        <div className="flex-1 flex items-center justify-center p-4 pt-24 pb-32">
          <VideoConference />
        </div>

        {/* ── Control Dock ── */}
        <CustomControlDock
          isRecording={isRecording}
          onStartRecording={startRecording}
          onStopRecording={stopRecording}
        />

        <RoomAudioRenderer />

        {/* ── Invite Dialog ── */}
        <InviteDialog
          open={inviteOpen}
          onClose={() => setInviteOpen(false)}
          roomId={roomId as string}
        />

        {/* ── Participants Sidebar ── */}
        <ParticipantsSidebar
          open={participantsSidebarOpen}
          onClose={() => setParticipantsSidebarOpen(false)}
          roomId={roomId as string}
        />
      </div>
    </LiveKitRoom>
  );
}
