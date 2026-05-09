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
  open,
  onClose,
}: {
  open: boolean;
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
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ x: 400 }}
          animate={{ x: 0 }}
          exit={{ x: 400 }}
          className="fixed top-0 right-0 h-[calc(100vh-80px)] md:h-[calc(100vh-96px)] w-full md:w-96 bg-[#050505] border-l border-white/5 z-[60] flex flex-col shadow-2xl"
        >
          <div className="p-6 border-b border-white/5 flex items-center justify-between">
            <div className="flex bg-white/[0.03] p-1 rounded-xl">
              <button
                onClick={() => setActiveTab("qa")}
                className={`px-4 py-2 rounded-lg text-xs font-medium transition-all ${activeTab === 'qa' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-white/50 hover:text-white'}`}
              >
                Q&A
              </button>
              <button
                onClick={() => setActiveTab("polls")}
                className={`px-4 py-2 rounded-lg text-xs font-medium transition-all ${activeTab === 'polls' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-white/50 hover:text-white'}`}
              >
                Polls
              </button>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full hover:bg-white/5">
              <X className="w-5 h-5 text-white/50" />
            </Button>
          </div>

          <ScrollArea className="flex-1 p-6">
            {activeTab === "qa" ? (
              <div className="space-y-6">
                <div className="space-y-2">
                  <h4 className="text-sm font-bold text-white">Ask a Question</h4>
                  <div className="relative">
                    <Input
                      placeholder="Type your question..."
                      value={newQuestion}
                      onChange={(e) => setNewQuestion(e.target.value)}
                      className="bg-white/[0.05] border-white/10 pr-12 h-12 rounded-xl"
                    />
                    <Button onClick={askQuestion} size="icon" className="absolute right-1 top-1 w-10 h-10 rounded-lg">
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-4">
                  {questions.map((q) => (
                    <motion.div key={q.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 bg-white/[0.03] border border-white/5 rounded-2xl space-y-2">
                      <div className="flex justify-between items-start">
                        <span className="text-[10px] text-primary font-bold uppercase tracking-wider">{q.user}</span>
                        <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-[10px]">{q.upvotes} upvotes</Badge>
                      </div>
                      <p className="text-sm text-white/80">{q.text}</p>
                    </motion.div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="space-y-2">
                  <h4 className="text-sm font-bold text-white">Create a Poll</h4>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Poll question..."
                      value={newPollQuestion}
                      onChange={(e) => setNewPollQuestion(e.target.value)}
                      className="bg-white/[0.05] border-white/10 h-12 rounded-xl"
                    />
                    <Button onClick={createPoll} size="icon" className="w-12 h-12 rounded-xl"><Plus /></Button>
                  </div>
                </div>

                <div className="space-y-4">
                  {polls.map((p) => (
                    <div key={p.id} className="p-4 bg-white/[0.03] border border-white/5 rounded-2xl space-y-4">
                      <h5 className="text-sm font-bold text-white">{p.question}</h5>
                      <div className="space-y-2">
                        {p.options.map((opt, i) => (
                          <button key={i} className="w-full p-3 rounded-xl bg-white/[0.05] hover:bg-white/10 border border-white/5 flex justify-between items-center transition-all group">
                            <span className="text-xs text-white/70 group-hover:text-white">{opt.text}</span>
                            <span className="text-[10px] text-muted-foreground">{opt.votes} votes</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </ScrollArea>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
