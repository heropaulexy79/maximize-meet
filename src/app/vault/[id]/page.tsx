"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { DashboardSidebar } from "@/components/layout/DashboardSidebar";
import { 
  ArrowLeft,
  Calendar,
  Clock,
  Download,
  Share2,
  Video,
  PlayCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { format } from "date-fns";

export default function ReplayPlayerPage() {
  const { id } = useParams();
  const router = useRouter();
  const [replay, setReplay] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReplay = async () => {
      try {
        const docRef = doc(db, "replays", id as string);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          setReplay({ id: docSnap.id, ...docSnap.data() });
        } else {
          console.error("No such document!");
        }
      } catch (error) {
        console.error("Error fetching replay:", error);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchReplay();
    }
  }, [id]);

  const formatDuration = (seconds: number) => {
    if (!seconds) return "0m";
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  };

  const sanitizeUrl = (url: string) => {
    if (!url) return "";
    
    // 1. Fix protocol malformations (e.g. "bucket.https//")
    let sanitized = url.replace(/^[a-zA-Z0-9-]+\.https\/\//, "https://")
                       .replace(/^https\/\//, "https://")
                       .replace(/^http\/\//, "http://")
                       .replace(/^https:\/\/https:\/\//, "https://");
    
    // 2. Swap Internal S3 Endpoint with Public R2.dev Domain
    // This allows the browser to actually stream the video file
    sanitized = sanitized.replace(
      /0d71f8982a04d4b7325afa19bc44654c\.r2\.cloudflarestorage\.com/, 
      "pub-15e730edd35642e49c44f19e4bdaf5b6.r2.dev"
    );

    // 3. Ensure it starts with a protocol
    if (!sanitized.startsWith("http")) {
      sanitized = "https://" + sanitized.replace(/^[a-zA-Z0-9-]+\./, "");
    }
    
    return sanitized;
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-black items-center justify-center">
        <DashboardSidebar />
        <div className="ml-64 flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-muted-foreground">Loading replay...</p>
        </div>
      </div>
    );
  }

  if (!replay) {
    return (
      <div className="flex min-h-screen bg-black">
        <DashboardSidebar />
        <main className="flex-1 ml-64 p-10 flex flex-col items-center justify-center">
          <Video className="w-16 h-16 text-muted-foreground/30 mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Replay Not Found</h2>
          <p className="text-muted-foreground mb-6">This recording might still be processing or doesn't exist.</p>
          <Button onClick={() => router.push("/vault")} variant="outline" className="text-white border-white/10 hover:bg-white/5">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Vault
          </Button>
        </main>
      </div>
    );
  }

  const videoUrl = sanitizeUrl(replay.fileUrl);

  return (
    <div className="flex min-h-screen bg-black">
      <DashboardSidebar />
      
      <main className="flex-1 ml-64 p-10">
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Header Actions */}
          <Button 
            onClick={() => router.push("/vault")} 
            variant="ghost" 
            className="text-muted-foreground hover:text-white mb-2 -ml-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Vault
          </Button>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge className="bg-primary/20 text-primary border-primary/20">
                  {replay.category || "Live Session"}
                </Badge>
                {replay.status !== 3 && (
                  <Badge variant="outline" className="text-amber-400 border-amber-400/20 bg-amber-400/5">
                    Processing
                  </Badge>
                )}
              </div>
              <h1 className="text-3xl md:text-4xl font-outfit font-bold text-white leading-tight">
                {replay.title}
              </h1>
              <p className="text-muted-foreground mt-2">
                Room: <span className="font-mono">{replay.roomId}</span>
              </p>
            </div>
            
            <div className="flex gap-3 shrink-0">
              {replay.fileUrl && (
                <Button 
                  onClick={() => window.open(videoUrl, '_blank')}
                  className="rounded-xl bg-white/5 hover:bg-white/10 text-white border border-white/10"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
              )}
              <Button className="rounded-xl bg-primary hover:bg-primary/90 text-white">
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>
            </div>
          </div>

          {/* Video Player Area */}
          <div className="w-full aspect-video bg-zinc-900 rounded-[2rem] overflow-hidden border border-white/10 relative group shadow-2xl">
            {replay.status === 3 && replay.fileUrl ? (
              <video 
                controls 
                crossOrigin="anonymous"
                className="w-full h-full object-contain bg-black"
                poster={replay.thumbnail}
                src={videoUrl}
              >
                Your browser does not support the video tag.
              </video>
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm">
                <PlayCircle className="w-16 h-16 text-muted-foreground/50 mb-4" />
                <p className="text-white font-medium">Video is currently processing</p>
                <p className="text-sm text-muted-foreground mt-1">Please check back in a few minutes.</p>
              </div>
            )}
          </div>

          {/* Metadata */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
            <div className="flex items-center gap-4 bg-white/[0.02] border border-white/5 p-4 rounded-2xl">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-widest">Date Recorded</p>
                <p className="text-white font-medium">
                  {replay.date ? format(replay.date.toDate(), "MMMM d, yyyy") : "Unknown"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 bg-white/[0.02] border border-white/5 p-4 rounded-2xl">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center">
                <Clock className="w-5 h-5 text-indigo-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-widest">Duration</p>
                <p className="text-white font-medium">
                  {formatDuration(replay.durationSeconds)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 bg-white/[0.02] border border-white/5 p-4 rounded-2xl">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                <Video className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-widest">Format</p>
                <p className="text-white font-medium">MP4 Video</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
