'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Logo from '@/components/Logo';
import { PersonaConfig, ChatMessage } from '@/lib/types';

export default function ChatPage() {
  const router = useRouter();
  const [personaConfig, setPersonaConfig] = useState<PersonaConfig | null>(
    null
  );
  const [userName, setUserName] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

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
          <div className="flex gap-3">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                isInitializing
                  ? 'Waiting for persona...'
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
