"use client";

import { useState } from "react";
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
import { Input } from "@/components/ui/input";
import { 
  Video, 
  ArrowLeft, 
  Calendar, 
  User, 
  Layers,
  Sparkles,
  CheckCircle2
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useEffect } from "react";

export default function CreateSessionPage() {
  const router = useRouter();
  const { user, isAdmin, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    instructor: "",
    time: "",
    cohort: "",
    status: "scheduled" as "upcoming" | "scheduled" | "live",
  });

  useEffect(() => {
    if (!authLoading && !isAdmin) {
      toast.error("Unauthorized access.");
      router.push("/dashboard");
    }
  }, [isAdmin, authLoading, router]);

  if (!isAdmin && !authLoading) {
    return null; // Don't render the page while redirecting
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error("You must be logged in to create a session");
      return;
    }
    
    setLoading(true);

    try {
      const idToken = await user.getIdToken();
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${idToken}`
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (data.success) {
        toast.success("Leadership Session Scheduled!");
        router.push("/dashboard");
      } else {
        toast.error(data.error || "Failed to create session");
      }
    } catch (error) {
      console.error("Error creating session:", error);
      toast.error("Failed to connect to the academy server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-black">
      <DashboardSidebar />
      
      <main className="flex-1 ml-64 p-10">
        <div className="max-w-3xl mx-auto space-y-8">
          {/* Back Link */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <Link 
              href="/dashboard" 
              className="inline-flex items-center gap-2 text-muted-foreground hover:text-white transition-colors group"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              Back to Overview
            </Link>
          </motion.div>

          {/* Header */}
          <div className="space-y-2">
            <h1 className="text-4xl font-outfit font-bold text-white">Schedule New Session</h1>
            <p className="text-muted-foreground text-lg">Create a new live leadership encounter for your cohorts.</p>
          </div>

          {/* Form Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="bg-white/[0.02] border-white/5 rounded-[2.5rem] overflow-hidden backdrop-blur-xl">
              <CardHeader className="p-10 pb-6 border-b border-white/5">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                    <Sparkles className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl font-bold text-white">Session Details</CardTitle>
                    <CardDescription>Fill in the coordinates for the upcoming session.</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-10">
                <form onSubmit={handleSubmit} className="space-y-8">
                  {/* Session Title */}
                  <div className="space-y-3">
                    <label className="text-sm font-semibold text-muted-foreground uppercase tracking-widest ml-1">
                      Session Title
                    </label>
                    <div className="relative">
                      <Video className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input 
                        placeholder="e.g. Strategic Visioning & Execution"
                        required
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        className="h-14 pl-12 rounded-2xl bg-white/[0.03] border-white/5 focus:border-primary/50 text-white text-lg"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Instructor */}
                    <div className="space-y-3">
                      <label className="text-sm font-semibold text-muted-foreground uppercase tracking-widest ml-1">
                        Instructor
                      </label>
                      <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <Input 
                          placeholder="Instructor Name"
                          required
                          value={formData.instructor}
                          onChange={(e) => setFormData({ ...formData, instructor: e.target.value })}
                          className="h-14 pl-12 rounded-2xl bg-white/[0.03] border-white/5 focus:border-primary/50 text-white"
                        />
                      </div>
                    </div>

                    {/* Time */}
                    <div className="space-y-3">
                      <label className="text-sm font-semibold text-muted-foreground uppercase tracking-widest ml-1">
                        Scheduled Time
                      </label>
                      <div className="relative">
                        <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <Input 
                          placeholder="e.g. Tomorrow, 4:00 PM"
                          required
                          value={formData.time}
                          onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                          className="h-14 pl-12 rounded-2xl bg-white/[0.03] border-white/5 focus:border-primary/50 text-white"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Cohort */}
                    <div className="space-y-3">
                      <label className="text-sm font-semibold text-muted-foreground uppercase tracking-widest ml-1">
                        Target Cohort
                      </label>
                      <div className="relative">
                        <Layers className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <Input 
                          placeholder="e.g. Cohort Alpha"
                          required
                          value={formData.cohort}
                          onChange={(e) => setFormData({ ...formData, cohort: e.target.value })}
                          className="h-14 pl-12 rounded-2xl bg-white/[0.03] border-white/5 focus:border-primary/50 text-white"
                        />
                      </div>
                    </div>

                    {/* Status */}
                    <div className="space-y-3">
                      <label className="text-sm font-semibold text-muted-foreground uppercase tracking-widest ml-1">
                        Initial Status
                      </label>
                      <select
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                        className="w-full h-14 px-4 rounded-2xl bg-white/[0.03] border border-white/5 focus:border-primary/50 text-white appearance-none cursor-pointer outline-none transition-colors"
                      >
                        <option value="scheduled" className="bg-black text-white">Scheduled</option>
                        <option value="upcoming" className="bg-black text-white">Upcoming</option>
                        <option value="live" className="bg-black text-white">Live Now</option>
                      </select>
                    </div>
                  </div>

                  <div className="pt-6">
                    <Button 
                      type="submit" 
                      disabled={loading}
                      className="w-full h-16 rounded-[1.5rem] bg-primary hover:bg-primary/90 text-white font-bold text-lg shadow-xl shadow-primary/20 transition-all active:scale-[0.98]"
                    >
                      {loading ? (
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                          Scheduling...
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-6 h-6" />
                          Launch Session
                        </div>
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
