"use client";

import { useState, useEffect } from "react";
import { DashboardSidebar } from "@/components/layout/DashboardSidebar";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Video,
  ArrowLeft,
  Calendar,
  Zap,
  ExternalLink,
  Copy,
  Check,
  Loader2,
  Globe,
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

// Generates a clean random room ID like Google Meet
function generateRoomId() {
  const chars = "abcdefghijklmnopqrstuvwxyz";
  const seg = (n: number) =>
    Array.from({ length: n }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  return `${seg(3)}-${seg(4)}-${seg(3)}`;
}

export default function CreateSessionPage() {
  const router = useRouter();
  const { user, isAdmin, loading: authLoading } = useAuth();

  // Mode: null = picker, "instant" = instant session, "schedule" = schedule form
  const [mode, setMode] = useState<null | "instant" | "schedule">(null);
  const [startingNow, setStartingNow] = useState(false);
  const [roomId, setRoomId] = useState("");
  const [copied, setCopied] = useState(false);

  // Schedule form fields
  const [title, setTitle] = useState("");
  const [dateTime, setDateTime] = useState("");
  const [cohort, setCohort] = useState("");
  const [recurrence, setRecurrence] = useState<"none" | "daily" | "weekly" | "monthly">("none");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAdmin) {
      toast.error("Unauthorized access.");
      router.push("/dashboard");
    }
  }, [isAdmin, authLoading, router]);

  if (!isAdmin && !authLoading) return null;

  // ── Instant Session ──────────────────────────────────────────────
  const handleStartNow = async () => {
    if (!user) return;
    setStartingNow(true);
    try {
      const newRoomId = generateRoomId();
      // Save session to Firestore so it appears in dashboard
      const idToken = await user.getIdToken();
      await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${idToken}` },
        body: JSON.stringify({
          title: "Instant Session",
          instructor: user.displayName || user.email || "Admin",
          time: new Date().toISOString(),
          cohort: "All",
          status: "live",
          roomId: newRoomId,
        }),
      });
      toast.success("Session created — starting now!");
      router.push(`/room/${newRoomId}`);
    } catch {
      toast.error("Failed to start session.");
      setStartingNow(false);
    }
  };

  // ── Copy link ────────────────────────────────────────────────────
  const copyLink = () => {
    const link = `${window.location.origin}/room/${roomId}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    toast.success("Room link copied!");
    setTimeout(() => setCopied(false), 2500);
  };

  // ── Google Calendar Scheduling ───────────────────────────────────
  const handleScheduleGCal = () => {
    if (!title || !dateTime) {
      toast.error("Please fill in the session title and date/time.");
      return;
    }
    const newRoomId = generateRoomId();
    const roomLink = `${window.location.origin}/room/${newRoomId}`;

    // Parse ISO datetime to Google Calendar format: YYYYMMDDTHHMMSS
    const dt = new Date(dateTime);
    const pad = (n: number) => n.toString().padStart(2, "0");
    const gcalFmt = (d: Date) =>
      `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;

    const start = gcalFmt(dt);
    const end = gcalFmt(new Date(dt.getTime() + 60 * 60 * 1000)); // +1 hour

    // Build RRULE for recurring events
    const rruleMap: Record<string, string> = {
      daily: "RRULE:FREQ=DAILY",
      weekly: "RRULE:FREQ=WEEKLY",
      monthly: "RRULE:FREQ=MONTHLY",
    };

    const params = new URLSearchParams({
      action: "TEMPLATE",
      text: `Maximize Meet: ${title}`,
      dates: `${start}/${end}`,
      details: `Join the leadership session here:\n${roomLink}\n\nCohort: ${cohort || "All"}\nRecurrence: ${recurrence === "none" ? "One-time" : recurrence}\nPowered by Maximize Nation`,
      location: roomLink,
      ...(recurrence !== "none" ? { recur: rruleMap[recurrence] } : {}),
    });

    // Also save to Firestore
    if (user) {
      user.getIdToken().then((idToken) => {
        fetch("/api/sessions", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${idToken}` },
          body: JSON.stringify({
            title,
            instructor: user.displayName || user.email || "Admin",
            time: dt.toISOString(),
            cohort: cohort || "All",
            status: "scheduled",
            roomId: newRoomId,
            recurrence,
          }),
        });
      });
    }

    setRoomId(newRoomId);
    window.open(`https://calendar.google.com/calendar/r/eventedit?${params.toString()}`, "_blank");
    toast.success("Opening Google Calendar…");
  };

  // ── Save scheduled session without GCal ─────────────────────────
  const handleSaveScheduled = async () => {
    if (!title || !dateTime) {
      toast.error("Please fill in the session title and date/time.");
      return;
    }
    if (!user) return;
    setSaving(true);
    try {
      const newRoomId = generateRoomId();
      const idToken = await user.getIdToken();
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${idToken}` },
        body: JSON.stringify({
          title,
          instructor: user.displayName || user.email || "Admin",
          time: new Date(dateTime).toISOString(),
          cohort: cohort || "All",
          status: "scheduled",
          roomId: newRoomId,
          recurrence,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Session scheduled!");
        router.push("/dashboard");
      } else {
        toast.error(data.error || "Failed to schedule.");
      }
    } catch {
      toast.error("Failed to schedule session.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#050a1a]">
      <DashboardSidebar />

      <main className="flex-1 ml-64 flex items-center justify-center p-10 min-h-screen">
        <div className="w-full max-w-2xl">
          {/* Back link */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="mb-10">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 text-white/40 hover:text-white transition-colors group text-sm"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              Back to Dashboard
            </Link>
          </motion.div>

          <AnimatePresence mode="wait">
            {/* ── MODE PICKER ── */}
            {mode === null && (
              <motion.div
                key="picker"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <div className="text-center space-y-2 mb-10">
                  <h1 className="text-4xl font-outfit font-bold text-white">New Session</h1>
                  <p className="text-white/50 text-lg">How would you like to set up your session?</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {/* Instant Session Card */}
                  <motion.button
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setMode("instant")}
                    className="group relative p-8 rounded-3xl border border-white/8 bg-white/[0.02] hover:bg-primary/5 hover:border-primary/30 transition-all text-left overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="relative">
                      <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-5 group-hover:bg-primary/20 transition-colors">
                        <Zap className="w-7 h-7 text-primary" />
                      </div>
                      <h2 className="text-xl font-bold text-white mb-2">Start Instantly</h2>
                      <p className="text-white/50 text-sm leading-relaxed">
                        Create a room now and jump straight into your session. Share the link with participants.
                      </p>
                    </div>
                  </motion.button>

                  {/* Schedule Card */}
                  <motion.button
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setMode("schedule")}
                    className="group relative p-8 rounded-3xl border border-white/8 bg-white/[0.02] hover:bg-blue-500/5 hover:border-blue-400/30 transition-all text-left overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="relative">
                      <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-5 group-hover:bg-blue-500/20 transition-colors">
                        <Calendar className="w-7 h-7 text-blue-400" />
                      </div>
                      <h2 className="text-xl font-bold text-white mb-2">Schedule for Later</h2>
                      <p className="text-white/50 text-sm leading-relaxed">
                        Pick a date and time, then add it to Google Calendar and notify your cohort.
                      </p>
                    </div>
                  </motion.button>
                </div>
              </motion.div>
            )}

            {/* ── INSTANT SESSION ── */}
            {mode === "instant" && (
              <motion.div
                key="instant"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-8"
              >
                <div className="text-center space-y-2">
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-4">
                    <Zap className="w-8 h-8 text-primary" />
                  </div>
                  <h1 className="text-3xl font-outfit font-bold text-white">Start Instantly</h1>
                  <p className="text-white/50">A live room will be created and you'll be taken straight into it.</p>
                </div>

                <div className="bg-white/[0.02] border border-white/8 rounded-3xl p-8 space-y-4">
                  <div className="flex items-center gap-3 text-white/60 text-sm">
                    <Globe className="w-4 h-4 text-primary" />
                    <span>A unique room link will be generated for this session</span>
                  </div>
                  <div className="flex items-center gap-3 text-white/60 text-sm">
                    <Video className="w-4 h-4 text-primary" />
                    <span>Session will be listed as "Live" on your dashboard</span>
                  </div>
                  <div className="flex items-center gap-3 text-white/60 text-sm">
                    <Copy className="w-4 h-4 text-primary" />
                    <span>Copy and share the link from inside the room</span>
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <Button
                    onClick={handleStartNow}
                    disabled={startingNow}
                    className="w-full h-14 rounded-2xl font-bold text-base"
                    style={{ background: "linear-gradient(135deg, #1a2080, #00e5ff)", color: "#050a1a" }}
                  >
                    {startingNow ? (
                      <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Starting…</>
                    ) : (
                      <><Zap className="w-5 h-5 mr-2" /> Start Session Now</>
                    )}
                  </Button>
                  <button onClick={() => setMode(null)} className="text-white/30 hover:text-white/60 text-sm transition-colors py-2">
                    ← Back
                  </button>
                </div>
              </motion.div>
            )}

            {/* ── SCHEDULE FORM ── */}
            {mode === "schedule" && (
              <motion.div
                key="schedule"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-7"
              >
                <div className="text-center space-y-2">
                  <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mx-auto mb-4">
                    <Calendar className="w-8 h-8 text-blue-400" />
                  </div>
                  <h1 className="text-3xl font-outfit font-bold text-white">Schedule a Session</h1>
                  <p className="text-white/50">Fill in the details, then save or add to Google Calendar.</p>
                </div>

                <div className="bg-white/[0.02] border border-white/8 rounded-3xl p-8 space-y-6">
                  {/* Title */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-white/40 uppercase tracking-widest">Session Title</label>
                    <div className="relative">
                      <Video className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                      <Input
                        placeholder="e.g. Strategic Leadership Masterclass"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="h-13 pl-11 rounded-2xl bg-white/[0.03] border-white/8 focus:border-primary/40 text-white placeholder:text-white/20"
                      />
                    </div>
                  </div>

                  {/* Date/Time */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-white/40 uppercase tracking-widest">Date & Time</label>
                    <div className="relative">
                      <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
                      <input
                        type="datetime-local"
                        value={dateTime}
                        onChange={(e) => setDateTime(e.target.value)}
                        className="w-full h-13 pl-11 pr-4 rounded-2xl bg-white/[0.03] border border-white/8 focus:border-primary/40 text-white outline-none transition-colors [color-scheme:dark] py-3"
                      />
                    </div>
                  </div>

                  {/* Cohort */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-white/40 uppercase tracking-widest">Target Cohort <span className="normal-case text-white/20">(optional)</span></label>
                    <Input
                      placeholder="e.g. Cohort Alpha, All Members"
                      value={cohort}
                      onChange={(e) => setCohort(e.target.value)}
                      className="h-13 rounded-2xl bg-white/[0.03] border-white/8 focus:border-primary/40 text-white placeholder:text-white/20"
                    />
                  </div>

                  {/* Recurrence */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-white/40 uppercase tracking-widest">Repeat</label>
                    <div className="grid grid-cols-4 gap-2">
                      {(["none", "daily", "weekly", "monthly"] as const).map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => setRecurrence(opt)}
                          className={`py-2.5 rounded-xl text-sm font-medium transition-all capitalize border ${
                            recurrence === opt
                              ? "bg-primary/15 border-primary/40 text-primary"
                              : "bg-white/[0.03] border-white/8 text-white/40 hover:text-white/70 hover:border-white/20"
                          }`}
                        >
                          {opt === "none" ? "Once" : opt}
                        </button>
                      ))}
                    </div>
                    {recurrence !== "none" && (
                      <p className="text-xs text-primary/70 mt-1 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary inline-block" />
                        This session repeats {recurrence} and won't expire from your dashboard.
                      </p>
                    )}
                  </div>
                </div>

                {/* CTAs */}
                <div className="space-y-3">
                  {/* Google Calendar CTA */}
                  <Button
                    onClick={handleScheduleGCal}
                    className="w-full h-14 rounded-2xl font-bold text-base bg-white/5 hover:bg-white/10 text-white border border-white/10 hover:border-white/20"
                  >
                    <ExternalLink className="w-5 h-5 mr-2 text-blue-400" />
                    Add to Google Calendar
                  </Button>

                  {/* Save Only CTA */}
                  <Button
                    onClick={handleSaveScheduled}
                    disabled={saving}
                    className="w-full h-14 rounded-2xl font-bold text-base"
                    style={{ background: "linear-gradient(135deg, #1a2080, #00e5ff)", color: "#050a1a" }}
                  >
                    {saving ? (
                      <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Saving…</>
                    ) : (
                      <><Check className="w-5 h-5 mr-2" /> Save Session</>
                    )}
                  </Button>

                  <button onClick={() => setMode(null)} className="w-full text-white/30 hover:text-white/60 text-sm transition-colors py-2">
                    ← Back
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
