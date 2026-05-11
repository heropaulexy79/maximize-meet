"use client";

import { useChat } from "@livekit/components-react";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, X, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export function ChatSidebar({
  onClose,
  onUnreadChange,
}: {
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

        toast(`💬 ${senderName}`, {
          description: preview,
          duration: 5000,
        });
        setUnread((u) => {
          const next = u + 1;
          onUnreadChange?.(next);
          return next;
        });
      });
    }

    prevCountRef.current = currentCount;
  }, [chatMessages, onUnreadChange]);

  // Clear unread
  useEffect(() => {
    setUnread(0);
    onUnreadChange?.(0);
  }, [onUnreadChange]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && send) {
      await send(message);
      setMessage("");
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-8 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/10">
            <MessageSquare className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h3 className="text-white font-bold font-heading text-lg">Room Chat</h3>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-0.5">Leadership Session</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="rounded-full hover:bg-white/5 text-white/40"
        >
          <X className="w-5 h-5" />
        </Button>
      </div>

      {/* Messages */}
      <div className="flex-1 min-h-0 overflow-y-auto p-8 scroll-smooth">
        <div className="space-y-8 pb-4">
          {chatMessages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center pt-20 text-center space-y-6">
              <div className="w-20 h-20 rounded-[2rem] bg-white/[0.02] border border-white/5 flex items-center justify-center">
                <MessageSquare className="w-10 h-10 text-white/10" />
              </div>
              <p className="text-sm text-muted-foreground font-medium">No messages yet.<br/>Start the conversation.</p>
            </div>
          ) : (
            chatMessages.map((msg, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col gap-2"
              >
                <div className="flex items-center gap-3">
                  <span className="text-[11px] font-bold text-primary uppercase tracking-widest">
                    {msg.from?.name || msg.from?.identity || "Someone"}
                  </span>
                  <span className="text-[10px] text-muted-foreground font-mono">
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div className="bg-white/[0.04] border border-white/5 rounded-2xl rounded-tl-none p-4 text-sm text-white/90 leading-relaxed shadow-sm">
                  {msg.message}
                </div>
              </motion.div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="p-8 border-t border-white/5 bg-white/[0.01]">
        <form onSubmit={handleSend} className="relative">
          <Input
            placeholder="Type your message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="h-14 bg-white/[0.05] border-white/10 rounded-2xl pr-14 focus:border-primary/50 text-white text-sm"
          />
          <Button
            type="submit"
            size="icon"
            disabled={!message.trim()}
            className="absolute right-2 top-2 w-10 h-10 rounded-xl bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 transition-all"
          >
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}

