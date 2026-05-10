"use client";

import { useChat } from "@livekit/components-react";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, X, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export function ChatSidebar({
  open,
  onClose,
  onUnreadChange,
}: {
  open: boolean;
  onClose: () => void;
  onUnreadChange?: (count: number) => void;
}) {
  const { chatMessages, send } = useChat();
  const [message, setMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const prevCountRef = useRef(0);
  const [unread, setUnread] = useState(0);

  // Detect new incoming messages
  useEffect(() => {
    const currentCount = chatMessages.length;
    const prevCount = prevCountRef.current;

    if (currentCount > prevCount) {
      const newMsgs = chatMessages.slice(prevCount);
      newMsgs.forEach((msg) => {
        const senderName = msg.from?.name || msg.from?.identity || "Someone";
        const preview = msg.message.length > 50 ? msg.message.slice(0, 50) + "…" : msg.message;

        // Always show toast (even to the sender's own session it's a new message for others)
        // Only show toast if chat is closed — otherwise they're already reading it
        if (!open) {
          toast(`💬 ${senderName}`, {
            description: preview,
            action: {
              label: "Open Chat",
              onClick: () => onClose(), // triggers parent to open
            },
            duration: 5000,
          });
          setUnread((u) => {
            const next = u + 1;
            onUnreadChange?.(next);
            return next;
          });
        }
      });
    }

    prevCountRef.current = currentCount;
  }, [chatMessages, open]);

  // Clear unread when chat is opened
  useEffect(() => {
    if (open) {
      setUnread(0);
      onUnreadChange?.(0);
    }
  }, [open]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, open]);

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
          className="fixed top-0 right-0 h-[calc(100vh-80px)] md:h-[calc(100vh-96px)] w-full md:w-96 bg-[#050505] border-l border-white/5 z-[60] flex flex-col shadow-2xl"
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
          <div className="flex-1 min-h-0 overflow-y-auto p-6 scroll-smooth">
            <div className="space-y-6 pb-4">
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
              <div ref={messagesEndRef} />
            </div>
          </div>

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

