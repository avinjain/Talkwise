// ── Personality Test: 6 dimensions, 4 questions each, 24 total ──

export const DIMENSIONS = [
  { key: 'assertiveness', label: 'Assertiveness', color: '#0ed7b5', description: 'How directly you express your needs and opinions' },
  { key: 'empathy', label: 'Empathy', color: '#2e7dd1', description: 'How well you read and respond to others\' emotions' },
  { key: 'confidence', label: 'Confidence', color: '#8b5cf6', description: 'How self-assured you are in conversations' },
  { key: 'adaptability', label: 'Adaptability', color: '#f59e0b', description: 'How flexibly you adjust your communication style' },
  { key: 'emotionalIntelligence', label: 'Emotional Intelligence', color: '#ec4899', description: 'How well you manage your emotions during tough conversations' },
  { key: 'socialEnergy', label: 'Social Energy', color: '#10b981', description: 'How energized you are by social interactions' },
] as const;

export type DimensionKey = (typeof DIMENSIONS)[number]['key'];

export interface TestQuestion {
  id: number;
  dimension: DimensionKey;
  question: string;
  options: { text: string; score: number }[];
}

export interface ProfileResult {
  assertiveness: number;
  empathy: number;
  confidence: number;
  adaptability: number;
  emotionalIntelligence: number;
  socialEnergy: number;
}

export const QUESTIONS: TestQuestion[] = [
  // ── Assertiveness ──
  {
    id: 1,
    dimension: 'assertiveness',
    question: 'In a group discussion, when you disagree with the majority, you typically:',
    options: [
      { text: 'Stay quiet to avoid conflict', score: 1 },
      { text: 'Hint at your disagreement indirectly', score: 2 },
      { text: 'Politely share your differing view', score: 3 },
      { text: 'Directly state your disagreement and argue your point', score: 4 },
    ],
  },
  {
    id: 2,
    dimension: 'assertiveness',
    question: 'When someone takes credit for your idea, you:',
    options: [
      { text: "Let it go — it's not worth the confrontation", score: 1 },
      { text: "Feel upset but don't say anything", score: 2 },
      { text: 'Privately mention it to them later', score: 3 },
      { text: 'Address it immediately and clearly', score: 4 },
    ],
  },
  {
    id: 3,
    dimension: 'assertiveness',
    question: 'When you receive the wrong food order at a restaurant, you:',
    options: [
      { text: 'Eat it anyway to avoid causing a fuss', score: 1 },
      { text: 'Eat it but feel annoyed', score: 2 },
      { text: 'Politely ask the waiter to fix it', score: 3 },
      { text: 'Immediately flag the mistake and request the correct dish', score: 4 },
    ],
  },
  {
    id: 4,
    dimension: 'assertiveness',
    question: 'When negotiating (salary, price, terms), you tend to:',
    options: [
      { text: 'Accept what\'s offered — negotiating feels uncomfortable', score: 1 },
      { text: 'Hint that you\'d like better terms but back off easily', score: 2 },
      { text: 'Make a reasonable counter-offer', score: 3 },
      { text: 'Push firmly for what you believe you deserve', score: 4 },
    ],
  },

  // ── Empathy ──
  {
    id: 5,
    dimension: 'empathy',
    question: 'When a friend is going through a tough time, you:',
    options: [
      { text: "Don't always notice unless they tell you directly", score: 1 },
      { text: "Notice something's off but wait for them to bring it up", score: 2 },
      { text: "Check in and ask how they're doing", score: 3 },
      { text: 'Immediately sense their mood and proactively offer support', score: 4 },
    ],
  },
  {
    id: 6,
    dimension: 'empathy',
    question: 'During a conversation, you often find yourself:',
    options: [
      { text: 'Thinking about what you want to say next', score: 1 },
      { text: 'Listening but sometimes getting distracted', score: 2 },
      { text: 'Actively listening and asking follow-up questions', score: 3 },
      { text: 'Deeply attuned to not just words, but tone and body language', score: 4 },
    ],
  },
  {
    id: 7,
    dimension: 'empathy',
    question: 'When someone you disagree with shares their perspective, you:',
    options: [
      { text: 'Mentally dismiss their viewpoint', score: 1 },
      { text: 'Listen but mainly to find flaws in their argument', score: 2 },
      { text: 'Try to understand their reasoning even if you disagree', score: 3 },
      { text: 'Genuinely try to see the world from their perspective', score: 4 },
    ],
  },
  {
    id: 8,
    dimension: 'empathy',
    question: 'When a friend seems upset but says "I\'m fine," you:',
    options: [
      { text: 'Take it at face value and move on', score: 1 },
      { text: "Feel something might be off but don't push", score: 2 },
      { text: "Gently let them know you're there if they want to talk", score: 3 },
      { text: 'Read between the lines and create a safe space for them to open up', score: 4 },
    ],
  },

  // ── Confidence ──
  {
    id: 9,
    dimension: 'confidence',
    question: 'When walking into a room full of strangers, you typically feel:',
    options: [
      { text: 'Very anxious and try to blend into the background', score: 1 },
      { text: 'A bit nervous but manage to get through it', score: 2 },
      { text: 'Generally comfortable after a brief warm-up', score: 3 },
      { text: 'Energized and ready to meet new people', score: 4 },
    ],
  },
  {
    id: 10,
    dimension: 'confidence',
    question: 'When presenting your ideas to a group, you:',
    options: [
      { text: 'Get very nervous and often stumble over your words', score: 1 },
      { text: 'Feel anxious but push through it', score: 2 },
      { text: 'Are mostly comfortable, especially on familiar topics', score: 3 },
      { text: 'Feel confident and articulate, even under pressure', score: 4 },
    ],
  },
  {
    id: 11,
    dimension: 'confidence',
    question: 'When you make a mistake in front of others, you:',
    options: [
      { text: 'Feel deeply embarrassed and replay it for days', score: 1 },
      { text: 'Feel uncomfortable but try to move past it', score: 2 },
      { text: 'Acknowledge it, learn from it, and move on fairly quickly', score: 3 },
      { text: 'Own it with humor or grace — everyone makes mistakes', score: 4 },
    ],
  },
  {
    id: 12,
    dimension: 'confidence',
    question: 'When someone challenges your opinion, you:',
    options: [
      { text: 'Immediately doubt yourself and back down', score: 1 },
      { text: 'Feel uncertain but hold your position weakly', score: 2 },
      { text: 'Listen to their point but stand by your view if you believe it', score: 3 },
      { text: 'Welcome the challenge and engage with it constructively', score: 4 },
    ],
  },

  // ── Adaptability ──
  {
    id: 13,
    dimension: 'adaptability',
    question: "When you're explaining something and the other person isn't getting it, you:",
    options: [
      { text: 'Repeat the same explanation, louder or slower', score: 1 },
      { text: 'Get frustrated and give up', score: 2 },
      { text: 'Try a different analogy or approach', score: 3 },
      { text: 'Intuitively adjust your language, examples, and pace to match their style', score: 4 },
    ],
  },
  {
    id: 14,
    dimension: 'adaptability',
    question: 'When texting vs. talking in person, your communication style:',
    options: [
      { text: "Is basically the same — you don't really adapt", score: 1 },
      { text: 'Changes slightly but not deliberately', score: 2 },
      { text: 'Consciously shifts to match the medium', score: 3 },
      { text: 'Is very different — you naturally calibrate tone, length, and style', score: 4 },
    ],
  },
  {
    id: 15,
    dimension: 'adaptability',
    question: 'When meeting someone from a very different background, you:',
    options: [
      { text: 'Stick to your usual communication style', score: 1 },
      { text: "Feel a bit awkward but don't change much", score: 2 },
      { text: 'Make an effort to find common ground', score: 3 },
      { text: 'Naturally adjust your communication to connect with them', score: 4 },
    ],
  },
  {
    id: 16,
    dimension: 'adaptability',
    question: 'When a conversation takes an unexpected turn, you:',
    options: [
      { text: "Freeze up and don't know how to respond", score: 1 },
      { text: 'Feel thrown off but manage to continue', score: 2 },
      { text: 'Roll with it and adapt your approach', score: 3 },
      { text: 'Thrive on the spontaneity and use it to deepen the conversation', score: 4 },
    ],
  },

  // ── Emotional Intelligence ──
  {
    id: 17,
    dimension: 'emotionalIntelligence',
    question: "When you're feeling angry during a disagreement, you:",
    options: [
      { text: 'Lash out or say things you later regret', score: 1 },
      { text: 'Struggle to control your emotions but try', score: 2 },
      { text: 'Recognize your anger and take a moment before responding', score: 3 },
      { text: 'Stay composed and channel the emotion productively', score: 4 },
    ],
  },
  {
    id: 18,
    dimension: 'emotionalIntelligence',
    question: 'After a difficult conversation, you typically:',
    options: [
      { text: 'Feel emotionally drained for hours or days', score: 1 },
      { text: 'Feel stressed but can function normally', score: 2 },
      { text: 'Process it relatively quickly and move on', score: 3 },
      { text: 'Reflect constructively and use it as a learning experience', score: 4 },
    ],
  },
  {
    id: 19,
    dimension: 'emotionalIntelligence',
    question: 'When you sense tension in a group, you:',
    options: [
      { text: 'Feel anxious and want to leave', score: 1 },
      { text: 'Pretend not to notice', score: 2 },
      { text: 'Try to ease the tension with humor or a topic change', score: 3 },
      { text: 'Address it directly in a way that helps everyone feel heard', score: 4 },
    ],
  },
  {
    id: 20,
    dimension: 'emotionalIntelligence',
    question: 'When receiving harsh criticism, your first reaction is to:',
    options: [
      { text: 'Feel devastated and take it very personally', score: 1 },
      { text: 'Get defensive and want to argue back', score: 2 },
      { text: 'Feel the sting but try to extract the useful feedback', score: 3 },
      { text: 'Stay calm, thank them, and evaluate it objectively', score: 4 },
    ],
  },

  // ── Social Energy ──
  {
    id: 21,
    dimension: 'socialEnergy',
    question: 'After a long week, your ideal weekend looks like:',
    options: [
      { text: 'Completely alone — no people, no plans', score: 1 },
      { text: 'Mostly solo with maybe one low-key hangout', score: 2 },
      { text: 'A balance of alone time and social activities', score: 3 },
      { text: 'Packed with social events and group activities', score: 4 },
    ],
  },
  {
    id: 22,
    dimension: 'socialEnergy',
    question: 'In conversations, you tend to:',
    options: [
      { text: 'Listen much more than you talk', score: 1 },
      { text: 'Listen slightly more than you talk', score: 2 },
      { text: 'Balance talking and listening equally', score: 3 },
      { text: 'Talk more than you listen — you have a lot to share', score: 4 },
    ],
  },
  {
    id: 23,
    dimension: 'socialEnergy',
    question: "At a party, you're most likely to:",
    options: [
      { text: 'Find a quiet corner or hang with one person you know', score: 1 },
      { text: 'Stick with a small group of friends', score: 2 },
      { text: 'Mingle between different groups throughout the night', score: 3 },
      { text: 'Work the room and meet as many new people as possible', score: 4 },
    ],
  },
  {
    id: 24,
    dimension: 'socialEnergy',
    question: 'When it comes to meeting new people, you:',
    options: [
      { text: 'Find it draining and avoid it when possible', score: 1 },
      { text: 'Can do it but need recovery time after', score: 2 },
      { text: 'Enjoy it in moderation', score: 3 },
      { text: 'Actively seek it out — new people energize you', score: 4 },
    ],
  },
];

/** Calculate dimension scores (0-10) from raw answers */
export function calculateScores(answers: Record<number, number>): ProfileResult {
  const sums: Record<DimensionKey, number> = {
    assertiveness: 0,
    empathy: 0,
    confidence: 0,
    adaptability: 0,
    emotionalIntelligence: 0,
    socialEnergy: 0,
  };

  const counts: Record<DimensionKey, number> = {
    assertiveness: 0,
    empathy: 0,
    confidence: 0,
    adaptability: 0,
    emotionalIntelligence: 0,
    socialEnergy: 0,
  };

  for (const q of QUESTIONS) {
    const answer = answers[q.id];
    if (answer !== undefined) {
      sums[q.dimension] += answer;
      counts[q.dimension] += 1;
    }
  }

  const result: Record<string, number> = {};
  for (const dim of DIMENSIONS) {
    const count = counts[dim.key];
    if (count === 0) {
      result[dim.key] = 5; // default midpoint
    } else {
      const sum = sums[dim.key];
      // Map from [count*1, count*4] to [0, 10]
      result[dim.key] = Math.round(((sum - count) / (count * 3)) * 100) / 10;
    }
  }

  return result as unknown as ProfileResult;
}
