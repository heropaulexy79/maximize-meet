"use client";

import { motion } from "framer-motion";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { ArrowRight, Users, Trophy, PlayCircle, Star } from "lucide-react";
import Link from "next/link";

export default function LandingPage() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 },
  };

  return (
    <div className="relative min-h-screen flex flex-col overflow-hidden selection:bg-primary/30">
      {/* Cinematic Background Gradients */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/20 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-primary/10 blur-[120px] rounded-full" />
        <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] bg-indigo-500/10 blur-[100px] rounded-full" />
      </div>

      <Navbar />

      <main className="relative z-10 flex-1 flex flex-col items-center justify-center pt-32 px-6 pb-20">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="max-w-5xl w-full flex flex-col items-center text-center space-y-12"
        >
          {/* Badge */}
          <motion.div variants={itemVariants}>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/20 bg-primary/5 backdrop-blur-md">
              <Star className="w-4 h-4 text-primary" />
              <span className="text-xs font-semibold uppercase tracking-widest text-primary/80">
                The Maximize Nation Leadership Academy
              </span>
            </div>
          </motion.div>

          {/* Hero Content */}
          <motion.div variants={itemVariants} className="space-y-6">
            <h1 className="font-outfit text-5xl md:text-7xl font-bold tracking-tight text-white leading-[1.1]">
              Elevate Your <span className="bg-gradient-to-r from-primary to-indigo-400 bg-clip-text text-transparent">Leadership</span> <br />
              to the Next Dimension.
            </h1>
            <p className="max-w-2xl mx-auto text-lg md:text-xl text-muted-foreground leading-relaxed">
              Experience transformational mentorship and elite cohort-based learning 
              designed for high-impact leaders. Welcome to the digital campus of tomorrow.
            </p>
          </motion.div>

          {/* CTA Buttons */}
          <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-6">
            <Link href="/signup">
              <Button size="lg" className="h-14 px-10 rounded-full text-lg font-medium group bg-primary hover:bg-primary/90 transition-all duration-300 shadow-lg shadow-primary/20">
                Enter the Leadership Room
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link href="#vault">
              <Button size="lg" variant="outline" className="h-14 px-10 rounded-full text-lg font-medium border-white/10 bg-white/5 hover:bg-white/10 backdrop-blur-sm transition-all duration-300">
                Explore Replay Vault
              </Button>
            </Link>
          </motion.div>

          {/* Stats/Proof */}
          <motion.div
            variants={itemVariants}
            className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-12 w-full max-w-4xl"
          >
            {[
              { icon: Users, label: "Active Leaders", value: "2,500+" },
              { icon: PlayCircle, label: "Academy Sessions", value: "480+" },
              { icon: Trophy, label: "Transformations", value: "15,000+" },
            ].map((stat, idx) => (
              <div key={idx} className="flex flex-col items-center p-6 rounded-3xl border border-white/5 bg-white/[0.02] backdrop-blur-sm">
                <stat.icon className="w-8 h-8 text-primary/60 mb-3" />
                <div className="text-2xl font-bold text-white font-outfit">{stat.value}</div>
                <div className="text-sm text-muted-foreground uppercase tracking-widest">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </main>

      {/* Subtle Bottom Glow */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full h-[200px] bg-gradient-to-t from-primary/5 to-transparent pointer-events-none" />
    </div>
  );
}
