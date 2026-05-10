"use client";

import { useEffect, useState } from "react";
import { DashboardSidebar } from "@/components/layout/DashboardSidebar";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  Clock,
  Calendar,
  LogOut,
  Video
} from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, query, orderBy, limit } from "firebase/firestore";
import { format } from "date-fns";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

interface AttendanceRecord {
  id: string;
  identity: string;
  name: string;
  roomId: string;
  joinedAt: Date | null;
  leftAt: Date | null;
  durationSeconds: number;
}

export default function AttendancePage() {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const { isAdmin, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !isAdmin) {
      router.push("/dashboard");
      return;
    }

    if (isAdmin) {
      // Use a flat collection query for real-time attendance updates
      const q = query(collection(db, "attendance"), orderBy("joinedAt", "desc"), limit(100));
      
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const fetchedRecords: AttendanceRecord[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          fetchedRecords.push({
            id: doc.id,
            identity: data.identity,
            name: data.name,
            roomId: data.roomId || "Unknown Room",
            joinedAt: data.joinedAt ? data.joinedAt.toDate() : null,
            leftAt: data.leftAt ? data.leftAt.toDate() : null,
            durationSeconds: data.durationSeconds || 0,
          });
        });

        setRecords(fetchedRecords);
        setLoading(false);
      }, (error) => {
        console.error("Error fetching attendance:", error);
        setLoading(false);
      });

      return () => unsubscribe();
    }
  }, [isAdmin, authLoading, router]);

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
          <div>
            <h1 className="text-4xl font-outfit font-bold text-white mb-2">
              Session Attendance
            </h1>
            <p className="text-muted-foreground text-lg">
              Track who attended your leadership sessions and for how long.
            </p>
          </div>

          <Card className="bg-white/[0.02] border-white/5 rounded-[2rem] overflow-hidden">
            <CardHeader className="border-b border-white/5 bg-white/[0.01]">
              <CardTitle className="text-xl font-outfit flex items-center gap-3">
                <Users className="w-6 h-6 text-primary" />
                Attendance Log
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="p-10 text-center">
                  <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                  <p className="text-muted-foreground">Loading attendance records...</p>
                </div>
              ) : records.length === 0 ? (
                <div className="p-10 text-center">
                  <Video className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                  <p className="text-white font-medium mb-1">No attendance records found</p>
                  <p className="text-sm text-muted-foreground">Records will appear here automatically when participants join a room.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-white/5 text-sm text-muted-foreground uppercase tracking-wider">
                        <th className="p-6 font-medium">Participant</th>
                        <th className="p-6 font-medium">Room / Session</th>
                        <th className="p-6 font-medium">Joined At</th>
                        <th className="p-6 font-medium">Left At</th>
                        <th className="p-6 font-medium">Duration</th>
                        <th className="p-6 font-medium text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {records.map((record) => (
                        <tr key={record.id} className="hover:bg-white/[0.02] transition-colors">
                          <td className="p-6">
                            <div className="font-medium text-white">{record.name}</div>
                            <div className="text-xs text-muted-foreground mt-0.5">{record.identity}</div>
                          </td>
                          <td className="p-6 text-sm text-muted-foreground font-mono">
                            {record.roomId}
                          </td>
                          <td className="p-6 text-sm text-muted-foreground">
                            {record.joinedAt ? (
                              <div className="flex items-center gap-2">
                                <Calendar className="w-3.5 h-3.5" />
                                {format(record.joinedAt, "MMM d, h:mm a")}
                              </div>
                            ) : "—"}
                          </td>
                          <td className="p-6 text-sm text-muted-foreground">
                            {record.leftAt ? (
                              <div className="flex items-center gap-2">
                                <LogOut className="w-3.5 h-3.5" />
                                {format(record.leftAt, "h:mm a")}
                              </div>
                            ) : "—"}
                          </td>
                          <td className="p-6 text-sm font-medium text-white">
                            <div className="flex items-center gap-2">
                              <Clock className="w-3.5 h-3.5 text-primary" />
                              {formatDuration(record.durationSeconds)}
                            </div>
                          </td>
                          <td className="p-6 text-right">
                            {!record.leftAt ? (
                              <Badge className="bg-green-500/10 text-green-400 border-green-500/20">
                                In Room
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-muted-foreground border-white/10">
                                Completed
                              </Badge>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
