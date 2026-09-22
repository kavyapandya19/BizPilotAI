import React, { useState, useEffect, useRef } from 'react';
import { Send, BrainCircuit, User, Sparkles, ChevronRight, RotateCcw } from 'lucide-react';
import { aiService } from '../services/aiService';
import { dashboardService } from '../services/dashboardService';

const SUGGESTED_PROMPTS = [
  'What inventory items need restocking?',
  'How is revenue trending this week?',
  'Which customers are at high churn risk?',
  'Summarize my business performance',
  'Draft a purchase order for low stock items',
];

const INITIAL_MESSAGES = [
  {
    id: 0,
    role: 'assistant',
    content: "👋 Hi! I'm **BizPilot AI**, your autonomous business intelligence assistant.\n\nI continuously monitor your inventory, revenue, and customer data in real-time. You can ask me anything about your business — I'll analyze the data and give you actionable insights.\n\nWhat would you like to explore today?",
    timestamp: new Date().toISOString(),
  },
];

const LOCAL_CLEAR_KEY = 'bizpilot-ai-assistant-cleared';

// Simple markdown-bold renderer
const renderContent = (content) => {
  const parts = content.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="text-slate-900 font-semibold">{part.slice(2, -2)}</strong>;
    }
    return <span key={i}>{part}</span>;
  });
};

const ThinkingDots = () => (
  <div className="flex items-center gap-1.5 px-4 py-3">
    {[0, 1, 2].map((i) => (
      <div
        key={i}
        className="w-2 h-2 bg-brand-600 rounded-full animate-bounce"
        style={{ animationDelay: `${i * 0.15}s` }}
      />
    ))}
  </div>
);

const AIAssistant = () => {
  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [error, setError] = useState('');
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    let isMounted = true;

    const restoreConversation = async () => {
      if (window.sessionStorage.getItem(LOCAL_CLEAR_KEY) === 'true') {
        aiService.loadHistory([]);
        return;
      }

      try {
        const response = await dashboardService.getAIInsights();
        const savedInsights = response.data || [];
        if (!isMounted) return;

        aiService.loadHistory(savedInsights);
        if (savedInsights.length > 0) {
          const restoredMessages = savedInsights
            .slice()
            .sort((first, second) => new Date(first.createdAt) - new Date(second.createdAt))
            .flatMap((insight) => [
              {
                id: `${insight._id}-question`,
                role: 'user',
                content: insight.question,
                timestamp: insight.createdAt,
              },
              {
                id: `${insight._id}-answer`,
                role: 'assistant',
                content: insight.answer,
                timestamp: insight.createdAt,
              },
            ]);
          setMessages(restoredMessages);
        }
      } catch (restoreError) {
        console.warn('[BizPilot AI] Could not restore conversation history:', restoreError.message);
      }
    };

    restoreConversation();
    return () => { isMounted = false; };
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isThinking]);

  const sendMessage = async (text) => {
    const trimmed = (text || input).trim();
    if (!trimmed || isThinking) return;

    const userMsg = {
      id: Date.now(),
      role: 'user',
      content: trimmed,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setError('');
    setIsThinking(true);

    const res = await aiService.sendMessage(trimmed);
    setIsThinking(false);

    // Show only responses returned by the configured AI service.
    if (res.data) {
      setMessages((prev) => [...prev, res.data]);
      void aiService.saveInsight({
        question: trimmed,
        answer: res.data.content,
        source: res.data.source,
      });
    } else if (res.message) {
      setError(res.message);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleReset = () => {
    aiService.resetChat();
    setMessages(INITIAL_MESSAGES);
    setInput('');
    setError('');
    window.sessionStorage.setItem(LOCAL_CLEAR_KEY, 'true');
  };

  return (
    <div className="flex flex-col h-full" style={{ height: 'calc(100vh - 80px - 48px)' }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">AI Assistant</h1>
          <p className="text-slate-500 mt-1">Your autonomous business intelligence co-pilot.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleReset}
            title="Clear conversation"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-500 hover:text-slate-900 bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-full transition-all"
          >
            <RotateCcw className="w-3 h-3" />
            Clear
          </button>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-100 border border-emerald-200 rounded-full">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-xs font-medium text-emerald-700">Agent Online</span>
          </div>
        </div>
      </div>

      {/* Chat area */}
      <div className="flex flex-col flex-1 glass-card overflow-hidden">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              {/* Avatar */}
              <div className={`w-9 h-9 rounded-xl flex-shrink-0 flex items-center justify-center ${
                msg.role === 'assistant'
                  ? 'bg-brand-600 shadow-sm shadow-brand-500/20'
                  : 'bg-slate-200'
              }`}>
                {msg.role === 'assistant'
                  ? <Sparkles className="w-4 h-4 text-white" />
                  : <User className="w-4 h-4 text-slate-600" />
                }
              </div>

              {/* Bubble */}
              <div className={`max-w-[75%] ${msg.role === 'user' ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-brand-600 text-white rounded-tr-sm'
                    : 'bg-slate-50 border border-slate-200 text-slate-800 rounded-tl-sm'
                }`}>
                  {msg.role === 'assistant'
                    ? msg.content.split('\n').map((line, i) => (
                        <span key={i}>{renderContent(line)}{i < msg.content.split('\n').length - 1 && <br />}</span>
                      ))
                    : msg.content
                  }
                </div>
                <span className="text-xs text-slate-400 px-1">
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          ))}

          {/* Thinking indicator */}
          {isThinking && (
            <div className="flex gap-4">
              <div className="w-9 h-9 rounded-xl flex-shrink-0 flex items-center justify-center bg-brand-600 shadow-sm shadow-brand-500/20">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-2xl rounded-tl-sm">
                <ThinkingDots />
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {error && <div className="mx-6 mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}

        {/* Suggested prompts */}
        {messages.length <= 1 && (
          <div className="px-6 pb-4">
            <p className="text-xs text-slate-500 mb-3 font-medium uppercase tracking-wider">Suggested questions</p>
            <div className="flex flex-wrap gap-2">
              {SUGGESTED_PROMPTS.map((p) => (
                <button
                  key={p}
                  onClick={() => sendMessage(p)}
                  className="flex items-center gap-1.5 text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-600 hover:border-brand-300 hover:text-brand-600 transition-all"
                >
                  <ChevronRight className="w-3 h-3" />
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input area */}
        <div className="p-4 border-t border-slate-200">
          <div className="flex items-end gap-3">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything about your business..."
              rows={1}
              className="flex-1 resize-none input-field py-3 text-sm leading-relaxed"
              style={{ minHeight: '48px', maxHeight: '120px' }}
            />
            <button
              onClick={() => sendMessage()}
              disabled={!input.trim() || isThinking}
              className="flex-shrink-0 w-11 h-11 flex items-center justify-center rounded-xl bg-brand-600 text-white shadow-sm hover:shadow-md hover:bg-brand-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all hover:-translate-y-0.5 active:translate-y-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
          <p className="text-xs text-slate-400 mt-2 text-center">Press Enter to send · Shift+Enter for new line</p>
        </div>
      </div>
    </div>
  );
};

export default AIAssistant;
