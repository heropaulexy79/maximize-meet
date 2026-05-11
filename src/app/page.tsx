"use client";

import { motion, Variants } from "framer-motion";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { ArrowRight, Users, Trophy, PlayCircle, Star, Sparkles } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function LandingPage() {
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.25 },
    },
  };

  const itemVariants: Variants = {
    hidden: { y: 40, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: { duration: 0.8, ease: "easeOut" }
    },
  };

  return (
    <div className="relative min-h-screen flex flex-col overflow-hidden bg-luxe-gradient selection:bg-primary/30">
      <Navbar />

      <main className="relative z-10 flex-1 flex flex-col items-center justify-center pt-40 px-6 pb-32">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="max-w-6xl w-full flex flex-col items-center text-center space-y-16"
        >
          {/* Badge */}
          <motion.div variants={itemVariants}>
            <div className="inline-flex items-center gap-3 px-6 py-2 rounded-full border border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl">
              <Star className="w-4 h-4 text-primary animate-pulse" />
              <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/60">
                The Maximize Nation Leadership Academy
              </span>
            </div>
          </motion.div>

          {/* Hero Content */}
          <motion.div variants={itemVariants} className="space-y-10">
            <h1 className="font-heading text-6xl md:text-8xl font-bold tracking-tight text-white leading-[1.05]">
              Forge Your <span className="text-primary italic">Legacy</span>. <br />
              Lead with <span className="bg-gradient-to-r from-primary to-royal-blue bg-clip-text text-transparent">Authority</span>.
            </h1>
            <p className="max-w-3xl mx-auto text-xl md:text-2xl text-muted-foreground leading-relaxed font-medium opacity-80">
              Transformational mentorship for the next generation of global leaders. 
              Join a community of elite cohorts and master the art of high-impact leadership.
            </p>
          </motion.div>

          {/* CTA Buttons */}
          <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-8">
            <Link href="/signup">
              <Button variant="luxe" className="h-16 px-12 rounded-[2rem] text-xl font-bold group shadow-2xl shadow-primary/30">
                Join the Nation
                <ArrowRight className="ml-3 w-6 h-6 group-hover:translate-x-2 transition-transform duration-500" />
              </Button>
            </Link>
            <Link href="#vault">
              <Button variant="outline" className="h-16 px-12 rounded-[2rem] text-xl font-bold border-white/10 bg-white/5 hover:bg-white/10 backdrop-blur-xl transition-all duration-500">
                Explore the Vault
              </Button>
            </Link>
          </motion.div>

          {/* Stats/Proof */}
          <motion.div
            variants={itemVariants}
            className="grid grid-cols-1 md:grid-cols-3 gap-12 pt-16 w-full max-w-5xl"
          >
            {[
              { icon: Users, label: "Active Leaders", value: "2.5K+", color: "primary" },
              { icon: PlayCircle, label: "Academy Sessions", value: "480+", color: "indigo" },
              { icon: Trophy, label: "Transformations", value: "15K+", color: "amber" },
            ].map((stat, idx) => (
              <div key={idx} className="group flex flex-col items-center p-10 rounded-[3rem] border border-white/5 bg-white/[0.01] backdrop-blur-md hover:bg-white/[0.03] hover:border-white/10 transition-all duration-700">
                <div className={cn(
                  "w-16 h-16 rounded-2xl flex items-center justify-center mb-6 transition-transform duration-500 group-hover:scale-110 shadow-lg",
                  stat.color === "primary" ? "bg-primary/10 text-primary" :
                  stat.color === "indigo" ? "bg-indigo-500/10 text-indigo-400" :
                  "bg-amber-500/10 text-amber-400"
                )}>
                  <stat.icon className="w-8 h-8" />
                </div>
                <div className="text-4xl font-heading font-bold text-white mb-2 tracking-tight">{stat.value}</div>
                <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </main>

      {/* Cinematic Overlays */}
      <div className="absolute top-0 left-0 w-full h-[600px] bg-gradient-to-b from-primary/10 to-transparent pointer-events-none opacity-50" />
      <div className="absolute bottom-0 left-0 w-full h-[400px] bg-gradient-to-t from-black to-transparent pointer-events-none" />
      
      <Sparkles className="absolute top-1/4 right-1/4 w-32 h-32 text-primary/10 animate-pulse blur-2xl" />
      <Sparkles className="absolute bottom-1/4 left-1/4 w-48 h-48 text-indigo-500/10 animate-pulse blur-3xl" />
    </div>
  );
}
