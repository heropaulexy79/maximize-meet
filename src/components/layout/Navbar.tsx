"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";

export function Navbar() {
  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-center p-6"
    >
      <nav className="flex items-center justify-between w-full max-w-7xl px-6 py-3 rounded-full border border-white/10 bg-black/50 backdrop-blur-xl">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="font-outfit text-xl font-bold tracking-tight text-white">
            MAXIMIZE <span className="text-primary/80 font-medium text-lg uppercase tracking-widest ml-1">Academy</span>
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-8">
          <Link href="#cohorts" className="text-sm font-medium text-muted-foreground hover:text-white transition-colors">
            Cohorts
          </Link>
          <Link href="#leadership" className="text-sm font-medium text-muted-foreground hover:text-white transition-colors">
            Leadership
          </Link>
          <Link href="#vault" className="text-sm font-medium text-muted-foreground hover:text-white transition-colors">
            Vault
          </Link>
        </div>

        <div className="flex items-center gap-4">
          <Link href="/login">
            <Button variant="ghost" className="text-sm font-medium text-muted-foreground hover:text-white">
              Log in
            </Button>
          </Link>
          <Link href="/signup">
            <Button className="rounded-full px-6 bg-primary hover:bg-primary/90 text-primary-foreground">
              Join the Nation
            </Button>
          </Link>
        </div>
      </nav>
    </motion.header>
  );
}
