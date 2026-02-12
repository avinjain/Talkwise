import { encoding_for_model, TiktokenModel } from 'tiktoken';
import { ChatMessage } from './types';

// Token limits per model (context window minus buffer for response)
const MODEL_LIMITS: Record<string, number> = {
  'gpt-4o': 120000,
  'gpt-4o-mini': 120000,
  'gpt-4': 8000,
  'gpt-3.5-turbo': 14000,
};

const DEFAULT_LIMIT = 120000;

// Max tokens we allow for conversation context (leave room for response)
const RESPONSE_BUFFER = 1000;

/**
 * Count tokens in a string using tiktoken.
 */
export function countTokens(text: string, model?: string): number {
  let enc;
  try {
    enc = encoding_for_model((model || 'gpt-4o') as TiktokenModel);
  } catch {
    enc = encoding_for_model('gpt-4o');
  }
  const tokens = enc.encode(text);
  const count = tokens.length;
  enc.free();
  return count;
}

/**
 * Count tokens for a full chat messages array (including role overhead).
 * Each message has ~4 tokens of overhead for role/formatting.
 */
export function countMessagesTokens(
  messages: { role: string; content: string }[],
  model?: string
): number {
  let total = 3; // every reply is primed with 3 tokens
  for (const msg of messages) {
    total += 4; // message overhead
    total += countTokens(msg.content, model);
  }
  return total;
}

/**
 * Truncate message history to fit within token limits.
 * Strategy: always keep the system prompt + the most recent messages.
 * If history is too long, drop the oldest messages (after the system prompt).
 */
export function truncateMessages(
  systemPrompt: string,
  messages: ChatMessage[],
  model?: string
): ChatMessage[] {
  const modelName = model || process.env.GPT_MODEL || 'gpt-4o';
  const maxTokens = (MODEL_LIMITS[modelName] || DEFAULT_LIMIT) - RESPONSE_BUFFER;

  const systemTokens = countTokens(systemPrompt, modelName) + 4;

  // Start from the most recent messages and work backwards
  const result: ChatMessage[] = [];
  let currentTokens = systemTokens;

  // Walk from newest to oldest
  for (let i = messages.length - 1; i >= 0; i--) {
    const msg = messages[i];
    const msgTokens = countTokens(msg.content, modelName) + 4;

    if (currentTokens + msgTokens > maxTokens) {
      // We've hit the limit — stop adding older messages
      break;
    }

    result.unshift(msg);
    currentTokens += msgTokens;
  }

  return result;
}
