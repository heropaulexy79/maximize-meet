"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { DashboardSidebar } from "@/components/layout/DashboardSidebar";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Card, 
  CardContent, 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { 
  ArrowLeft, 
  Clock, 
  Calendar, 
  User, 
  Download,
  Share2,
  FileText,
  Lightbulb,
  CheckCircle2,
  MessageSquare,
  Network,
  Search,
  Play,
  Volume2
} from "lucide-react";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { format } from "date-fns";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/context/AuthContext";

export default function SessionDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [signedUrl, setSignedUrl] = useState<string>("");

  const extractFileKey = useCallback((url: string) => {
    try {
      const urlObj = new URL(url);
      return urlObj.pathname.startsWith("/") ? urlObj.pathname.substring(1) : urlObj.pathname;
    } catch {
      return url;
    }
  }, []);

  const formatDuration = useCallback((seconds: number) => {
    if (!seconds) return "0m";
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  }, []);

  useEffect(() => {
    const fetchSession = async () => {
      if (!id || !user) return;
      try {
        const docRef = doc(db, "replays", id as string);
        const snapshot = await getDoc(docRef);
        if (snapshot.exists()) {
          const data = snapshot.data();
          setSession(data);
          
          if (data.fileUrl) {
            // Use the same sanitize logic as the main vault page
            let fileUrl = data.fileUrl;
            const privateHost = "0d71f8982a04d4b7325afa19bc44654c.r2.cloudflarestorage.com";
            const publicHost = "pub-15e730edd35642e49c44f19e4bdaf5b6.r2.dev";

            const nestedProtoMatch = fileUrl.match(/^(?:https?:\/\/)?[^/]+\.https?:\/\/(.+)/);
            if (nestedProtoMatch) {
              fileUrl = `https://${nestedProtoMatch[1]}`;
            }

            if (fileUrl.includes(privateHost)) {
              let clean = fileUrl.replace(/^https?:\/\//, "");
              const hostRegex = new RegExp(`([^/]+\\.)?${privateHost.replace(/\./g, "\\.")}`);
              clean = clean.replace(hostRegex, publicHost);
              fileUrl = `https://${clean}`;
            }
            
            setSignedUrl(fileUrl);
          }
        }
      } catch (error) {
        console.error("Error fetching session:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSession();
  }, [id, user, extractFileKey]);

  const formattedDate = useMemo(() => {
    if (!session?.date) return "Unknown";
    return format(session.date.toDate(), "MMMM d, yyyy");
  }, [session?.date]);

  const duration = useMemo(() => {
    return formatDuration(session?.durationSeconds);
  }, [session?.durationSeconds, formatDuration]);

  if (loading) {
    return (
      <div className="flex min-h-screen bg-black items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex min-h-screen bg-black items-center justify-center text-white">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Session Not Found</h2>
          <Button onClick={() => router.back()}>Go Back</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-black text-white font-outfit">
      <DashboardSidebar />
      
      <main className="flex-1 ml-64 p-10 overflow-y-auto">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Top Bar */}
          <div className="flex items-center justify-between">
            <Button 
              variant="ghost" 
              className="text-muted-foreground hover:text-white active:scale-95 transition-transform"
              onClick={() => router.back()}
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Vault
            </Button>
            <div className="flex items-center gap-3">
              <Button variant="outline" className="rounded-xl bg-white/5 border-white/10 h-10 active:scale-95 transition-transform">
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>
              <Button className="rounded-xl bg-primary hover:bg-primary/90 h-10 active:scale-95 transition-transform">
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
            </div>
          </div>

          {/* Player & Basic Info Header */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            <div className="lg:col-span-2 space-y-6">
              {/* Premium Video Player Container */}
              <div className="relative aspect-video rounded-[2.5rem] overflow-hidden bg-white/[0.03] border border-white/5 shadow-2xl group">
                {signedUrl ? (
                  <video 
                    src={signedUrl} 
                    controls 
                    className="w-full h-full"
                    poster={session.thumbnail}
                    crossOrigin="anonymous"
                  />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mb-4">
                      <Play className="w-10 h-10 text-primary" />
                    </div>
                    <p className="text-muted-foreground">Video is processing...</p>
                  </div>
                )}
              </div>

              {/* Session Meta */}
              <div className="space-y-4 px-2">
                <div className="flex flex-wrap items-center gap-4">
                  <Badge className="bg-primary/10 text-primary border-primary/20 text-xs font-bold px-3 py-1 uppercase tracking-widest">
                    {session.category || "Leadership Activation"}
                  </Badge>
                  <div className="flex items-center gap-2 text-muted-foreground text-sm">
                    <Calendar className="w-4 h-4" />
                    {formattedDate}
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground text-sm">
                    <Clock className="w-4 h-4" />
                    {duration}
                  </div>
                </div>
                <h1 className="text-3xl md:text-4xl font-bold leading-tight">{session.title}</h1>
                <div className="flex items-center gap-3 py-2">
                   <div className="w-10 h-10 rounded-full bg-white/[0.05] border border-white/10 flex items-center justify-center">
                     <User className="w-5 h-5 text-muted-foreground" />
                   </div>
                   <div>
                     <p className="text-sm text-muted-foreground leading-none mb-1">Led by</p>
                     <p className="font-bold">{session.instructor || "Academy Mentor"}</p>
                   </div>
                </div>
              </div>
            </div>

            {/* Sidebar Stats / Processing Info */}
            <div className="space-y-6">
              <Card className="bg-white/[0.03] border-white/5 rounded-[2rem] overflow-hidden">
                <CardContent className="p-8 space-y-6">
                  <h3 className="text-xl font-bold flex items-center gap-2">
                    <Network className="w-5 h-5 text-primary" />
                    Session Context
                  </h3>
                  <div className="space-y-4">
                    <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                      <p className="text-xs text-muted-foreground uppercase mb-1">Status</p>
                      <div className="flex items-center gap-2">
                        {session.processingStatus === "completed" ? (
                          <div className="flex items-center gap-2 text-green-400">
                            <CheckCircle2 className="w-4 h-4" />
                            <span className="text-sm font-bold uppercase tracking-widest">Intelligence Live</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-amber-400 animate-pulse">
                            <Volume2 className="w-4 h-4" />
                            <span className="text-sm font-bold uppercase tracking-widest">Processing Wisdom...</span>
                          </div>
                        )}
                      </div>
                    </div>
                    {session.tags && (
                      <div className="flex flex-wrap gap-2 pt-2">
                        {session.tags.map((tag: string) => (
                          <Badge key={tag} variant="secondary" className="bg-white/5 hover:bg-white/10 text-white/70 border-white/5 font-normal">
                             #{tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Related Sessions Mockup */}
              <div className="space-y-4">
                <h3 className="text-lg font-bold px-2">Related Sessions</h3>
                {[1, 2].map((i) => (
                  <Card key={i} className="bg-white/[0.02] border-white/5 rounded-2xl p-4 hover:bg-white/[0.05] transition-all cursor-pointer active:scale-95">
                    <div className="flex gap-4">
                      <div className="w-20 aspect-video rounded-lg bg-white/5 border border-white/10 overflow-hidden">
                        <img src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=200&q=80" className="w-full h-full object-cover opacity-50" loading="lazy" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold line-clamp-1">Advanced Mentorship Vol. {i+4}</h4>
                        <p className="text-xs text-muted-foreground mt-1">1h 24m • May 2026</p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </div>

          {/* AI Content Tabs */}
          <div className="bg-white/[0.02] border border-white/5 rounded-[3rem] p-6 md:p-10 min-h-[500px]">
             <Tabs defaultValue="overview" className="w-full">
               <TabsList className="bg-white/5 border-white/10 rounded-2xl mb-10 p-1 flex flex-wrap h-auto gap-1">
                 {[
                   { value: "overview", icon: FileText, label: "Overview" },
                   { value: "transcript", icon: Search, label: "Transcript" },
                   { value: "insights", icon: Lightbulb, label: "Insights" },
                   { value: "action", icon: CheckCircle2, label: "Action Steps" },
                   { value: "discussion", icon: MessageSquare, label: "Discussion" },
                   { value: "related", icon: Network, label: "Knowledge Graph" }
                 ].map((tab) => (
                   <TabsTrigger 
                     key={tab.value} 
                     value={tab.value} 
                     className="gap-2 px-4 md:px-6 py-2 rounded-xl active:scale-95 transition-transform"
                   >
                     <tab.icon className="w-4 h-4" />
                     <span className="hidden md:inline">{tab.label}</span>
                   </TabsTrigger>
                 ))}
               </TabsList>

               <AnimatePresence mode="wait">
                 {/* Overview Tab */}
                 <TabsContent value="overview" className="mt-0 outline-none">
                   <motion.div
                     initial={{ opacity: 0, y: 5 }}
                     animate={{ opacity: 1, y: 0 }}
                     transition={{ duration: 0.2 }}
                     className="max-w-4xl space-y-10"
                   >
                     <div className="space-y-4">
                       <h3 className="text-2xl font-bold">Executive Summary</h3>
                       <p className="text-lg text-muted-foreground leading-relaxed whitespace-pre-wrap">
                         {session.executiveSummary || "AI summary for this session is currently being generated. Check back shortly to see the distilled institutional wisdom from this leadership encounter."}
                       </p>
                     </div>

                     <div className="grid grid-cols-1 md:grid-cols-2 gap-10 pt-4">
                        <div className="space-y-4">
                          <h4 className="text-xl font-bold flex items-center gap-2">
                             <div className="w-2 h-2 rounded-full bg-primary" />
                             Key themes
                          </h4>
                          <ul className="space-y-3">
                            {(session.keyThemes || ["Visionary Leadership", "Cultural Alignment"]).map((theme: string) => (
                              <li key={theme} className="flex gap-3 text-muted-foreground items-start">
                                <span className="text-primary font-bold">•</span>
                                {theme}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div className="space-y-4">
                          <h4 className="text-xl font-bold flex items-center gap-2">
                             <div className="w-2 h-2 rounded-full bg-primary" />
                             Major Discussion Points
                          </h4>
                          <ul className="space-y-3">
                            {(session.discussionPoints || ["Defining the 2026 Strategy", "Overcoming Execution Barriers"]).map((point: string) => (
                              <li key={point} className="flex gap-3 text-muted-foreground items-start">
                                <span className="text-primary font-bold">•</span>
                                {point}
                              </li>
                            ))}
                          </ul>
                        </div>
                     </div>

                     <div className="p-8 rounded-[2rem] bg-primary/5 border border-primary/20 space-y-4">
                       <h3 className="text-xl font-bold">Main Conclusions</h3>
                       <p className="text-muted-foreground leading-relaxed italic">
                         "{session.conclusions || "The core essence of this session will be captured here."}"
                       </p>
                     </div>
                   </motion.div>
                 </TabsContent>

                 {/* Transcript Tab */}
                 <TabsContent value="transcript" className="mt-0 outline-none">
                   <motion.div
                     initial={{ opacity: 0, y: 5 }}
                     animate={{ opacity: 1, y: 0 }}
                     transition={{ duration: 0.2 }}
                     className="space-y-6"
                   >
                     <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <h3 className="text-2xl font-bold">Session Transcript</h3>
                        <div className="relative w-full md:w-64">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <input 
                            placeholder="Find in transcript..." 
                            className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm focus:border-primary/50 transition-all outline-none"
                          />
                        </div>
                     </div>

                     <ScrollArea className="h-[400px] pr-4">
                        <div className="space-y-8">
                          {session.transcriptChunks ? session.transcriptChunks.map((chunk: any, i: number) => (
                             <div key={i} className="group">
                               <div className="flex items-start gap-4 md:gap-6">
                                 <div className="w-14 md:w-16 shrink-0 font-mono text-[10px] md:text-xs text-primary/60 pt-1">
                                   [{chunk.timestamp || "00:00"}]
                                 </div>
                                 <div className="space-y-2">
                                   <div className="flex items-center gap-2 text-[10px] font-bold text-white/40 uppercase tracking-widest">
                                     Speaker {chunk.speaker || 1}
                                   </div>
                                   <p className="text-base md:text-lg text-muted-foreground group-hover:text-white/90 transition-colors">
                                     {chunk.text}
                                   </p>
                                 </div>
                               </div>
                             </div>
                          )) : (
                            <div className="py-20 text-center space-y-4">
                              <Volume2 className="w-12 h-12 text-muted-foreground/20 mx-auto" />
                              <p className="text-muted-foreground">
                                Full transcript is being timestamped and indexed for institutional knowledge.
                              </p>
                            </div>
                          )}
                        </div>
                     </ScrollArea>
                   </motion.div>
                 </TabsContent>

                 {/* Insights Tab */}
                 <TabsContent value="insights" className="mt-0 outline-none">
                   <motion.div
                     initial={{ opacity: 0, y: 5 }}
                     animate={{ opacity: 1, y: 0 }}
                     transition={{ duration: 0.2 }}
                     className="grid grid-cols-1 md:grid-cols-2 gap-8"
                   >
                     <div className="space-y-6">
                       <h3 className="text-2xl font-bold">Leadership Principles</h3>
                       <div className="space-y-4">
                         {(session.leadershipPrinciples || ["Identity-Driven Leadership", "Radical Responsibility"]).map((p: string, i: number) => (
                           <div key={i} className="p-6 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-primary/30 transition-all group">
                             <div className="flex gap-4">
                               <Lightbulb className="w-6 h-6 text-primary group-hover:scale-110 transition-transform" />
                               <p className="text-lg font-medium">{p}</p>
                             </div>
                           </div>
                         ))}
                       </div>
                     </div>
                     <div className="space-y-6">
                       <h3 className="text-2xl font-bold">Strategic Insights</h3>
                       <div className="space-y-4">
                         {(session.strategicInsights || ["The Shift from Management to Activation", "Institutional Wisdom Compounding"]).map((s: string, i: number) => (
                           <div key={i} className="p-6 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-cyan-500/30 transition-all group">
                             <div className="flex gap-4">
                               <Network className="w-6 h-6 text-cyan-400 group-hover:scale-110 transition-transform" />
                               <p className="text-lg font-medium">{s}</p>
                             </div>
                           </div>
                         ))}
                       </div>
                     </div>
                   </motion.div>
                 </TabsContent>

                 {/* Action Tab */}
                 <TabsContent value="action" className="mt-0 outline-none">
                   <motion.div
                     initial={{ opacity: 0, y: 5 }}
                     animate={{ opacity: 1, y: 0 }}
                     transition={{ duration: 0.2 }}
                     className="max-w-3xl space-y-10"
                   >
                     <div className="space-y-6">
                        <h3 className="text-2xl font-bold">Practical Implementation</h3>
                        <div className="space-y-4">
                          {(session.actionSteps || ["Conduct a culture audit in your team", "Redefine your core identity statement"]).map((step: string, i: number) => (
                            <div key={i} className="flex items-start gap-4 p-5 rounded-2xl bg-white/[0.02] border border-white/5">
                              <div className="w-6 h-6 rounded-full border border-primary/40 flex items-center justify-center shrink-0 mt-1">
                                <CheckCircle2 className="w-4 h-4 text-primary" />
                              </div>
                              <p className="text-lg text-muted-foreground">{step}</p>
                            </div>
                          ))}
                        </div>
                     </div>

                     <div className="space-y-6">
                        <h3 className="text-2xl font-bold">Reflection Questions</h3>
                        <div className="grid grid-cols-1 gap-4">
                          {(session.reflectionQuestions || ["Where is your leadership leaking power?", "How does your identity influence your strategy?"]).map((q: string, i: number) => (
                            <Card key={i} className="bg-primary/10 border-primary/20 rounded-2xl p-6">
                              <p className="text-xl font-medium">"{q}"</p>
                            </Card>
                          ))}
                        </div>
                     </div>
                   </motion.div>
                 </TabsContent>

                 {/* Discussion & Knowledge Graph placeholders */}
                 <TabsContent value="discussion" className="mt-0 outline-none">
                   <div className="py-20 text-center space-y-4">
                     <MessageSquare className="w-12 h-12 text-muted-foreground/20 mx-auto" />
                     <p className="text-muted-foreground">Community discussion and AI-guided debate features coming soon.</p>
                   </div>
                 </TabsContent>
                 <TabsContent value="related" className="mt-0 outline-none">
                   <div className="py-20 text-center space-y-4">
                     <Network className="w-12 h-12 text-muted-foreground/20 mx-auto" />
                     <p className="text-muted-foreground">Advanced session connection graph is mapping this encounter into the institutional web.</p>
                   </div>
                 </TabsContent>
               </AnimatePresence>
             </Tabs>
          </div>
        </div>
      </main>
    </div>
  );
}
