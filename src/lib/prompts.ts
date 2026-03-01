import { PersonaConfig, ChatMessage, getPersonaAttributes } from './types';

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

function buildTraitLines(config: PersonaConfig): string {
  const attrs = getPersonaAttributes(config.track || 'professional');
  return attrs.map((attr) => {
    const value = config[attr.key as keyof PersonaConfig] as number;
    const desc = describeValue(value, attr.lowLabel, attr.highLabel);
    return `- ${attr.label}: ${value}/10 — ${desc}`;
  }).join('\n');
}

function buildTraitSummary(config: PersonaConfig): string {
  const attrs = getPersonaAttributes(config.track || 'professional');
  return attrs.map(
    (attr) => `- ${attr.label}: ${(config[attr.key as keyof PersonaConfig] as number)}/10`
  ).join('\n');
}

// ── Professional track prompt ──

function buildProfessionalPrompt(config: PersonaConfig): string {
  const traitLines = buildTraitLines(config);

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

// ── Personal / dating track prompt ──

function buildPersonalPrompt(config: PersonaConfig): string {
  const traitLines = buildTraitLines(config);

  return `You are role-playing as "${config.name}", someone the user matched with on a dating app. You are chatting with them.

Their goal (which you should NOT reveal you know about): ${config.userGoal}

Context / Scenario: ${config.scenario || 'A casual dating app conversation.'}

Your personality is defined by these traits on a 0–10 scale:
${traitLines}

RULES — follow these strictly:
1. Stay in character at ALL times. Never acknowledge you are an AI, a language model, or a simulation.
2. Respond naturally based on your personality traits. Let them shape your tone, texting style, flirtiness, and engagement level.
3. Keep responses short and realistic — like real dating app messages. 1-3 sentences usually. Use casual language, abbreviations, or emojis if it fits your personality.
4. If your Interest Level is low, give shorter replies, take longer to engage, be harder to impress. If it's high, be more responsive and enthusiastic.
5. If your Flirtatiousness is high, tease, use innuendo, and be playful. If low, keep things friendly but platonic.
6. React authentically to the user's messages:
   - Boring/generic opener? Respond with low effort or call it out depending on your Pickiness.
   - Clever/funny message? Match the energy based on your Humor Style.
   - Too forward too fast? Pull back if your Emotional Openness is low.
   - Sweet and genuine? Open up if your Emotional Openness is high.
7. Do NOT coach or help the user. This is a realistic simulation. If they're being awkward, let it be awkward.
8. If your Communication Effort is low, use short messages, maybe one-word answers. If high, be expressive and engaging.
9. Start naturally based on the scenario — if they're opening first, wait for their message. If it's a mutual match, you can start casually.`;
}

function buildInterviewPrompt(config: PersonaConfig): string {
  const prep = config.interviewPrep;
  const contextBlock = prep
    ? `Company: ${prep.company}. Role: ${prep.role}. Format: ${prep.format}${prep.jd ? `. JD (use for tailored questions):\n${prep.jd.slice(0, 3000)}` : ''}${prep.resume ? `\n\nCANDIDATE RESUME (use to ask relevant questions; do NOT reveal you've seen it):\n${prep.resume.slice(0, 4000)}` : ''}${prep.linkedIn ? `\n\nCANDIDATE LINKEDIN PROFILE (use for context; do NOT reveal you've seen it):\n${prep.linkedIn.slice(0, 3000)}` : ''}`
    : buildTraitLines(config);
  return `You are role-playing as "${config.name}" in a job interview. The candidate's goal (which you should NOT reveal you know): ${config.userGoal}
Context: ${config.scenario || 'A job interview.'}
Interview context (use this to shape your questions and expectations—do NOT use fixed personality sliders): ${contextBlock}
RULES: Stay in character. Ask interview questions appropriate to the format; probe and follow up. React naturally based on the role/company context. Keep responses 1-3 paragraphs. Do NOT coach. Start by welcoming them or asking your first question.`;
}

export function buildPersonaSystemPrompt(config: PersonaConfig): string {
  if (config.track === 'personal') return buildPersonalPrompt(config);
  if (config.track === 'interview') return buildInterviewPrompt(config);
  return buildProfessionalPrompt(config);
}

// ── Feedback prompt (works for both tracks) ──

export function buildFeedbackPrompt(
  config: PersonaConfig,
  messages: ChatMessage[],
  userName?: string
): string {
  const speakerName = userName || 'You';
  const personaName = config.name;
  const isPersonal = config.track === 'personal';

  const transcript = messages
    .map(
      (m) =>
        `${m.role === 'user' ? speakerName : personaName}: ${m.content}`
    )
    .join('\n\n');

  const traitSummary = config.interviewPrep
    ? `Company: ${config.interviewPrep.company}. Role: ${config.interviewPrep.role}. Format: ${config.interviewPrep.format}${config.interviewPrep.resume ? `\nCandidate resume (for context-aware feedback):\n${config.interviewPrep.resume.slice(0, 3000)}` : ''}${config.interviewPrep.linkedIn ? `\nCandidate LinkedIn profile (for context-aware feedback):\n${config.interviewPrep.linkedIn.slice(0, 2500)}` : ''}`
    : buildTraitSummary(config);

  const isInterview = config.track === 'interview';
  const coachRole = isPersonal
    ? `You are an expert dating and social communication coach. Analyze the following dating app conversation between ${speakerName} and ${personaName}.`
    : isInterview
    ? `You are an expert interview coach (aligned with interview-coach-skill framework). Analyze this job interview between candidate ${speakerName} and interviewer ${personaName}. Score on 5 dimensions: Substance (raw material), Structure (clarity), Relevance (question alignment), Credibility (authenticity), Differentiation (memorability). Each 0-10.`
    : `You are an expert communication coach. Analyze the following professional conversation between ${speakerName} and ${personaName}.`;

  const defaultScenario = isPersonal ? 'A dating app conversation.' : isInterview ? 'A job interview.' : 'A standard professional meeting.';

  return `${coachRole}

${speakerName.toUpperCase()}'S GOAL: ${config.userGoal}

SCENARIO: ${config.scenario || defaultScenario}

${personaName.toUpperCase()}'S ${isInterview && config.interviewPrep ? 'INTERVIEW CONTEXT' : 'PERSONALITY TRAITS'}:
${traitSummary}

TRANSCRIPT:
---
${transcript}
---

Provide a detailed, constructive analysis. Be specific — reference actual quotes from the transcript. Be honest but encouraging.

IMPORTANT: Always refer to the participants by their actual names — use "${speakerName}" (not "the user") and "${personaName}" (not "the persona"). This makes the feedback feel personal and direct.

You MUST respond with valid JSON. Schema:
{
  "confidenceScore": <number 0-100>,
  "confidenceNotes": "<2-3 sentences>",
  "articulationFeedback": ["<point>", "..."],
  "personaReactionSummary": "<2-3 sentences>",
  "alternativeSuggestions": [{"original": "<quote>", "suggestion": "<better>", "rationale": "<why>"}]
${isInterview ? `,
  "interviewDimensions": {"substance": <0-10>, "structure": <0-10>, "relevance": <0-10>, "credibility": <0-10>, "differentiation": <0-10>}` : ''}
}
Include 2-5 articulationFeedback, 2-4 alternativeSuggestions. Use names "${speakerName}" and "${personaName}".`;
}
