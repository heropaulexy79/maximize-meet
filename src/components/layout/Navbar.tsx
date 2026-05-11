"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export function Navbar() {
  const [isScrolled, setIsScrolled] = React.useState(false);

  React.useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-500 flex justify-center",
        isScrolled ? "p-4" : "p-8"
      )}
    >
      <nav className={cn(
        "flex items-center justify-between w-full max-w-5xl px-8 py-3 rounded-[2rem] transition-all duration-500",
        isScrolled 
          ? "glass shadow-2xl shadow-black/50 border-white/10" 
          : "bg-transparent border-transparent"
      )}>
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20 group-hover:scale-110 transition-transform duration-500">
            <Sparkles className="w-6 h-6 text-primary-foreground" />
          </div>
          <div className="flex flex-col">
            <span className="font-heading text-lg font-bold tracking-[0.1em] text-white leading-none">
              MAXIMIZE
            </span>
            <span className="text-[9px] uppercase tracking-[0.2em] text-primary font-bold mt-1">
              Nation Academy
            </span>
          </div>
        </Link>

        <div className="hidden md:flex items-center gap-10">
          {["Cohorts", "Leadership", "Vault"].map((item) => (
            <Link 
              key={item}
              href={`#${item.toLowerCase()}`} 
              className="text-sm font-semibold text-muted-foreground hover:text-primary transition-all duration-300 relative group"
            >
              {item}
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full" />
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-6">
          <Link href="/login">
            <Button variant="luxe" className="rounded-full px-10 h-12 font-bold tracking-wide shadow-xl shadow-primary/20">
              Enter Academy
            </Button>
          </Link>
        </div>
      </nav>
    </motion.header>
  );
}
