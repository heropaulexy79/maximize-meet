"use client";

import { useChat } from "@livekit/components-react";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, X, MessageSquare, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";

export function ChatSidebar({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { chatMessages, send } = useChat();
  const [message, setMessage] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatMessages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && send) {
      await send(message);
      setMessage("");
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ x: 400 }}
          animate={{ x: 0 }}
          exit={{ x: 400 }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className="fixed top-0 right-0 h-[calc(100vh-96px)] w-96 bg-[#050505] border-l border-white/5 z-[60] flex flex-col shadow-2xl"
        >
          {/* Header */}
          <div className="p-6 border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="text-white font-bold font-outfit">Room Chat</h3>
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Leadership Session</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="rounded-full hover:bg-white/5 text-white/50 hover:text-white"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1 p-6" viewportRef={scrollRef}>
            <div className="space-y-6">
              {chatMessages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center pt-20 text-center space-y-4">
                  <div className="w-16 h-16 rounded-3xl bg-white/[0.02] border border-white/5 flex items-center justify-center">
                    <MessageSquare className="w-8 h-8 text-white/10" />
                  </div>
                  <p className="text-sm text-muted-foreground">No messages yet.<br/>Start the conversation.</p>
                </div>
              ) : (
                chatMessages.map((msg, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col gap-1.5"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-primary">
                        {msg.from?.name || msg.from?.identity || "Someone"}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className="bg-white/[0.03] border border-white/5 rounded-2xl rounded-tl-none p-3 text-sm text-white/90 leading-relaxed">
                      {msg.message}
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </ScrollArea>

          {/* Input */}
          <div className="p-6 border-t border-white/5 bg-black/40">
            <form onSubmit={handleSend} className="relative">
              <Input
                placeholder="Type your message..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="h-12 bg-white/[0.05] border-white/10 rounded-xl pr-12 focus:border-primary/50 text-white"
              />
              <Button
                type="submit"
                size="icon"
                disabled={!message.trim()}
                className="absolute right-1 top-1 w-10 h-10 rounded-lg bg-primary hover:bg-primary/90 text-white"
              >
                <Send className="w-4 h-4" />
              </Button>
            </form>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
