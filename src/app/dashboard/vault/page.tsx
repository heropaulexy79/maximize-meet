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
  RefreshCcw, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  Play,
  FileText,
  Search,
  Filter
} from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { format } from "date-fns";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";

export default function AdminVaultPage() {
  const { user } = useAuth();
  const [replays, setReplays] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, "replays"), orderBy("date", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedReplays = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setReplays(fetchedReplays);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleReprocess = async (id: string) => {
    try {
      const idToken = await user?.getIdToken();
      const res = await fetch(`/api/admin/vault/reprocess`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${idToken}`
        },
        body: JSON.stringify({ egressId: id })
      });
      
      if (res.ok) {
        toast.success("Reprocessing task queued");
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to queue reprocessing");
      }
    } catch (error) {
      toast.error("Error triggering reprocessing");
    }
  };

  const statusMap: any = {
    pending: { color: "bg-blue-500/10 text-blue-400", icon: Clock, label: "Pending" },
    processing: { color: "bg-amber-500/10 text-amber-400", icon: RefreshCcw, label: "Processing" },
    completed: { color: "bg-green-500/10 text-green-400", icon: CheckCircle2, label: "Completed" },
    failed: { color: "bg-red-500/10 text-red-400", icon: AlertCircle, label: "Failed" },
  };

  return (
    <div className="flex min-h-screen bg-black">
      <DashboardSidebar />
      
      <main className="flex-1 ml-64 p-10">
        <div className="max-w-6xl mx-auto space-y-10">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-outfit font-bold text-white mb-2">Knowledge Vault HQ</h1>
              <p className="text-muted-foreground text-lg">Manage AI intelligence pipeline and processing queue.</p>
            </div>
            <div className="flex gap-4">
              <div className="text-right">
                <p className="text-xs text-muted-foreground uppercase tracking-widest">Total Knowledge</p>
                <p className="text-2xl font-bold text-white">{replays.length} Sessions</p>
              </div>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-4 gap-6">
            {[
              { label: "Completed", count: replays.filter(r => r.processingStatus === 'completed').length, color: "text-green-400" },
              { label: "Processing", count: replays.filter(r => r.processingStatus === 'processing').length, color: "text-amber-400" },
              { label: "Pending", count: replays.filter(r => r.processingStatus === 'pending').length, color: "text-blue-400" },
              { label: "Failed", count: replays.filter(r => r.processingStatus === 'failed').length, color: "text-red-400" }
            ].map((stat) => (
              <Card key={stat.label} className="bg-white/[0.02] border-white/5 rounded-2xl p-6">
                <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">{stat.label}</p>
                <p className={`text-3xl font-bold ${stat.color}`}>{stat.count}</p>
              </Card>
            ))}
          </div>

          {/* Processing Queue Table */}
          <Card className="bg-white/[0.02] border-white/5 rounded-[2.5rem] overflow-hidden">
            <CardHeader className="p-8 border-b border-white/5 flex flex-row items-center justify-between bg-white/[0.01]">
              <CardTitle className="text-xl">Intelligence Queue</CardTitle>
              <div className="flex gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input placeholder="Filter sessions..." className="bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm" />
                </div>
                <Button variant="outline" size="icon" className="rounded-xl border-white/10 bg-white/5">
                   <Filter className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/5 bg-white/[0.01]">
                      <th className="p-6 text-sm font-bold uppercase tracking-widest text-muted-foreground">Session Info</th>
                      <th className="p-6 text-sm font-bold uppercase tracking-widest text-muted-foreground">Intelligence Status</th>
                      <th className="p-6 text-sm font-bold uppercase tracking-widest text-muted-foreground">Processed At</th>
                      <th className="p-6 text-sm font-bold uppercase tracking-widest text-muted-foreground text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={4} className="p-20 text-center text-muted-foreground">
                           <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                           Loading queue...
                        </td>
                      </tr>
                    ) : replays.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="p-20 text-center text-muted-foreground">No recordings found.</td>
                      </tr>
                    ) : replays.map((replay) => {
                      const status = statusMap[replay.processingStatus || 'pending'] || statusMap.pending;
                      const StatusIcon = status.icon;
                      
                      return (
                        <tr key={replay.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors group">
                          <td className="p-6">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0 overflow-hidden">
                                {replay.thumbnail ? (
                                  <img src={replay.thumbnail} className="w-full h-full object-cover" />
                                ) : (
                                  <Play className="w-5 h-5 text-muted-foreground" />
                                )}
                              </div>
                              <div>
                                <p className="font-bold text-white line-clamp-1">{replay.title}</p>
                                <p className="text-xs text-muted-foreground">{replay.instructor || "Instructor"}</p>
                              </div>
                            </div>
                          </td>
                          <td className="p-6">
                            <Badge className={`${status.color} border-none rounded-full px-3 py-1 flex items-center gap-2 w-fit`}>
                              <StatusIcon className={`w-3.5 h-3.5 ${replay.processingStatus === 'processing' ? 'animate-spin' : ''}`} />
                              {status.label}
                            </Badge>
                          </td>
                          <td className="p-6 text-sm text-muted-foreground">
                            {replay.processedAt ? format(replay.processedAt.toDate(), "MMM d, HH:mm") : "—"}
                          </td>
                          <td className="p-6 text-right">
                             <div className="flex justify-end gap-2">
                               <Button 
                                 variant="outline" 
                                 size="sm" 
                                 onClick={() => handleReprocess(replay.id)}
                                 className="rounded-xl border-white/10 bg-white/5 text-xs h-9 hover:bg-primary hover:text-white transition-all"
                                 disabled={replay.processingStatus === 'processing'}
                               >
                                 <RefreshCcw className="w-3 h-3 mr-2" />
                                 Reprocess
                               </Button>
                               <Button 
                                 variant="outline" 
                                 size="icon" 
                                 className="rounded-xl border-white/10 bg-white/5 h-9 w-9"
                                 onClick={() => window.open(`/vault/${replay.id}`, '_blank')}
                               >
                                 <FileText className="w-4 h-4" />
                               </Button>
                             </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
