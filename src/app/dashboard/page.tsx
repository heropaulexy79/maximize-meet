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
  PlayCircle
} from "lucide-react";
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
  const { user } = useAuth();

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
          // Limit to 4 for overview
          setSessions(data.sessions.slice(0, 4));
        }
      } catch (error) {
        console.error("Error fetching sessions:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSessions();

    // Fetch recent replays
    const fetchReplays = async () => {
      try {
        const replaysQ = query(collection(db, "replays"), orderBy("date", "desc"), limit(2));
        const snapshot = await getDocs(replaysQ);
        setRecentReplays(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (error) {
        console.error("Error fetching replays:", error);
      }
    };
    fetchReplays();

    // 2. Listen for active cohorts count
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
    <div className="flex min-h-screen bg-black">
      <DashboardSidebar />
      
      <main className="flex-1 ml-64 p-10">
        <div className="max-w-6xl mx-auto space-y-10">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-outfit font-bold text-white mb-2">
                Good afternoon, {user?.displayName?.split(" ")[0] || "Leader"}
              </h1>
              <p className="text-muted-foreground text-lg">
                Your next session starts soon. Are you ready to lead?
              </p>
            </div>
            <div className="flex gap-4">
              <Link href="/dashboard/create">
                <Button className="rounded-xl bg-primary hover:bg-primary/90 text-white px-6 h-12">
                  <Plus className="w-5 h-5 mr-2" />
                  New Session
                </Button>
              </Link>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-white/[0.03] border-white/5 backdrop-blur-xl rounded-[2rem] p-6 border-l-4 border-l-primary">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-2xl bg-primary/10">
                  <Video className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-white">12</div>
                  <div className="text-sm text-muted-foreground uppercase tracking-widest">Upcoming Sessions</div>
                </div>
              </div>
            </Card>
            <Card className="bg-white/[0.03] border-white/5 backdrop-blur-xl rounded-[2rem] p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-2xl bg-indigo-500/10">
                  <Users className="w-6 h-6 text-indigo-400" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-white">{activeCohortsCount}</div>
                  <div className="text-sm text-muted-foreground uppercase tracking-widest">Active Cohorts</div>
                </div>
              </div>
            </Card>
            <Card className="bg-white/[0.03] border-white/5 backdrop-blur-xl rounded-[2rem] p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-2xl bg-amber-500/10">
                  <Clock className="w-6 h-6 text-amber-400" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-white">84h</div>
                  <div className="text-sm text-muted-foreground uppercase tracking-widest">Learning Hours</div>
                </div>
              </div>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            {/* Live/Upcoming Sessions */}
            <div className="lg:col-span-2 space-y-6">
              <div className="flex items-center justify-between px-2">
                <h2 className="text-2xl font-outfit font-bold text-white">Academy Sessions</h2>
                <Link href="/dashboard/sessions" className="text-sm text-primary hover:underline font-medium">View All</Link>
              </div>
              
              <div className="space-y-4">
                {sessions.length === 0 ? (
                  <div className="text-center p-10 bg-white/[0.02] border border-white/5 rounded-[2rem]">
                    <Video className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                    <p className="text-muted-foreground font-medium">No upcoming sessions right now.</p>
                    <p className="text-sm text-muted-foreground/70">Check back later or ask your admin to schedule one.</p>
                  </div>
                ) : (
                  sessions.map((session) => (
                    <motion.div 
                      key={session.id}
                      whileHover={{ scale: 1.01 }}
                      className="group"
                    >
                      <Card className="bg-white/[0.02] border-white/5 hover:bg-white/[0.04] transition-all duration-300 rounded-[2rem] overflow-hidden">
                        <CardContent className="p-0">
                          <div className="flex items-center p-6 gap-6">
                            <div className="w-24 h-24 rounded-2xl bg-primary/20 flex items-center justify-center border border-primary/20 overflow-hidden relative group-hover:border-primary/40 transition-colors">
                              <Video className="w-8 h-8 text-primary opacity-60" />
                              <div className="absolute inset-0 bg-primary/10 group-hover:bg-primary/20 transition-colors" />
                            </div>
                            
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 rounded-full px-3">
                                  {session.cohort}
                                </Badge>
                                {(session.status === "upcoming" || session.status === "live") && (
                                  <Badge className="bg-green-500/10 text-green-400 border-green-500/20 rounded-full px-3 animate-pulse">
                                    {session.status === "live" ? "Live Now" : "Live Soon"}
                                  </Badge>
                                )}
                              </div>
                              <h3 className="text-xl font-bold text-white mb-1 group-hover:text-primary transition-colors">{session.title}</h3>
                              <p className="text-muted-foreground">Led by {session.instructor}</p>
                            </div>

                            <div className="text-right space-y-3">
                              <div className="flex items-center justify-end gap-2 text-sm text-muted-foreground">
                                <Clock className="w-4 h-4" />
                                {session.time}
                              </div>
                              <Link href={`/room/${session.id}`}>
                                <Button className="rounded-xl bg-white/5 hover:bg-primary hover:text-white border-white/10 group-hover:border-primary/50 transition-all">
                                  Join Room
                                  <ArrowRight className="ml-2 w-4 h-4" />
                                </Button>
                              </Link>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))
                )}
              </div>
            </div>

            {/* Sidebar Content: Replay Vault */}
            <div className="space-y-6">
              <div className="flex items-center justify-between px-2">
                <h2 className="text-2xl font-outfit font-bold text-white">Vault Replays</h2>
                <Link href="/vault" className="text-sm text-primary hover:underline font-medium">Explore</Link>
              </div>

              <div className="space-y-4">
                {recentReplays.length === 0 ? (
                  <div className="text-center p-6 bg-white/[0.02] border border-white/5 rounded-3xl">
                    <p className="text-sm text-muted-foreground">No replays available yet.</p>
                  </div>
                ) : (
                  recentReplays.map((replay) => (
                    <Link href={`/vault/${replay.id}`} key={replay.id} className="block">
                      <Card className="bg-white/[0.03] border-white/5 rounded-3xl overflow-hidden group hover:bg-white/[0.05] transition-all">
                        <CardHeader className="p-0 aspect-video bg-zinc-900 relative flex items-center justify-center overflow-hidden">
                          <img 
                            src={replay.thumbnail || "https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&q=80&w=1000"} 
                            alt={replay.title} 
                            className="absolute inset-0 w-full h-full object-cover opacity-50 group-hover:opacity-70 transition-opacity group-hover:scale-105 duration-500"
                          />
                          <PlayCircle className="w-12 h-12 text-white/80 group-hover:text-primary transition-colors z-10 shadow-lg rounded-full" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                        </CardHeader>
                        <CardContent className="p-5">
                          <h4 className="font-bold text-white mb-1 truncate">{replay.title}</h4>
                          <div className="flex items-center justify-between text-xs text-muted-foreground uppercase tracking-widest">
                            <span>{replay.date ? new Date(replay.date.toDate()).toLocaleDateString() : "Unknown"}</span>
                            <span>{formatDuration(replay.durationSeconds)}</span>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))
                )}
              </div>

              <Card className="bg-primary/5 border border-primary/20 rounded-[2rem] p-6 overflow-hidden relative">
                <div className="relative z-10">
                  <h3 className="text-lg font-bold text-white mb-2">Leadership Program</h3>
                  <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                    Unlock exclusive content and personalized coaching with our Elite Leadership Program.
                  </p>
                  <Button size="sm" className="bg-primary text-white hover:bg-primary/90 rounded-full px-6">
                    Learn More
                  </Button>
                </div>
                <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-primary/20 blur-[60px] rounded-full" />
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
