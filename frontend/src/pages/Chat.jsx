import React, { useEffect, useRef, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import confetti from 'canvas-confetti';
import { 
  Send, Bot, User, Download, Copy, Printer, Check, 
  ArrowLeft, RefreshCw, Award, ChevronRight, FileText
} from 'lucide-react';

const API_BASE = 'http://localhost:5000/api';

const COLORS = {
  GTM: '#3b82f6',
  Sales: '#10b981',
  Pricing: '#f59e0b',
  Brand: '#ec4899',
  Ops: '#8b5cf6',
  Unclassified: '#9ca3af'
};

export default function Chat() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const sessionIdParam = searchParams.get('sessionId');

  // Input states
  const [founderName, setFounderName] = useState('');
  const [companyName, setCompanyName] = useState('');
  
  // Session states
  const [session, setSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [briefMarkdown, setBriefMarkdown] = useState('');
  
  // Status states
  const [isInitializing, setIsInitializing] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [loadingSession, setLoadingSession] = useState(false);
  const [copied, setCopied] = useState(false);

  const messagesEndRef = useRef(null);

  // Auto-scroll helper
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isSending]);

  // Load / Resume session on mount
  useEffect(() => {
    if (sessionIdParam) {
      resumeSession(sessionIdParam);
    }
  }, [sessionIdParam]);

  const resumeSession = async (sid) => {
    setLoadingSession(true);
    try {
      const res = await axios.post(`${API_BASE}/chat/resume`, { sessionId: sid });
      setSession(res.data.session);
      setMessages(res.data.messages);
      if (res.data.brief) {
        setBriefMarkdown(res.data.brief);
      }
    } catch (err) {
      console.error('Error resuming session:', err);
      alert('Failed to resume session. Redirecting to start page.');
      navigate('/chat');
    } finally {
      setLoadingSession(false);
    }
  };

  // Start a fresh organic chat session
  const handleStart = async (e) => {
    e.preventDefault();
    if (!founderName.trim()) return;

    setIsInitializing(true);
    try {
      const res = await axios.post(`${API_BASE}/chat/start`, {
        founderName,
        companyName: companyName || 'Stealth Startup'
      });
      setSession(res.data);
      setMessages(res.data.messages);
      navigate(`/chat?sessionId=${res.data.sessionId}`);
    } catch (err) {
      console.error('Error starting session:', err);
      alert('Failed to start session: ' + err.message);
    } finally {
      setIsInitializing(false);
    }
  };

  // Submit message in the Q&A loop
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputText.trim() || isSending || !session) return;

    const userVal = inputText;
    setInputText('');

    // Pre-render local user message
    const tempUserMsg = { role: 'user', content: userVal, timestamp: new Date() };
    setMessages(prev => [...prev, tempUserMsg]);
    setIsSending(true);

    try {
      const res = await axios.post(`${API_BASE}/chat/message`, {
        sessionId: session.sessionId,
        content: userVal
      });

      // Update session metrics
      setSession(prev => ({
        ...prev,
        currentQuestionIndex: res.data.currentQuestionIndex,
        status: res.data.status,
        bucket: res.data.bucket || prev.bucket
      }));

      if (res.data.status === 'completed') {
        // Complete trigger
        setBriefMarkdown(res.data.briefMarkdown);
        // Show success confetti
        confetti({
          particleCount: 150,
          spread: 80,
          origin: { y: 0.6 }
        });
      } else {
        // Add LLM's next question response
        setMessages(prev => [...prev, res.data.message]);
      }
    } catch (err) {
      console.error('Error submitting message:', err);
      alert('Failed to submit response: ' + err.message);
    } finally {
      setIsSending(false);
    }
  };

  // Copy brief to clipboard
  const handleCopy = () => {
    navigator.clipboard.writeText(briefMarkdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Download brief as .md file
  const handleDownload = () => {
    const blob = new Blob([briefMarkdown], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${session?.companyName || 'B2B'}_Strategy_Brief.md`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Trigger PDF print window
  const handlePrint = () => {
    window.print();
  };

  // 1. Initial State: Form to gather founder background info
  if (!session && !loadingSession) {
    return (
      <div className="max-w-xl mx-auto my-12 animate-slide-up">
        <div className="glass-panel rounded-2xl p-8 shadow-xl">
          <div className="flex justify-center mb-6">
            <div className="p-3 bg-brand-50 dark:bg-brand-950/40 rounded-2xl border border-brand-200/30">
              <Bot className="h-10 w-10 text-brand-600 dark:text-brand-400 animate-pulse-subtle" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-center tracking-tight">
            Consultative Strategy Intake
          </h2>
          <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-2">
            Introduce yourself to begin the 8-question state-aware SPIN discovery sequence.
          </p>

          <form onSubmit={handleStart} className="space-y-6 mt-8">
            <div>
              <label htmlFor="founderName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Founder Name *
              </label>
              <input
                id="founderName"
                type="text"
                required
                value={founderName}
                onChange={(e) => setFounderName(e.target.value)}
                placeholder="e.g. Het Soni"
                className="mt-1 block w-full rounded-lg border border-gray-300 dark:border-gray-800 bg-white dark:bg-gray-900 px-4 py-3 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>

            <div>
              <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Company Name
              </label>
              <input
                id="companyName"
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="e.g. Acme SaaS (or Stealth)"
                className="mt-1 block w-full rounded-lg border border-gray-300 dark:border-gray-800 bg-white dark:bg-gray-900 px-4 py-3 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>

            <button
              type="submit"
              disabled={isInitializing}
              className="w-full flex items-center justify-center gap-2 rounded-lg bg-brand-600 hover:bg-brand-700 disabled:bg-brand-400 text-white py-3 font-semibold shadow-md shadow-brand-500/20 transition-all cursor-pointer"
            >
              {isInitializing ? (
                <>
                  <RefreshCw className="h-5 w-5 animate-spin" />
                  Generating Discovery Question...
                </>
              ) : (
                <>
                  Enter Consulting Chamber
                  <ChevronRight className="h-5 w-5" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // 2. Loading Session View
  if (loadingSession) {
    return (
      <div className="flex flex-col items-center justify-center py-40">
        <RefreshCw className="h-10 w-10 text-brand-500 animate-spin" />
        <span className="text-sm text-gray-500 dark:text-gray-400 mt-4">Loading active chat state...</span>
      </div>
    );
  }

  const isCompleted = session?.status === 'completed';

  // 3. Main Chat & Brief Output Split Layout
  return (
    <div className="grid lg:grid-cols-12 gap-8 h-[calc(100vh-140px)] min-h-[500px]">
      
      {/* LEFT COLUMN: Chat dialogue */}
      <div className={`glass-panel rounded-2xl flex flex-col overflow-hidden transition-all duration-300 ${
        isCompleted ? 'lg:col-span-5' : 'lg:col-span-12 max-w-4xl mx-auto w-full'
      }`}>
        
        {/* Chat Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between bg-white/20 dark:bg-gray-900/20">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/')}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors text-gray-500 dark:text-gray-400"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div>
              <h3 className="font-bold text-sm">{session?.founderName}</h3>
              <p className="text-[10px] text-gray-500 dark:text-gray-400">{session?.companyName}</p>
            </div>
          </div>

          {/* SPIN Progress Bar */}
          {!isCompleted && (
            <div className="flex items-center gap-3 text-xs">
              <span className="font-semibold text-brand-600 dark:text-brand-400">
                Question {session?.currentQuestionIndex || 1} of 8
              </span>
              <div className="w-16 bg-gray-200 dark:bg-gray-800 h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-brand-500 h-full transition-all duration-500" 
                  style={{ width: `${((session?.currentQuestionIndex || 1) / 8) * 100}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Message Transcripts (Scrollable area) */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((msg, index) => {
            const isBot = msg.role === 'assistant';
            return (
              <div
                key={index}
                className={`flex gap-3 max-w-[85%] animate-fade-in ${
                  isBot ? '' : 'ml-auto flex-row-reverse'
                }`}
              >
                {/* Avatar */}
                <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 shadow-sm ${
                  isBot 
                    ? 'bg-brand-100 text-brand-600 dark:bg-brand-950/40 dark:text-brand-400 border border-brand-200/20' 
                    : 'bg-indigo-600 text-white'
                }`}>
                  {isBot ? <Bot className="h-4 w-4" /> : <User className="h-4 w-4" />}
                </div>

                {/* Bubble */}
                <div className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                  isBot 
                    ? 'bg-gray-100 text-gray-800 dark:bg-gray-800/80 dark:text-gray-100 rounded-tl-none' 
                    : 'bg-brand-600 text-white rounded-tr-none'
                }`}>
                  <p>{msg.content}</p>
                </div>
              </div>
            );
          })}

          {/* Typing Indicator */}
          {isSending && (
            <div className="flex gap-3 max-w-[85%]">
              <div className="h-8 w-8 rounded-full bg-brand-100 text-brand-600 dark:bg-brand-950/40 dark:text-brand-400 border border-brand-200/20 flex items-center justify-center shrink-0">
                <Bot className="h-4 w-4" />
              </div>
              <div className="bg-gray-100 dark:bg-gray-800/80 rounded-2xl rounded-tl-none px-4 py-3 flex items-center gap-1 text-brand-500">
                <span className="typing-dot" />
                <span className="typing-dot" />
                <span className="typing-dot" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Form Footer */}
        {!isCompleted ? (
          <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200 dark:border-gray-800 bg-white/10 dark:bg-gray-900/10 flex gap-2">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Provide detail for strategic analysis..."
              disabled={isSending}
              className="flex-1 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-800 rounded-xl px-4 py-3 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={isSending || !inputText.trim()}
              className="px-4 bg-brand-600 hover:bg-brand-700 disabled:bg-gray-300 dark:disabled:bg-gray-800 text-white rounded-xl shadow-md transition-colors cursor-pointer flex items-center justify-center"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        ) : (
          <div className="p-6 border-t border-gray-200 dark:border-gray-800 bg-emerald-50/20 dark:bg-emerald-950/10 text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 dark:bg-emerald-900/40 px-3 py-1 text-xs font-semibold text-emerald-800 dark:text-emerald-300 border border-emerald-200/20">
              Session Completed Successfully
            </span>
          </div>
        )}
      </div>

      {/* RIGHT COLUMN: Strategy Brief Presentation (if completed) */}
      {isCompleted && (
        <div className="lg:col-span-7 flex flex-col h-full overflow-hidden glass-panel rounded-2xl animate-fade-in print:p-0 print:border-none print:shadow-none print:glass-panel">
          
          {/* Brief header / toolbar */}
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white/20 dark:bg-gray-900/20 print:hidden">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-brand-500" />
              <div>
                <h3 className="font-bold text-sm">Strategic B2B Brief</h3>
                <div className="flex items-center gap-1.5 text-[10px] text-gray-500 mt-0.5">
                  Classification Bucket: 
                  <span 
                    className="font-bold uppercase px-1.5 py-0.2 rounded text-[9px] border"
                    style={{
                      backgroundColor: `${COLORS[session.bucket]}15`,
                      borderColor: `${COLORS[session.bucket]}30`,
                      color: COLORS[session.bucket]
                    }}
                  >
                    {session.bucket}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2 self-end">
              <button
                onClick={handleCopy}
                className="p-2 border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg text-gray-600 dark:text-gray-400 transition-colors shadow-sm"
                title="Copy Brief Markdown"
              >
                {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
              </button>
              <button
                onClick={handleDownload}
                className="p-2 border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg text-gray-600 dark:text-gray-400 transition-colors shadow-sm"
                title="Download Markdown"
              >
                <Download className="h-4 w-4" />
              </button>
              <button
                onClick={handlePrint}
                className="p-2 border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg text-gray-600 dark:text-gray-400 transition-colors shadow-sm"
                title="Print / Export PDF"
              >
                <Printer className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Strategy Brief Render Area */}
          <div className="flex-1 overflow-y-auto p-8 prose prose-slate dark:prose-invert max-w-none text-left print:overflow-visible">
            {briefMarkdown ? (
              <ReactMarkdown className="markdown-brief-content space-y-4">
                {briefMarkdown}
              </ReactMarkdown>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-400 italic">
                <RefreshCw className="h-8 w-8 animate-spin text-brand-500 mb-2" />
                Synthesizing strategic recommendations...
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
