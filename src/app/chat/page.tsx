'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Logo from '@/components/Logo';
import ProfileDropdown from '@/components/ProfileDropdown';
import EditPersonalityModal from '@/components/EditPersonalityModal';
import { PersonaConfig, ChatMessage } from '@/lib/types';
import { useSideNav } from '@/contexts/SideNavContext';

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
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { setVariant, setOnGetFeedback, setOnEditPersonality, setMessagesCount, chatTab, setChatTab } = useSideNav();
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
    setVariant('chat');
    return () => setVariant('default');
  }, [setVariant]);

  useEffect(() => {
    setMessagesCount(messages.length);
  }, [messages.length, setMessagesCount]);

  useEffect(() => {
    setOnEditPersonality(() => () => setEditModalOpen(true));
    return () => setOnEditPersonality(undefined);
  }, [setOnEditPersonality]);

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

  const handleEndConversation = useCallback(() => {
    if (messages.length < 2) return;
    sessionStorage.setItem('chatMessages', JSON.stringify(messages));
    router.push('/feedback');
  }, [messages, router]);

  useEffect(() => {
    setOnGetFeedback(() => handleEndConversation);
    return () => setOnGetFeedback(undefined);
  }, [setOnGetFeedback, handleEndConversation]);

  if (!personaConfig) {
    return (
      <div className="h-screen flex items-center justify-center text-slate-400">
        Loading...
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-slate-50">
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

          <ProfileDropdown />
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

      {editModalOpen && personaConfig && (
        <EditPersonalityModal
          config={personaConfig}
          onSave={(updated) => {
            setPersonaConfig(updated);
            sessionStorage.setItem('personaConfig', JSON.stringify(updated));
          }}
          onClose={() => setEditModalOpen(false)}
        />
      )}
    </div>
  );
}
