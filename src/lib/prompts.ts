import { PersonaConfig, ChatMessage, PERSONA_ATTRIBUTES } from './types';

function describeValue(
  value: number,
  lowLabel: string,
  highLabel: string
): string {
  if (value <= 2) return `Very ${lowLabel}`;
  if (value <= 4) return `Leaning ${lowLabel}`;
  if (value === 5) return `Balanced between ${lowLabel} and ${highLabel}`;
  if (value <= 7) return `Leaning ${highLabel}`;
  return `Very ${highLabel}`;
}

export function buildPersonaSystemPrompt(config: PersonaConfig): string {
  const traitLines = PERSONA_ATTRIBUTES.map((attr) => {
    const value = config[attr.key];
    const desc = describeValue(value, attr.lowLabel, attr.highLabel);
    return `- ${attr.label}: ${value}/10 — ${desc}`;
  }).join('\n');

  return `You are role-playing as "${config.name}", a senior professional in a workplace setting. Someone has approached you for a conversation.

Their goal (which you should NOT reveal you know about): ${config.userGoal}

Context / Scenario: ${config.scenario || 'A standard professional meeting.'}

Your personality is defined by these traits on a 0–10 scale:
${traitLines}

RULES — follow these strictly:
1. Stay in character at ALL times. Never acknowledge you are an AI, a language model, or a simulation.
2. Respond naturally based on your personality traits. Let them shape your tone, word choice, patience level, and reactions.
3. Keep responses concise — 1 to 3 short paragraphs maximum. No monologues.
4. Make the conversation feel realistic and appropriately challenging for your difficulty level.
5. React authentically: if the user is vague, push back or ask for clarity. If they are clear, acknowledge it appropriately for your personality.
6. Do NOT coach, help, or encourage the user. This is a realistic simulation, not a supportive tutorial.
7. If the user's approach is weak or their argument unconvincing, respond accordingly — a tough persona should be skeptical, a warm persona might gently redirect.
8. Start naturally — greet them or ask what they need, based on your social presence and authority posture.`;
}

export function buildFeedbackPrompt(
  config: PersonaConfig,
  messages: ChatMessage[],
  userName?: string
): string {
  const speakerName = userName || 'You';
  const personaName = config.name;

  const transcript = messages
    .map(
      (m) =>
        `${m.role === 'user' ? speakerName : personaName}: ${m.content}`
    )
    .join('\n\n');

  const traitSummary = PERSONA_ATTRIBUTES.map(
    (attr) => `- ${attr.label}: ${config[attr.key]}/10`
  ).join('\n');

  return `You are an expert communication coach. Analyze the following conversation transcript between ${speakerName} and ${personaName}.

${speakerName.toUpperCase()}'S GOAL: ${config.userGoal}

SCENARIO: ${config.scenario || 'A standard professional meeting.'}

${personaName.toUpperCase()}'S PERSONALITY TRAITS:
${traitSummary}

TRANSCRIPT:
---
${transcript}
---

Provide a detailed, constructive analysis. Be specific — reference actual quotes from the transcript. Be honest but encouraging.

IMPORTANT: Always refer to the participants by their actual names — use "${speakerName}" (not "the user") and "${personaName}" (not "the persona"). This makes the feedback feel personal and direct.

You MUST respond with valid JSON matching this exact schema (no markdown, no code fences, just raw JSON):

{
  "confidenceScore": <number 0-100>,
  "confidenceNotes": "<2-3 sentences analyzing ${speakerName}'s confidence level, referencing specific moments>",
  "articulationFeedback": ["<specific feedback point>", "..."],
  "personaReactionSummary": "<2-3 sentences describing how ${personaName} likely perceived ${speakerName}'s approach>",
  "alternativeSuggestions": [
    {
      "original": "<exact quote from ${speakerName}>",
      "suggestion": "<better phrasing>",
      "rationale": "<why this is better>"
    }
  ]
}

Include 2-5 items in articulationFeedback and 2-4 items in alternativeSuggestions. Reference specific quotes from the transcript. Always use "${speakerName}" and "${personaName}" by name.`;
}
