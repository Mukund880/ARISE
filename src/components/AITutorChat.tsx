"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, X, Send, Brain, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useParams } from "next/navigation";
import { useMascot } from "@/context/MascotContext";
import { AriseMascot } from "@/components/AriseMascot";

export function AITutorChat() {
  const params = useParams();
  const { triggerEmotion } = useMascot();
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [history, setHistory] = useState<{role: 'user'|'assistant', content: string}[]>([
    { role: 'assistant', content: "Hello! I am ARIS, your Interactive Study Companion. 🚀 Need help understanding a concept, coding up an example, or running through your learning modules? Ask me anything!" }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [history, isTyping]);

  const handleSend = async () => {
    if (!message.trim() || isTyping) return;
    
    const userMsg = message.trim();
    setMessage("");
    const newHistory = [...history, { role: 'user' as const, content: userMsg }];
    setHistory(newHistory);
    setIsTyping(true);
    triggerEmotion("thinking", 15000);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMsg,
          history: newHistory.slice(0, -1), // Send previous history
          topicId: params.topicId // Will be undefined if not in a topic, which is fine
        })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      setHistory([...newHistory, { role: 'assistant', content: data.response }]);
      triggerEmotion("happy", 2500);
    } catch (err) {
      console.error(err);
      setHistory([...newHistory, { role: 'assistant', content: "Sorry, I encountered a network error. Please try again." }]);
      triggerEmotion("confused", 2500);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <>
      {/* Floating Action Button */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-r from-indigo-500 to-cyan-500 rounded-full flex items-center justify-center shadow-lg shadow-indigo-500/25 z-50 text-white ${isOpen ? 'hidden' : 'flex'}`}
      >
        <MessageSquare className="w-6 h-6" />
      </motion.button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 right-6 w-[380px] h-[600px] max-h-[85vh] bg-white border border-slate-200/80 rounded-3xl shadow-2xl z-50 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 bg-slate-50 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 overflow-hidden">
                  <AriseMascot size={32} interactive={false} state="idle" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-800">ARIS Companion</h3>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Online & Context Aware</span>
                  </div>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-700 p-2 rounded-lg hover:bg-slate-100 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#FDFBF7]/50">
              {history.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`flex gap-3 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                    <div className={`w-8 h-8 rounded-full flex shrink-0 items-center justify-center border border-slate-100 ${msg.role === 'user' ? 'bg-cyan-50 text-cyan-600' : 'bg-transparent overflow-hidden'}`}>
                      {msg.role === 'user' ? <User className="w-4 h-4" /> : <AriseMascot size={26} interactive={false} state="happy" />}
                    </div>
                    <div className={`p-3.5 rounded-2xl text-xs leading-relaxed font-semibold ${msg.role === 'user' ? 'bg-cyan-500/10 text-cyan-800 border border-cyan-500/20 rounded-tr-sm' : 'bg-white text-slate-700 border border-slate-200/50 rounded-tl-sm shadow-sm'}`}>
                      {msg.content}
                    </div>
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="flex gap-3 max-w-[85%] flex-row">
                    <div className="w-8 h-8 rounded-full bg-transparent border border-slate-100 overflow-hidden flex items-center justify-center">
                      <AriseMascot size={26} interactive={false} state="thinking" />
                    </div>
                    <div className="p-3.5 rounded-2xl bg-white text-slate-700 border border-slate-200/50 rounded-tl-sm flex gap-1 items-center shadow-sm">
                      <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" />
                      <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
                      <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "0.4s" }} />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 bg-slate-50 border-t border-slate-100">
              <div className="relative">
                <Input
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Ask a question..."
                  className="pr-12 bg-white border-slate-200 text-slate-800 placeholder:text-slate-450 focus:border-indigo-500 h-12 rounded-xl"
                  disabled={isTyping}
                />
                <Button 
                  size="icon" 
                  onClick={handleSend}
                  disabled={!message.trim() || isTyping}
                  className="absolute right-1 top-1 bottom-1 h-10 w-10 bg-indigo-600 hover:bg-indigo-750 rounded-xl text-white shadow-sm active:scale-95 transition-transform"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
