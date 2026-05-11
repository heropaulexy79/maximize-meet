"use client";

import { useEffect, useState } from "react";
import { DashboardSidebar } from "@/components/layout/DashboardSidebar";
import { motion } from "framer-motion";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Video, 
  Users, 
  Clock, 
  ArrowRight, 
  Plus,
  PlayCircle,
  Sparkles,
  Trophy,
  History,
  LogOut,
  Calendar
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, query, orderBy, limit, getDocs } from "firebase/firestore";

interface SessionData {
  id: string;
  title: string;
  instructor: string;
  time: string;
  status: "upcoming" | "scheduled" | "live";
  cohort: string;
}

export default function DashboardPage() {
  const { user, isAdmin } = useAuth();

  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [activeCohortsCount, setActiveCohortsCount] = useState(0);
  const [recentReplays, setRecentReplays] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const res = await fetch("/api/sessions");
        const data = await res.json();
        if (data.sessions) {
          setSessions(data.sessions.slice(0, 4));
        }
      } catch (error) {
        console.error("Error fetching sessions:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSessions();

    const fetchReplays = async () => {
      try {
        console.log("[Dashboard] Fetching replays...");
        const replaysQ = query(collection(db, "replays"), orderBy("date", "desc"), limit(2));
        const snapshot = await getDocs(replaysQ);
        console.log(`[Dashboard] Found ${snapshot.size} replays`);
        setRecentReplays(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (error) {
        console.error("[Dashboard] Error fetching replays:", error);
      }
    };
    fetchReplays();

    const cohortsQ = query(collection(db, "cohorts"));
    const unsubCohorts = onSnapshot(cohortsQ, (snapshot) => {
      setActiveCohortsCount(snapshot.size);
    });

    return () => {
      unsubCohorts();
    };
  }, []);

  const formatDuration = (seconds: number) => {
    if (!seconds) return "0m";
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  };

  return (
    <div className="flex min-h-screen bg-luxe-gradient overflow-hidden">
      <DashboardSidebar />
      
      <main className="flex-1 ml-72 p-12 overflow-y-auto">
        <div className="max-w-6xl mx-auto space-y-16">
          {/* Header Section */}
          <div className="flex items-end justify-between">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20">
                <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-primary">Academy Live</span>
              </div>
              <h1 className="text-5xl font-heading font-bold text-white tracking-tight">
                Welcome back, <span className="text-primary">{user?.displayName?.split(" ")[0] || "Leader"}</span>
              </h1>
              <p className="text-muted-foreground text-lg max-w-xl font-medium opacity-80">
                Your next leadership session is scheduled for today. Ready to transform?
              </p>
            </div>
            {isAdmin && (
              <Link href="/dashboard/create">
                <Button variant="luxe" className="rounded-2xl h-14 px-8 text-base font-bold shadow-2xl shadow-primary/20">
                  <Plus className="w-5 h-5 mr-3" />
                  New Session
                </Button>
              </Link>
            )}
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: Video, label: "Upcoming Sessions", value: "12", color: "primary" },
              { icon: Users, label: "Active Cohorts", value: activeCohortsCount.toString(), color: "indigo" },
              { icon: Clock, label: "Learning Hours", value: "84h", color: "amber" },
            ].map((stat, idx) => (
              <Card key={idx} className="relative group overflow-hidden border-white/5 hover:border-white/10">
                <div className="p-8 flex items-center gap-6 relative z-10">
                  <div className={cn(
                    "w-16 h-16 rounded-2xl flex items-center justify-center transition-transform duration-500 group-hover:scale-110",
                    stat.color === "primary" ? "bg-primary/10 text-primary" :
                    stat.color === "indigo" ? "bg-indigo-500/10 text-indigo-400" :
                    "bg-amber-500/10 text-amber-400"
                  )}>
                    <stat.icon className="w-8 h-8" />
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-white mb-1">{stat.value}</div>
                    <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">{stat.label}</div>
                  </div>
                </div>
                <div className={cn(
                  "absolute -bottom-10 -right-10 w-32 h-32 blur-[60px] rounded-full opacity-20",
                  stat.color === "primary" ? "bg-primary" :
                  stat.color === "indigo" ? "bg-indigo-500" :
                  "bg-amber-500"
                )} />
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">
            {/* Main Content: Sessions */}
            <div className="lg:col-span-2 space-y-8">
              <div className="flex items-center justify-between">
                <h2 className="text-3xl font-heading font-bold text-white tracking-tight">Active Sessions</h2>
                <Link href="/dashboard/sessions" className="group flex items-center gap-2 text-sm font-bold text-primary">
                  Explore All <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
              
              <div className="space-y-6">
                {sessions.length === 0 ? (
                  <div className="text-center py-20 bg-white/[0.02] border border-white/5 rounded-[3rem] border-dashed">
                    <Video className="w-16 h-16 text-muted-foreground/20 mx-auto mb-6" />
                    <p className="text-xl font-bold text-white opacity-40">No live sessions currently</p>
                    <p className="text-muted-foreground mt-2 max-w-xs mx-auto opacity-60">Check the schedule or wait for an invitation from your cohort leader.</p>
                  </div>
                ) : (
                  sessions.map((session) => (
                    <motion.div key={session.id} whileHover={{ y: -4 }}>
                      <Card className="hover:bg-white/[0.05] border-white/5 hover:border-primary/20 transition-all duration-500">
                        <div className="p-8 flex items-center gap-8">
                          <div className="w-28 h-28 rounded-[2rem] bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center border border-primary/20 relative group overflow-hidden">
                            <Video className="w-10 h-10 text-primary relative z-10" />
                            <div className="absolute inset-0 bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                          
                          <div className="flex-1 space-y-3">
                            <div className="flex items-center gap-3">
                              <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 px-4 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest">
                                {session.cohort}
                              </Badge>
                              {session.status === "live" && (
                                <Badge className="bg-green-500 text-white border-none px-4 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest animate-pulse">
                                  Live Now
                                </Badge>
                              )}
                            </div>
                            <h3 className="text-2xl font-bold text-white tracking-tight leading-tight">{session.title}</h3>
                            <div className="flex items-center gap-6 text-muted-foreground font-medium opacity-70">
                              <span className="flex items-center gap-2">
                                <Users className="w-4 h-4 text-primary" />
                                {session.instructor}
                              </span>
                              <span className="flex items-center gap-2">
                                <Clock className="w-4 h-4 text-primary" />
                                {session.time}
                              </span>
                            </div>
                          </div>

                          <Link href={`/room/${session.id}`}>
                            <Button className="rounded-2xl h-14 px-8 bg-white/5 hover:bg-primary text-white font-bold border border-white/10 hover:border-primary transition-all group">
                              Join Room
                              <ArrowRight className="ml-3 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </Button>
                          </Link>
                        </div>
                      </Card>
                    </motion.div>
                  ))
                )}
              </div>
            </div>

            {/* Sidebar Content: Replay Vault */}
            <div className="space-y-10">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-heading font-bold text-white tracking-tight">Vault</h2>
                <Link href="/vault" className="text-sm font-bold text-primary hover:underline transition-colors">Explore All</Link>
              </div>

              <div className="space-y-6">
                {recentReplays.length === 0 ? (
                  <div className="p-8 text-center bg-white/[0.02] border border-white/5 rounded-[2.5rem] space-y-4">
                    <History className="w-10 h-10 text-muted-foreground/20 mx-auto" />
                    <p className="text-sm text-muted-foreground font-medium">No recent replays found.</p>
                  </div>
                ) : (
                  recentReplays.map((replay) => {
                    let displayDate = "Leadership Session";
                    try {
                      if (replay.date) {
                        const dateObj = replay.date.toDate ? replay.date.toDate() : new Date(replay.date);
                        displayDate = dateObj.toLocaleDateString();
                      }
                    } catch (e) {
                      console.error("Date formatting error:", e);
                    }

                    return (
                      <Link href={`/vault/${replay.id}`} key={replay.id} className="block group">
                        <Card className="overflow-hidden border-white/5 group-hover:border-primary/20 transition-all duration-500 bg-white/[0.01]">
                          <div className="aspect-[16/10] bg-zinc-900 relative flex items-center justify-center overflow-hidden">
                            <img 
                              src={replay.thumbnail || "https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&q=80&w=1000"} 
                              alt={replay.title} 
                              className="absolute inset-0 w-full h-full object-cover opacity-40 group-hover:opacity-60 group-hover:scale-110 transition-all duration-700"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-80" />
                            <div className="w-16 h-16 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center relative z-10 group-hover:scale-110 group-hover:bg-primary/20 group-hover:border-primary/50 transition-all duration-500">
                              <PlayCircle className="w-8 h-8 text-white group-hover:text-primary transition-colors" />
                            </div>
                          </div>
                          <div className="p-6 space-y-2">
                            <h4 className="font-bold text-white text-lg group-hover:text-primary transition-colors truncate">{replay.title || "Untitled Session"}</h4>
                            <div className="flex items-center justify-between text-[10px] font-bold text-muted-foreground uppercase tracking-widest opacity-60 font-mono">
                              <span>{displayDate}</span>
                              <span>{formatDuration(replay.durationSeconds)}</span>
                            </div>
                          </div>
                        </Card>
                      </Link>
                    );
                  })
                )}
              </div>

              {/* Upgrade Card */}
              <Card className="bg-primary/10 border-primary/20 p-8 space-y-6 relative overflow-hidden group">
                <div className="relative z-10 space-y-4">
                  <h3 className="text-2xl font-bold text-white tracking-tight">Elite Leadership</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed font-medium">
                    Unlock exclusive cohort content and personalized coaching with our Premium Program.
                  </p>
                  <Button variant="luxe" className="w-full h-12 rounded-xl font-bold">
                    Upgrade Now
                  </Button>
                </div>
                <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-primary/20 blur-[80px] rounded-full group-hover:scale-150 transition-transform duration-700" />
                <Sparkles className="absolute top-4 right-4 w-6 h-6 text-primary/40 animate-pulse" />
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
