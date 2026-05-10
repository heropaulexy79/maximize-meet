"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { 
  LayoutDashboard, 
  Video, 
  BookOpen, 
  Users, 
  ShieldCheck, 
  Settings, 
  LogOut,
  Sparkles
} from "lucide-react";
import { cn } from "@/lib/utils";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

const menuItems = [
  { icon: LayoutDashboard, label: "Overview", href: "/dashboard" },
  { icon: Video, label: "Sessions", href: "/dashboard/sessions" },
  { icon: Users, label: "Attendance", href: "/dashboard/attendance" },
  { icon: BookOpen, label: "Vault", href: "/vault" },
  { icon: Users, label: "Cohorts", href: "/dashboard/cohorts" },
  { icon: ShieldCheck, label: "Leadership", href: "/dashboard/leadership" },
];

export function DashboardSidebar() {
  const pathname = usePathname();
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
    <div className="w-64 h-screen border-r border-white/5 bg-black/40 backdrop-blur-3xl flex flex-col p-6 fixed left-0 top-0 z-40">
      <Link href="/dashboard" className="flex items-center gap-3 mb-10 px-2">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
          <Sparkles className="w-5 h-5 text-primary-foreground" />
        </div>
        <span className="font-outfit text-xl font-bold tracking-tight text-white">
          MAXIMIZE
        </span>
      </Link>

      <div className="flex-1 space-y-2">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link key={item.href} href={item.href}>
              <div className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group",
                isActive 
                  ? "bg-primary/10 text-primary border border-primary/20" 
                  : "text-muted-foreground hover:text-white hover:bg-white/5"
              )}>
                <item.icon className={cn(
                  "w-5 h-5",
                  isActive ? "text-primary" : "text-muted-foreground group-hover:text-white"
                )} />
                <span className="font-medium">{item.label}</span>
                {isActive && (
                  <motion.div
                    layoutId="active-pill"
                    className="ml-auto w-1.5 h-1.5 rounded-full bg-primary"
                  />
                )}
              </div>
            </Link>
          );
        })}
      </div>

      <div className="pt-6 mt-6 border-t border-white/5 space-y-2">
        <Link href="/profile">
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl text-muted-foreground hover:text-white hover:bg-white/5 transition-all">
            <Settings className="w-5 h-5" />
            <span className="font-medium">Settings</span>
          </div>
        </Link>
        <button 
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-all"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Sign Out</span>
        </button>
      </div>
    </div>
  );
}
