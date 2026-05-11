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
import { useAuth } from "@/context/AuthContext";

const menuItems = [
  { icon: LayoutDashboard, label: "Overview", href: "/dashboard", adminOnly: false },
  { icon: Video, label: "Sessions", href: "/dashboard/sessions", adminOnly: false },
  { icon: Users, label: "Attendance", href: "/dashboard/attendance", adminOnly: true },
  { icon: BookOpen, label: "Vault", href: "/vault", adminOnly: false },
  { icon: Users, label: "Cohorts", href: "/dashboard/cohorts", adminOnly: true },
  { icon: ShieldCheck, label: "Leadership", href: "/dashboard/leadership", adminOnly: false },
];

export function DashboardSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { isAdmin } = useAuth();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast.success("Logged out successfully");
      router.push("/login");
    } catch (error) {
      toast.error("Failed to log out");
    }
  };

  const visibleMenuItems = menuItems.filter(item => !item.adminOnly || isAdmin);

  return (
    <div className="w-72 h-screen glass border-r border-white/5 flex flex-col fixed left-0 top-0 z-40 overflow-hidden">
      {/* Background Accent */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/50 to-transparent" />
      
      <div className="p-8">
        <Link href="/dashboard" className="flex items-center gap-3 px-2 group">
          <div className="w-10 h-10 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20 group-hover:scale-110 transition-transform duration-500">
            <Sparkles className="w-6 h-6 text-primary-foreground" />
          </div>
          <div className="flex flex-col">
            <span className="font-heading text-xl font-bold tracking-[0.2em] text-white leading-none">
              MAXIMIZE
            </span>
            <span className="text-[10px] uppercase tracking-[0.3em] text-primary font-bold mt-1">
              Nation Academy
            </span>
          </div>
        </Link>
      </div>

      <div className="flex-1 px-4 space-y-1.5 overflow-y-auto custom-scrollbar">
        {visibleMenuItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link key={item.href} href={item.href}>
              <div className={cn(
                "flex items-center gap-4 px-5 py-3.5 rounded-2xl transition-all duration-300 group relative",
                isActive 
                  ? "text-primary" 
                  : "text-muted-foreground hover:text-white hover:bg-white/[0.03]"
              )}>
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active"
                    className="absolute inset-0 bg-primary/5 border border-primary/10 rounded-2xl"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                
                <item.icon className={cn(
                  "w-5 h-5 relative z-10 transition-transform duration-300 group-hover:scale-110",
                  isActive ? "text-primary" : "text-muted-foreground group-hover:text-white"
                )} />
                <span className="font-medium tracking-wide relative z-10">{item.label}</span>
                
                {isActive && (
                  <div className="absolute right-4 w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_10px_var(--color-primary)]" />
                )}
              </div>
            </Link>
          );
        })}
      </div>

      <div className="p-6 mt-auto border-t border-white/5 space-y-1">
        <Link href="/profile">
          <div className="flex items-center gap-4 px-5 py-3.5 rounded-2xl text-muted-foreground hover:text-white hover:bg-white/[0.03] transition-all group">
            <Settings className="w-5 h-5 group-hover:rotate-45 transition-transform duration-500" />
            <span className="font-medium tracking-wide">Settings</span>
          </div>
        </Link>
        <button 
          onClick={handleLogout}
          className="w-full flex items-center gap-4 px-5 py-3.5 rounded-2xl text-muted-foreground hover:text-red-400 hover:bg-red-400/5 transition-all group"
        >
          <LogOut className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span className="font-medium tracking-wide">Sign Out</span>
        </button>
      </div>
    </div>
  );
}
