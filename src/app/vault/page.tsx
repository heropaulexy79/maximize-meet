"use client";

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
import { Input } from "@/components/ui/input";
import { 
  Search, 
  Play, 
  Calendar, 
  Clock, 
  Filter,
  Download,
  Share2
} from "lucide-react";

export default function VaultPage() {
  const replays = [
    {
      title: "The Visionary Leader's Roadmap",
      instructor: "Oke Oluwaseun",
      date: "May 5, 2024",
      duration: "1h 45m",
      category: "Strategy",
      thumbnail: "https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&q=80&w=1000",
    },
    {
      title: "Mastering Emotional Intelligence",
      instructor: "Dr. Jane Smith",
      date: "May 2, 2024",
      duration: "2h 10m",
      category: "Soft Skills",
      thumbnail: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=1000",
    },
    {
      title: "Strategic Execution & Scale",
      instructor: "Oke Oluwaseun",
      date: "April 28, 2024",
      duration: "1h 30m",
      category: "Execution",
      thumbnail: "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&q=80&w=1000",
    },
    {
      title: "High-Performance Culture",
      instructor: "The MAXIMIZE Team",
      date: "April 25, 2024",
      duration: "1h 55m",
      category: "Culture",
      thumbnail: "https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&q=80&w=1000",
    },
  ];

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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {replays.map((replay, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                whileHover={{ y: -5 }}
                className="group"
              >
                <Card className="bg-white/[0.02] border-white/5 rounded-[2.5rem] overflow-hidden group-hover:bg-white/[0.04] transition-all duration-300">
                  <div className="relative aspect-video overflow-hidden">
                    <img 
                      src={replay.thumbnail} 
                      alt={replay.title} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center scale-90 opacity-0 group-hover:scale-100 group-hover:opacity-100 transition-all duration-300 shadow-xl shadow-primary/40">
                        <Play className="w-8 h-8 text-white fill-white ml-1" />
                      </div>
                    </div>
                    <Badge className="absolute top-4 left-4 bg-black/60 backdrop-blur-md text-white border-white/10 rounded-full px-3 py-1">
                      {replay.category}
                    </Badge>
                  </div>
                  <CardContent className="p-8">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground uppercase tracking-widest">
                        <Calendar className="w-4 h-4" />
                        {replay.date}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground uppercase tracking-widest">
                        <Clock className="w-4 h-4" />
                        {replay.duration}
                      </div>
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-primary transition-colors leading-tight">
                      {replay.title}
                    </h3>
                    <p className="text-muted-foreground mb-8">Led by {replay.instructor}</p>
                    
                    <div className="flex gap-4">
                      <Button className="flex-1 h-12 rounded-xl bg-primary hover:bg-primary/90 text-white font-medium">
                        Watch Replay
                      </Button>
                      <Button variant="outline" size="icon" className="h-12 w-12 rounded-xl border-white/10 bg-white/5 text-white">
                        <Download className="w-5 h-5" />
                      </Button>
                      <Button variant="outline" size="icon" className="h-12 w-12 rounded-xl border-white/10 bg-white/5 text-white">
                        <Share2 className="w-5 h-5" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
