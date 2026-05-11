"use client";

import { useState, useEffect } from "react";
import { useRoomContext } from "@livekit/components-react";
import { motion, AnimatePresence } from "framer-motion";
import { HelpCircle, BarChart2, Plus, X, Send, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

type Poll = {
  id: string;
  question: string;
  options: { text: string; votes: number }[];
  creator: string;
};

type Question = {
  id: string;
  text: string;
  user: string;
  upvotes: number;
};

export function InteractionsSidebar({
  onClose,
}: {
  onClose: () => void;
}) {
  const room = useRoomContext();
  const [activeTab, setActiveTab] = useState<"polls" | "qa">("qa");
  const [polls, setPolls] = useState<Poll[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [newPollQuestion, setNewPollQuestion] = useState("");
  const [newQuestion, setNewQuestion] = useState("");

  // Listen for interactions
  useEffect(() => {
    if (!room) return;

    const handleData = (payload: Uint8Array, participant?: any) => {
      const decoder = new TextDecoder();
      try {
        const data = JSON.parse(decoder.decode(payload));
        if (data.type === "new-poll") {
          setPolls((prev) => [...prev, data.poll]);
          toast.info("New poll started!");
        } else if (data.type === "new-question") {
          setQuestions((prev) => [...prev, data.question]);
        } else if (data.type === "vote") {
          setPolls((prev) => prev.map(p => p.id === data.pollId ? {
            ...p,
            options: p.options.map((o, i) => i === data.optionIndex ? { ...o, votes: o.votes + 1 } : o)
          } : p));
        }
      } catch (e) {}
    };

    room.on("dataReceived", handleData);
    return () => { room.off("dataReceived", handleData); };
  }, [room]);

  const createPoll = async () => {
    if (!newPollQuestion.trim()) return;
    const poll: Poll = {
      id: Math.random().toString(36).substring(7),
      question: newPollQuestion,
      options: [{ text: "Yes", votes: 0 }, { text: "No", votes: 0 }],
      creator: "Admin",
    };
    
    const data = JSON.stringify({ type: "new-poll", poll });
    await room?.localParticipant.publishData(new TextEncoder().encode(data), { reliable: true });
    setPolls(prev => [...prev, poll]);
    setNewPollQuestion("");
  };

  const askQuestion = async () => {
    if (!newQuestion.trim()) return;
    const q: Question = {
      id: Math.random().toString(36).substring(7),
      text: newQuestion,
      user: "You",
      upvotes: 0,
    };
    
    const data = JSON.stringify({ type: "new-question", question: q });
    await room?.localParticipant.publishData(new TextEncoder().encode(data), { reliable: true });
    setQuestions(prev => [...prev, q]);
    setNewQuestion("");
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-8 border-b border-white/5 flex items-center justify-between">
        <div className="flex bg-white/[0.04] p-1.5 rounded-2xl border border-white/5">
          <button
            onClick={() => setActiveTab("qa")}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all uppercase tracking-widest ${activeTab === 'qa' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-white/40 hover:text-white'}`}
          >
            Q&A
          </button>
          <button
            onClick={() => setActiveTab("polls")}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all uppercase tracking-widest ${activeTab === 'polls' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-white/40 hover:text-white'}`}
          >
            Polls
          </button>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full hover:bg-white/5 text-white/40">
          <X className="w-5 h-5" />
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-8 space-y-8">
          {activeTab === "qa" ? (
            <div className="space-y-8">
              <div className="space-y-3">
                <h4 className="text-sm font-bold text-white uppercase tracking-widest opacity-80">Ask a Question</h4>
                <div className="relative">
                  <Input
                    placeholder="Type your question..."
                    value={newQuestion}
                    onChange={(e) => setNewQuestion(e.target.value)}
                    className="bg-white/[0.05] border-white/10 pr-14 h-14 rounded-2xl text-sm"
                  />
                  <Button onClick={askQuestion} size="icon" className="absolute right-2 top-2 w-10 h-10 rounded-xl shadow-lg shadow-primary/20">
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-4">
                {questions.map((q) => (
                  <motion.div key={q.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-5 bg-white/[0.03] border border-white/5 rounded-[2rem] space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] text-primary font-bold uppercase tracking-[0.2em]">{q.user}</span>
                      <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-[9px] px-2 py-0.5 rounded-full font-bold">{q.upvotes} UPVOTES</Badge>
                    </div>
                    <p className="text-sm text-white/80 leading-relaxed font-medium">{q.text}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-8">
              <div className="space-y-3">
                <h4 className="text-sm font-bold text-white uppercase tracking-widest opacity-80">Create a Poll</h4>
                <div className="flex gap-3">
                  <Input
                    placeholder="Poll question..."
                    value={newPollQuestion}
                    onChange={(e) => setNewPollQuestion(e.target.value)}
                    className="bg-white/[0.05] border-white/10 h-14 rounded-2xl text-sm"
                  />
                  <Button onClick={createPoll} size="icon" className="w-14 h-14 rounded-2xl shrink-0 shadow-lg shadow-primary/20"><Plus className="w-6 h-6" /></Button>
                </div>
              </div>

              <div className="space-y-5">
                {polls.map((p) => (
                  <div key={p.id} className="p-6 bg-white/[0.03] border border-white/5 rounded-[2rem] space-y-5">
                    <h5 className="text-sm font-bold text-white leading-relaxed">{p.question}</h5>
                    <div className="space-y-3">
                      {p.options.map((opt, i) => (
                        <button key={i} className="w-full p-4 rounded-2xl bg-white/[0.05] hover:bg-white/10 border border-white/5 flex justify-between items-center transition-all group active:scale-[0.98]">
                          <span className="text-xs font-bold text-white/70 group-hover:text-white uppercase tracking-widest">{opt.text}</span>
                          <span className="text-[10px] font-mono text-muted-foreground">{opt.votes} VOTES</span>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
