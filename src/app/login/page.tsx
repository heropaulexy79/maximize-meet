"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Sparkles, ArrowRight, Mail, Lock } from "lucide-react";
import Link from "next/link";
import { auth, db } from "@/lib/firebase";
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast.success("Welcome back to the Academy!");
      router.push("/dashboard");
    } catch (error: any) {
      toast.error(error.message || "Failed to login");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Check if user exists in Firestore
      const userRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userRef);

      if (!userDoc.exists()) {
        // Initialize new user with student role
        await setDoc(userRef, {
          uid: user.uid,
          displayName: user.displayName,
          email: user.email,
          photoURL: user.photoURL,
          role: "student", // Explicitly non-admin
          createdAt: new Date().toISOString(),
        });
      }

      toast.success("Welcome to the Nation!");
      router.push("/dashboard");
    } catch (error: any) {
      toast.error(error.message || "Google login failed");
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden bg-luxe-gradient">
      {/* Cinematic Background Gradients */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-primary/20 blur-[150px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-indigo-500/10 blur-[150px] rounded-full" />
      </div>

      <motion.div
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-md z-10"
      >
        <Link href="/" className="flex items-center gap-4 justify-center mb-10 group">
          <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/30 group-hover:scale-110 transition-transform">
            <Sparkles className="w-7 h-7 text-primary-foreground" />
          </div>
          <span className="font-outfit text-3xl font-bold tracking-tight text-white">
            MAXIMIZE <span className="text-primary/80 font-medium text-xl uppercase tracking-[0.3em] ml-2">Academy</span>
          </span>
        </Link>

        <Card className="border-white/10 bg-black/40 backdrop-blur-3xl shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] overflow-hidden rounded-[2.5rem]">
          <CardHeader className="space-y-3 pt-10 pb-6 px-10">
            <CardTitle className="text-3xl font-outfit font-bold text-white text-center">Welcome Back</CardTitle>
            <CardDescription className="text-center text-white/50 text-base leading-relaxed">
              Enter your credentials to access the Room.
            </CardDescription>
          </CardHeader>
          
          <CardContent className="px-10 pb-8">
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <div className="relative group/input">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 group-focus-within/input:text-primary transition-colors" />
                  <Input
                    type="email"
                    placeholder="Email Address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-12 h-14 rounded-2xl bg-white/[0.05] border-white/10 focus:border-primary/50 transition-all text-white"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <div className="relative group/input">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 group-focus-within/input:text-primary transition-colors" />
                  <Input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-12 h-14 rounded-2xl bg-white/[0.05] border-white/10 focus:border-primary/50 transition-all text-white"
                    required
                  />
                </div>
              </div>
              <Button 
                type="submit" 
                disabled={loading}
                className="w-full h-14 rounded-2xl bg-primary hover:bg-primary/90 text-white font-bold text-lg transition-all shadow-xl shadow-primary/20 group/btn"
              >
                {loading ? "Authenticating..." : "Sign In"}
                <ArrowRight className="ml-2 w-5 h-5 group-hover/btn:translate-x-1 transition-transform" />
              </Button>
            </form>

            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase tracking-[0.2em] font-bold">
                <span className="bg-[#0a0a0a] px-4 text-white/30">Or continue with</span>
              </div>
            </div>

            <Button 
              variant="outline"
              onClick={handleGoogleLogin}
              className="w-full h-14 rounded-2xl border-white/10 bg-white/5 hover:bg-white/10 text-white font-bold flex items-center justify-center gap-3 transition-all"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              Google
            </Button>
          </CardContent>

          <CardFooter className="px-10 pb-10 justify-center border-t border-white/5 pt-6 bg-white/[0.01]">
            <p className="text-sm text-white/40">
              New to the Nation?{" "}
              <Link href="/signup" className="text-primary hover:underline font-bold">
                Join the Academy
              </Link>
            </p>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
}
