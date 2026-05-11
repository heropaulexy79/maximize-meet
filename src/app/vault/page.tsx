"use client";

import { useEffect, useState } from "react";
import { DashboardSidebar } from "@/components/layout/DashboardSidebar";
import { motion } from "framer-motion";
import { 
  Card, 
  CardContent, 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Search, 
  Play, 
  Calendar, 
  Clock, 
  Filter,
  Download,
  Share2,
  Video
} from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, query, orderBy, getDocs } from "firebase/firestore";
import { format } from "date-fns";
import Link from "next/link";

export default function VaultPage() {
  const [replays, setReplays] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReplays = async () => {
      try {
        const q = query(collection(db, "replays"), orderBy("date", "desc"));
        const snapshot = await getDocs(q);
        const fetchedReplays = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setReplays(fetchedReplays);
      } catch (error) {
        console.error("Error fetching replays:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchReplays();
  }, []);

  const sanitizeUrl = (url: string) => {
    if (!url) return "";
    
    // 1. Fix protocol malformations
    let sanitized = url.replace(/^[a-zA-Z0-9-]+\.https\/\//, "https://")
                       .replace(/^https\/\//, "https://")
                       .replace(/^http\/\//, "http://")
                       .replace(/^https:\/\/https:\/\//, "https://");
    
    // 2. Swap to Public Domain
    sanitized = sanitized.replace(
      /0d71f8982a04d4b7325afa19bc44654c\.r2\.cloudflarestorage\.com/, 
      "pub-15e730edd35642e49c44f19e4bdaf5b6.r2.dev"
    );

    if (!sanitized.startsWith("http")) {
      sanitized = "https://" + sanitized.replace(/^[a-zA-Z0-9-]+\./, "");
    }
    
    return sanitized;
  };

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
              <h1 className="text-4xl font-outfit font-bold text-white mb-2">Replay Vault</h1>
              <p className="text-muted-foreground text-lg">
                Relive the transformation. All past academy sessions in one place.
              </p>
            </div>
          </div>

          {/* Search & Filter */}
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input 
                placeholder="Search sessions, instructors, or topics..." 
                className="pl-12 h-14 rounded-2xl bg-white/[0.03] border-white/5 focus:border-primary/50 text-white text-lg"
              />
            </div>
            <Button variant="outline" className="h-14 px-6 rounded-2xl border-white/10 bg-white/5 text-white">
              <Filter className="w-5 h-5 mr-2" />
              Filters
            </Button>
          </div>

          {/* Categories */}
          <div className="flex gap-3 overflow-x-auto pb-2">
            {["All", "Strategy", "Culture", "Soft Skills", "Execution", "Cohorts", "Guest Speakers"].map((cat) => (
              <Badge key={cat} variant="secondary" className="px-5 py-2 rounded-full bg-white/5 hover:bg-white/10 text-white text-sm font-medium cursor-pointer transition-colors border border-white/5">
                {cat}
              </Badge>
            ))}
          </div>

          {/* Grid */}
          {loading ? (
             <div className="flex flex-col items-center justify-center py-20">
               <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
               <p className="text-muted-foreground">Loading vault...</p>
             </div>
          ) : replays.length === 0 ? (
             <div className="flex flex-col items-center justify-center py-20 bg-white/[0.02] border border-white/5 rounded-[2.5rem]">
               <Video className="w-16 h-16 text-muted-foreground/30 mb-4" />
               <h3 className="text-xl font-bold text-white mb-2">No Replays Yet</h3>
               <p className="text-muted-foreground">Recordings will automatically appear here once sessions finish.</p>
             </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {replays.map((replay, idx) => (
                <motion.div
                  key={replay.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  whileHover={{ y: -5 }}
                  className="group"
                >
                  <Card className="bg-white/[0.02] border-white/5 rounded-[2.5rem] overflow-hidden group-hover:bg-white/[0.04] transition-all duration-300">
                    <div className="relative aspect-video overflow-hidden">
                      <img 
                        src={replay.thumbnail || "https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&q=80&w=1000"} 
                        alt={replay.title} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors" />
                      
                      <Link href={`/vault/${replay.id}`} className="absolute inset-0 flex items-center justify-center z-10">
                        <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center scale-90 opacity-0 group-hover:scale-100 group-hover:opacity-100 transition-all duration-300 shadow-xl shadow-primary/40 cursor-pointer">
                          <Play className="w-8 h-8 text-white fill-white ml-1" />
                        </div>
                      </Link>

                      <Badge className="absolute top-4 left-4 bg-black/60 backdrop-blur-md text-white border-white/10 rounded-full px-3 py-1 z-10">
                        {replay.category || "Session"}
                      </Badge>
                      
                      {replay.status !== 3 && (
                        <Badge className="absolute top-4 right-4 bg-amber-500/20 text-amber-400 border-amber-500/20 rounded-full px-3 py-1 z-10">
                          Processing
                        </Badge>
                      )}
                    </div>
                    <CardContent className="p-8">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground uppercase tracking-widest">
                          <Calendar className="w-4 h-4" />
                          {replay.date ? format(replay.date.toDate(), "MMM d, yyyy") : "Unknown"}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground uppercase tracking-widest">
                          <Clock className="w-4 h-4" />
                          {formatDuration(replay.durationSeconds)}
                        </div>
                      </div>
                      <Link href={`/vault/${replay.id}`}>
                        <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-primary transition-colors leading-tight cursor-pointer">
                          {replay.title}
                        </h3>
                      </Link>
                      <p className="text-muted-foreground mb-8">Led by {replay.instructor || "Instructor"}</p>
                      
                      <div className="flex gap-4">
                        <Link href={`/vault/${replay.id}`} className="flex-1">
                          <Button className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 text-white font-medium">
                            Watch Replay
                          </Button>
                        </Link>
                        {replay.fileUrl && (
                          <Button variant="outline" size="icon" onClick={() => window.open(sanitizeUrl(replay.fileUrl), '_blank')} className="h-12 w-12 rounded-xl border-white/10 bg-white/5 text-white shrink-0">
                            <Download className="w-5 h-5" />
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
