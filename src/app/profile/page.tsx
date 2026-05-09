"use client";

import { DashboardSidebar } from "@/components/layout/DashboardSidebar";
import { motion } from "framer-motion";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription,
  CardFooter
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { 
  User, 
  Mail, 
  Shield, 
  Bell, 
  CreditCard,
  Camera,
  ChevronRight,
  LogOut
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function ProfilePage() {
  const { user } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast.success("Logged out successfully");
      router.push("/login");
    } catch (error) {
      toast.error("Failed to log out");
    }
  };

  return (
    <div className="flex min-h-screen bg-black">
      <DashboardSidebar />
      
      <main className="flex-1 ml-64 p-10">
        <div className="max-w-4xl mx-auto space-y-10">
          <div>
            <h1 className="text-4xl font-outfit font-bold text-white mb-2">Profile Settings</h1>
            <p className="text-muted-foreground text-lg">Manage your account and academy preferences.</p>
          </div>

          <div className="space-y-8">
            {/* Account Information */}
            <Card className="bg-white/[0.02] border-white/5 rounded-[2.5rem] p-10 backdrop-blur-xl">
              <div className="flex items-start justify-between mb-10">
                <div className="flex items-center gap-6">
                  <div className="relative group">
                    <Avatar className="w-24 h-24 border-4 border-white/5 shadow-2xl">
                      <AvatarImage src={user?.photoURL || ""} />
                      <AvatarFallback className="bg-primary text-white text-2xl font-bold">
                        {user?.displayName?.charAt(0) || user?.email?.charAt(0) || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                      <Camera className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-1">{user?.displayName || "Leader"}</h2>
                    <p className="text-muted-foreground uppercase tracking-widest text-xs font-semibold">Leadership Academy Member</p>
                  </div>
                </div>
                <Button variant="outline" className="rounded-xl border-white/10 bg-white/5 text-white">
                  Edit Photo
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground ml-1">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input 
                      defaultValue={user?.displayName || ""}
                      className="pl-12 h-14 rounded-2xl bg-white/[0.03] border-white/5 focus:border-primary/50 text-white"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground ml-1">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input 
                      defaultValue={user?.email || ""}
                      disabled
                      className="pl-12 h-14 rounded-2xl bg-white/[0.03] border-white/5 text-muted-foreground cursor-not-allowed"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-10 flex justify-end">
                <Button className="rounded-xl bg-primary hover:bg-primary/90 text-white px-8 h-12 font-medium">
                  Save Changes
                </Button>
              </div>
            </Card>

            {/* Other Sections */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <Card className="bg-white/[0.02] border-white/5 rounded-[2.5rem] p-8 hover:bg-white/[0.03] transition-colors cursor-pointer group">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-2xl bg-blue-500/10">
                      <Shield className="w-6 h-6 text-blue-400" />
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-lg">Security</h3>
                      <p className="text-sm text-muted-foreground">Passwords and 2FA</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-white transition-colors" />
                </div>
              </Card>

              <Card className="bg-white/[0.02] border-white/5 rounded-[2.5rem] p-8 hover:bg-white/[0.03] transition-colors cursor-pointer group">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-2xl bg-purple-500/10">
                      <Bell className="w-6 h-6 text-purple-400" />
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-lg">Notifications</h3>
                      <p className="text-sm text-muted-foreground">Preferences and alerts</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-white transition-colors" />
                </div>
              </Card>

              <Card className="bg-white/[0.02] border-white/5 rounded-[2.5rem] p-8 hover:bg-white/[0.03] transition-colors cursor-pointer group">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-2xl bg-green-500/10">
                      <CreditCard className="w-6 h-6 text-green-400" />
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-lg">Subscription</h3>
                      <p className="text-sm text-muted-foreground">Manage your plan</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-white transition-colors" />
                </div>
              </Card>

              <Card className="bg-white/[0.02] border-white/5 rounded-[2.5rem] p-8 hover:bg-red-500/5 border-red-500/0 hover:border-red-500/20 transition-all cursor-pointer group" onClick={handleLogout}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-2xl bg-red-500/10">
                      <LogOut className="w-6 h-6 text-red-400" />
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-lg">Sign Out</h3>
                      <p className="text-sm text-muted-foreground">Log out from all devices</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-red-400 transition-colors" />
                </div>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
