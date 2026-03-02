'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import Logo from '@/components/Logo';
import { PersonaConfig, ChatMessage } from '@/lib/types';

// Web Speech API (Chrome, Safari, Edge)
declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognitionInstance;
    webkitSpeechRecognition?: new () => SpeechRecognitionInstance;
  }
}
interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onresult: ((e: { resultIndex: number; results: Array<{ isFinal: boolean; 0: { transcript: string } }> }) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
}

export default function ChatPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [personaConfig, setPersonaConfig] = useState<PersonaConfig | null>(
    null
  );
  const [userName, setUserName] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);

  const streamAIResponse = useCallback(
    async (currentMessages: ChatMessage[], config: PersonaConfig) => {
      setIsStreaming(true);

      const aiMessageId = `ai-${Date.now()}`;
      setMessages((prev) => [
        ...prev,
        { id: aiMessageId, role: 'assistant', content: '' },
      ]);

      try {
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: currentMessages,
            personaConfig: config,
          }),
        });

        if (!response.ok) {
          const err = await response.json().catch(() => ({}));
          throw new Error(err.error || 'Failed to get response');
        }

        const reader = response.body?.getReader();
        if (!reader) throw new Error('No reader available');

        const decoder = new TextDecoder();
        let fullText = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          fullText += chunk;
          const captured = fullText;
          setMessages((prev) =>
            prev.map((m) =>
              m.id === aiMessageId ? { ...m, content: captured } : m
            )
          );
        }
      } catch (error) {
        console.error('Streaming error:', error);
        setMessages((prev) =>
          prev.map((m) =>
            m.id === aiMessageId
              ? {
                  ...m,
                  content:
                    'Something went wrong. Please try sending your message again.',
                }
              : m
          )
        );
      } finally {
        setIsStreaming(false);
        setIsInitializing(false);
        inputRef.current?.focus();
      }
    },
    []
  );

  useEffect(() => {
    const stored = sessionStorage.getItem('personaConfig');
    const storedName = sessionStorage.getItem('userName');
    if (!stored) {
      router.push('/configure');
      return;
    }
    if (storedName) setUserName(storedName);
    const config: PersonaConfig = JSON.parse(stored);
    setPersonaConfig(config);
    streamAIResponse([], config);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Speech-to-text setup
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    setSpeechSupported(!!SpeechRecognition);
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (e: { resultIndex: number; results: Array<{ isFinal: boolean; 0: { transcript: string } }> }) => {
      let transcript = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const result = e.results[i];
        if (result.isFinal) {
          transcript += result[0].transcript;
        }
      }
      if (transcript) {
        setInput((prev) => (prev ? `${prev} ${transcript}` : transcript).trim());
      }
    };

    recognition.onerror = () => {
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    return () => {
      recognition.stop();
    };
  }, []);

  const toggleSpeech = () => {
    if (!recognitionRef.current || isStreaming) return;
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch {
        setIsListening(false);
      }
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isStreaming || !personaConfig) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: input.trim(),
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');

    await streamAIResponse(newMessages, personaConfig);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleEndConversation = () => {
    if (messages.length < 2) return;
    sessionStorage.setItem('chatMessages', JSON.stringify(messages));
    router.push('/feedback');
  };

  if (!personaConfig) {
    return (
      <div className="h-screen flex items-center justify-center text-slate-400">
        Loading...
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-slate-50">
      {/* ── Header ── */}
      <header className="flex-shrink-0 border-b border-slate-200 bg-white px-6 py-3 shadow-sm">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <Logo size={44} />
            <div className="min-w-0">
              <h1 className="font-semibold text-slate-900 truncate text-sm">
                <span className="text-gradient">{personaConfig.name}</span>
              </h1>
              <p className="text-xs text-slate-400 truncate">
                {personaConfig.userGoal}
              </p>
            </div>
          </div>

          {/* Profile avatar */}
          {session?.user && (
            <div className="relative flex-shrink-0">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 transition-all"
              >
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center text-white text-xs font-bold">
                  {(session.user?.name || session.user?.email || '?')[0].toUpperCase()}
                </div>
                <svg className={`w-3.5 h-3.5 text-slate-400 transition-transform ${menuOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl border border-slate-200 shadow-lg shadow-slate-200/50 z-20 py-1 overflow-hidden">
                    <div className="px-4 py-3 border-b border-slate-100">
                      <p className="text-sm font-semibold text-slate-900 truncate">{session.user?.name}</p>
                      <p className="text-xs text-slate-400 truncate">{session.user?.email}</p>
                    </div>
                    <button onClick={() => { setMenuOpen(false); router.push('/'); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors">
                      <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955a1.126 1.126 0 011.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" /></svg>
                      Home
                    </button>
                    <button onClick={() => { setMenuOpen(false); router.push('/profile'); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors">
                      <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>
                      My Profile
                    </button>
                    <div className="border-t border-slate-100" />
                    <button onClick={() => { setMenuOpen(false); signOut({ callbackUrl: '/' }); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3-3l3-3m0 0l-3-3m3 3H9" /></svg>
                      Sign out
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </header>

      {/* ── Messages ── */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="max-w-3xl mx-auto space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                  message.role === 'user'
                    ? 'bg-gradient-to-r from-brand-500 to-accent-500 text-white rounded-br-md shadow-md shadow-brand-500/15'
                    : 'bg-white border border-slate-200 text-slate-700 rounded-bl-md shadow-sm'
                }`}
              >
                {message.content || (
                  <span className="inline-flex items-center gap-2 text-slate-400">
                    <span className="inline-flex gap-1">
                      <span className="w-1.5 h-1.5 bg-brand-400 rounded-full animate-bounce [animation-delay:0ms]" />
                      <span className="w-1.5 h-1.5 bg-brand-400 rounded-full animate-bounce [animation-delay:150ms]" />
                      <span className="w-1.5 h-1.5 bg-brand-400 rounded-full animate-bounce [animation-delay:300ms]" />
                    </span>
                    <span className="text-xs italic">Thinking...</span>
                  </span>
                )}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* ── Input ── */}
      <div className="flex-shrink-0 border-t border-slate-200 bg-white px-6 py-3 shadow-[0_-2px_10px_rgba(0,0,0,0.04)]">
        <div className="max-w-3xl mx-auto space-y-2">
          <div className="flex gap-2">
            {speechSupported && (
              <button
                type="button"
                onClick={toggleSpeech}
                disabled={isStreaming}
                title={isListening ? 'Stop recording' : 'Speak (speech-to-text)'}
                className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
                  isListening
                    ? 'bg-red-100 text-red-600 animate-pulse'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-800 disabled:opacity-50'
                }`}
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.91-3c-.49 0-.9.36-.98.85C16.52 14.2 14.47 16 12 16s-4.52-1.8-4.93-4.15c-.08-.49-.49-.85-.98-.85-.61 0-1.09.54-1 1.14.49 3 2.89 5.35 5.91 5.83V20c0 .55.45 1 1 1s1-.45 1-1v-2.18c3.02-.48 5.42-2.83 5.91-5.83.1-.6-.39-1.14-1-1.14z" />
                </svg>
              </button>
            )}
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                isInitializing
                  ? 'Waiting for persona...'
                  : speechSupported
                    ? 'Type or speak your message... (Enter to send)'
                    : 'Type your message... (Enter to send, Shift+Enter for new line)'
              }
              disabled={isStreaming}
              rows={1}
              className="flex-1 px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all resize-none disabled:opacity-50"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isStreaming}
              className="px-5 py-3 rounded-xl bg-gradient-brand text-white font-semibold hover:bg-gradient-brand-hover disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-md shadow-brand-500/20"
            >
              Send
            </button>
          </div>
          <div className="flex justify-center">
            <button
              onClick={handleEndConversation}
              disabled={messages.length < 2}
              className="px-5 py-2 rounded-lg text-xs font-medium bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              End Conversation & Get Feedback
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
