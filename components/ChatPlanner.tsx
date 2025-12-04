import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, UserProfile } from '../types';
import { chatWithCitySense } from '../services/geminiService';
import ReactMarkdown from 'react-markdown';

interface ChatPlannerProps {
  userProfile: UserProfile;
}

export const ChatPlanner: React.FC<ChatPlannerProps> = ({ userProfile }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { 
      id: 'welcome', 
      role: 'model', 
      text: `Hi ${userProfile.name}! I'm CitySense. I see you're interested in ${userProfile.interests.slice(0, 3).join(", ")}. How can I help you plan your time in ${userProfile.currentCity}?` 
    }
  ]);
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    // Small timeout to allow DOM to render before scrolling
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  // Scroll when messages change or when the chat opens
  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isThinking) return;

    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', text: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsThinking(true);

    // Prepare history for API
    const history = messages.map(m => ({ role: m.role, text: m.text }));

    const response = await chatWithCitySense(history, userMsg.text, userProfile);
    
    setIsThinking(false);
    setMessages(prev => [
      ...prev, 
      { 
        id: (Date.now() + 1).toString(), 
        role: 'model', 
        text: response.text,
        suggestedEvents: response.events
      }
    ]);
  };

  const suggestionChips = [
    "What's happening this weekend?",
    "Suggest a hidden gem for dinner",
    "Where can I find live jazz?",
    "Plan a day trip itinerary"
  ];

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 w-16 h-16 bg-indigo-600 rounded-full shadow-2xl flex items-center justify-center hover:bg-indigo-700 hover:scale-105 active:scale-95 transition-all group"
        aria-label="Open Trip Planner"
      >
        <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
        {/* Tooltip */}
        <span className="absolute right-full mr-4 top-1/2 -translate-y-1/2 bg-gray-900 text-white px-3 py-1 rounded-lg text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
          Plan your trip
        </span>
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 w-[90vw] md:w-[400px] h-[600px] max-h-[80vh] flex flex-col bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
      {/* Header */}
      <div className="bg-indigo-600 p-4 flex items-center justify-between shrink-0 cursor-pointer" onClick={() => setIsOpen(false)}>
        <div className="flex items-center text-white">
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center mr-3">
             <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
             </svg>
          </div>
          <div>
            <h3 className="font-bold">Trip Planner</h3>
            <p className="text-xs text-indigo-200">Powered by CitySense AI</p>
          </div>
        </div>
        <button 
          onClick={(e) => { e.stopPropagation(); setIsOpen(false); }}
          className="text-white/80 hover:text-white hover:bg-white/10 p-1 rounded-full transition-colors"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div 
              className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-sm ${
                msg.role === 'user' 
                  ? 'bg-indigo-600 text-white rounded-tr-none' 
                  : 'bg-white text-gray-800 border border-gray-100 rounded-tl-none'
              }`}
            >
              <div className={`prose prose-sm max-w-none ${msg.role === 'user' ? 'prose-invert' : ''}`}>
                 <ReactMarkdown>{msg.text}</ReactMarkdown>
              </div>
            </div>
          </div>
        ))}
        {isThinking && (
          <div className="flex justify-start">
            <div className="bg-white rounded-2xl rounded-tl-none px-4 py-3 shadow-sm border border-gray-100 flex items-center gap-2">
              <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce delay-75"></div>
              <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce delay-150"></div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-gray-100 shrink-0">
        {messages.length < 3 && (
            <div className="flex gap-2 overflow-x-auto pb-3 mb-2 scrollbar-hide">
                {suggestionChips.map((chip, i) => (
                    <button 
                        key={i}
                        onClick={() => setInput(chip)}
                        className="whitespace-nowrap px-3 py-1 rounded-full border border-gray-200 text-xs text-gray-600 hover:bg-indigo-50 hover:border-indigo-200 transition-colors"
                    >
                        {chip}
                    </button>
                ))}
            </div>
        )}
        <form onSubmit={handleSend} className="flex gap-2 relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask anything..."
            className="flex-1 pl-4 pr-12 py-3 bg-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm"
          />
          <button
            type="submit"
            disabled={!input.trim() || isThinking}
            className="absolute right-2 top-2 p-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
};