"use client";

import { useEffect, useState } from "react";
import { DashboardSidebar } from "@/components/layout/DashboardSidebar";
import { motion } from "framer-motion";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Video, 
  Clock, 
  ArrowRight, 
  Plus,
  Search,
  Filter
} from "lucide-react";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";

interface SessionData {
  id: string;
  title: string;
  instructor: string;
  time: string;
  status: "upcoming" | "scheduled" | "live";
  cohort: string;
}

export default function SessionsPage() {
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const res = await fetch("/api/sessions");
        const data = await res.json();
        if (data.sessions) {
          setSessions(data.sessions);
        }
      } catch (error) {
        console.error("Error fetching sessions:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSessions();
  }, []);

  return (
    <div className="flex min-h-screen bg-black">
      <DashboardSidebar />
      
      <main className="flex-1 ml-64 p-10">
        <div className="max-w-6xl mx-auto space-y-10">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-outfit font-bold text-white mb-2">Academy Sessions</h1>
              <p className="text-muted-foreground text-lg">Manage and join live leadership encounters.</p>
            </div>
            <Link href="/dashboard/create">
              <Button className="rounded-xl bg-primary hover:bg-primary/90 text-white px-6 h-12 shadow-lg shadow-primary/20">
                <Plus className="w-5 h-5 mr-2" />
                Schedule Session
              </Button>
            </Link>
          </div>

          {/* Search & Filter */}
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input 
                placeholder="Search sessions..." 
                className="pl-12 h-14 rounded-2xl bg-white/[0.03] border-white/5 focus:border-primary/50 text-white text-lg"
              />
            </div>
            <Button variant="outline" className="h-14 px-6 rounded-2xl border-white/10 bg-white/5 text-white">
              <Filter className="w-5 h-5 mr-2" />
              Filters
            </Button>
          </div>

          {/* Sessions Grid */}
          <div className="grid grid-cols-1 gap-6">
            {loading ? (
              <div className="text-center p-20">
                <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-muted-foreground">Loading sessions...</p>
              </div>
            ) : sessions.length === 0 ? (
              <Card className="bg-white/[0.02] border-white/5 rounded-[2.5rem] p-20 text-center">
                <Video className="w-16 h-16 text-muted-foreground/20 mx-auto mb-6" />
                <h3 className="text-2xl font-bold text-white mb-2">No sessions found</h3>
                <p className="text-muted-foreground mb-8">Ready to start? Schedule your first leadership encounter.</p>
                <Link href="/dashboard/create">
                  <Button className="rounded-xl bg-primary px-8">Schedule Now</Button>
                </Link>
              </Card>
            ) : (
              sessions.map((session) => (
                <motion.div
                  key={session.id}
                  whileHover={{ scale: 1.005 }}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Card className="bg-white/[0.02] border-white/5 hover:bg-white/[0.04] transition-all rounded-[2rem] overflow-hidden">
                    <CardContent className="p-8">
                      <div className="flex flex-col md:flex-row items-start md:items-center gap-8">
                        <div className="w-20 h-20 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                          <Video className="w-8 h-8 text-primary" />
                        </div>
                        
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-3">
                            <Badge className="bg-primary/10 text-primary border-primary/20 rounded-full px-3">
                              {session.cohort}
                            </Badge>
                            <Badge className={cn(
                              "rounded-full px-3",
                              session.status === "live" ? "bg-green-500/10 text-green-400 border-green-500/20 animate-pulse" : "bg-white/5 text-muted-foreground border-white/10"
                            )}>
                              {session.status === "live" ? "Live Now" : session.status.charAt(0).toUpperCase() + session.status.slice(1)}
                            </Badge>
                          </div>
                          <h3 className="text-2xl font-bold text-white">{session.title}</h3>
                          <p className="text-muted-foreground">Led by {session.instructor}</p>
                        </div>

                        <div className="flex flex-row md:flex-col items-center md:items-end gap-4 w-full md:w-auto pt-6 md:pt-0 border-t md:border-t-0 border-white/5">
                          <div className="flex items-center gap-2 text-muted-foreground font-mono">
                            <Clock className="w-4 h-4" />
                            {session.time}
                          </div>
                          <Link href={`/room/${session.id}`} className="flex-1 md:flex-none">
                            <Button className="w-full md:w-auto rounded-xl bg-white/5 hover:bg-primary hover:text-white border-white/10 transition-all">
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
      </main>
    </div>
  );
}

// Helper function for class names
function cn(...classes: any[]) {
  return classes.filter(Boolean).join(" ");
}
