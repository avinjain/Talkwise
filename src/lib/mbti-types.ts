// MBTI type descriptions — what each of the 16 types means

export const MBTI_TYPE_DESCRIPTIONS: Record<string, { name: string; description: string }> = {
  INTJ: {
    name: 'The Architect',
    description: 'Strategic, independent thinkers with original minds and a strong drive to implement their ideas. INTJs set high standards for themselves and others, value competence, and prefer working with a clear vision toward long-term goals.',
  },
  INTP: {
    name: 'The Logician',
    description: 'Analytical, theoretical thinkers who seek logical explanations for everything. INTPs enjoy exploring ideas in depth, value intellectual curiosity, and often prefer working through complex problems independently.',
  },
  ENTJ: {
    name: 'The Commander',
    description: 'Bold, imaginative leaders who find or create ways to achieve their goals. ENTJs are decisive, strong-willed, and excel at organizing people and resources to get results.',
  },
  ENTP: {
    name: 'The Debater',
    description: 'Curious, quick-witted thinkers who enjoy intellectual challenges and exploring new ideas. ENTPs are inventive, love a good debate, and thrive in environments that allow creative problem-solving.',
  },
  INFJ: {
    name: 'The Advocate',
    description: 'Insightful, idealistic individuals who seek meaning and connection in their work and relationships. INFJs are often attuned to others\' motivations and strive to help people reach their potential.',
  },
  INFP: {
    name: 'The Mediator',
    description: 'Idealistic, adaptable individuals who are loyal to their values and focused on personal growth. INFPs are empathetic, creative, and often seek harmony while staying true to their principles.',
  },
  ENFJ: {
    name: 'The Protagonist',
    description: 'Charismatic, inspiring leaders who naturally motivate and guide others. ENFJs are empathetic, organized, and dedicated to helping people grow and achieve their goals.',
  },
  ENFP: {
    name: 'The Campaigner',
    description: 'Enthusiastic, creative free spirits who love exploring possibilities and connecting with people. ENFPs are optimistic, adaptable, and bring energy and warmth to their relationships and projects.',
  },
  ISTJ: {
    name: 'The Logistician',
    description: 'Practical, thorough, and dependable individuals who value tradition and order. ISTJs are reliable, detail-oriented, and excel at creating and following through on clear plans.',
  },
  ISFJ: {
    name: 'The Defender',
    description: 'Warm, dedicated protectors who are loyal and conscientious. ISFJs are supportive, observant, and often go out of their way to help others and maintain harmony.',
  },
  ESTJ: {
    name: 'The Executive',
    description: 'Practical organizers and natural leaders who value structure and efficiency. ESTJs are decisive, direct, and excel at managing people and projects to achieve results.',
  },
  ESFJ: {
    name: 'The Consul',
    description: 'Caring, sociable individuals who are conscientious and people-focused. ESFJs value harmony, work hard to support others, and thrive in collaborative environments.',
  },
  ISTP: {
    name: 'The Virtuoso',
    description: 'Pragmatic, flexible problem-solvers who analyze cause and effect. ISTPs are calm under pressure, enjoy hands-on work, and prefer to take action rather than theorize.',
  },
  ISFP: {
    name: 'The Adventurer',
    description: 'Quiet, sensitive individuals who enjoy the present moment and value personal space. ISFPs are artistic, gentle, and often express themselves through creativity and action.',
  },
  ESTP: {
    name: 'The Entrepreneur',
    description: 'Flexible, pragmatic individuals who focus on immediate results and action. ESTPs are energetic, observant, and thrive in dynamic environments where they can think on their feet.',
  },
  ESFP: {
    name: 'The Entertainer',
    description: 'Outgoing, spontaneous lovers of life and people who learn through doing. ESFPs bring enthusiasm and warmth to social situations and enjoy making others feel good.',
  },
};

export function getMBTITypeInfo(type: string): { name: string; description: string } | null {
  const key = type?.toUpperCase?.();
  return (key && MBTI_TYPE_DESCRIPTIONS[key]) || null;
}
