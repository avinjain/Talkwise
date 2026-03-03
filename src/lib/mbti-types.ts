// MBTI type descriptions — characteristics, strengths, weaknesses, growth tips

export interface MBTITypeInfo {
  name: string;
  description: string;
  keyCharacteristics: string[];
  strengths: string[];
  weaknesses: string[];
  professionGrowth: string[];
  personalGrowth: string[];
}

export const MBTI_TYPE_DESCRIPTIONS: Record<string, MBTITypeInfo> = {
  INTJ: {
    name: 'The Architect',
    description: 'Strategic, independent thinkers with original minds and a strong drive to implement their ideas. INTJs set high standards for themselves and others, value competence, and prefer working with a clear vision toward long-term goals.',
    keyCharacteristics: ['Strategic planner', 'Independent', 'High standards', 'Long-term vision', 'Logical', 'Reserved'],
    strengths: ['Strong analytical and strategic thinking', 'Self-driven and determined', 'Excellent at long-term planning', 'Direct and honest communication'],
    weaknesses: ['Can be overly critical or dismissive', 'May struggle with emotional expression', 'Can seem aloof or insensitive', 'Impatient with inefficiency'],
    professionGrowth: ['Practice giving credit and recognition to others', 'Develop patience for collaborative processes', 'Share your vision more openly to inspire teams', 'Balance perfectionism with timely delivery'],
    personalGrowth: ['Express appreciation and affection more openly', 'Listen without immediately problem-solving', 'Allow others to contribute to plans', 'Schedule downtime for connection'],
  },
  INTP: {
    name: 'The Logician',
    description: 'Analytical, theoretical thinkers who seek logical explanations for everything. INTPs enjoy exploring ideas in depth, value intellectual curiosity, and often prefer working through complex problems independently.',
    keyCharacteristics: ['Analytical', 'Theoretical', 'Intellectually curious', 'Independent', 'Flexible', 'Reserved'],
    strengths: ['Creative problem-solving', 'Deep analytical ability', 'Open-minded and adaptable', 'Honest and objective'],
    weaknesses: ['Can overlook practical details', 'May procrastinate on routine tasks', 'Struggle with small talk', 'Can seem detached'],
    professionGrowth: ['Set deadlines and follow through on commitments', 'Communicate ideas in accessible ways', 'Build relationships for collaboration', 'Balance analysis with action'],
    personalGrowth: ['Initiate social connection more often', 'Share your inner world with others', 'Acknowledge emotions as valid', 'Show up for others\' important moments'],
  },
  ENTJ: {
    name: 'The Commander',
    description: 'Bold, imaginative leaders who find or create ways to achieve their goals. ENTJs are decisive, strong-willed, and excel at organizing people and resources to get results.',
    keyCharacteristics: ['Decisive', 'Ambitious', 'Natural leader', 'Strategic', 'Direct', 'Results-oriented'],
    strengths: ['Strong leadership and organization', 'Confident decision-making', 'Efficient and goal-focused', 'Inspiring to others'],
    weaknesses: ['Can be domineering or impatient', 'May overlook feelings', 'Struggle with sensitivity', 'Can seem intimidating'],
    professionGrowth: ['Listen before deciding', 'Acknowledge others\' contributions', 'Balance drive with empathy', 'Delegate and trust others'],
    personalGrowth: ['Pause to ask how others feel', 'Celebrate small wins with loved ones', 'Share vulnerability', 'Create space for others to lead'],
  },
  ENTP: {
    name: 'The Debater',
    description: 'Curious, quick-witted thinkers who enjoy intellectual challenges and exploring new ideas. ENTPs are inventive, love a good debate, and thrive in environments that allow creative problem-solving.',
    keyCharacteristics: ['Curious', 'Quick-witted', 'Inventive', 'Debate-loving', 'Adaptable', 'Energetic'],
    strengths: ['Creative and innovative', 'Excellent at seeing possibilities', 'Charming and engaging', 'Resilient and adaptable'],
    weaknesses: ['Can argue for argument\'s sake', 'May neglect follow-through', 'Struggle with routine', 'Can seem insensitive'],
    professionGrowth: ['Complete projects before starting new ones', 'Choose when to debate vs. when to support', 'Document and systematize your ideas', 'Build consistency in execution'],
    personalGrowth: ['Pick your battles in relationships', 'Show up for mundane moments', 'Validate before debating', 'Follow through on promises'],
  },
  INFJ: {
    name: 'The Advocate',
    description: 'Insightful, idealistic individuals who seek meaning and connection in their work and relationships. INFJs are often attuned to others\' motivations and strive to help people reach their potential.',
    keyCharacteristics: ['Insightful', 'Idealistic', 'Empathetic', 'Private', 'Determined', 'Creative'],
    strengths: ['Deep empathy and intuition', 'Strong values and integrity', 'Creative vision', 'Dedicated to helping others'],
    weaknesses: ['Can be overly idealistic', 'May neglect own needs', 'Sensitive to criticism', 'Struggle with conflict'],
    professionGrowth: ['Set boundaries to avoid burnout', 'Share your vision more concretely', 'Accept incremental progress', 'Advocate for yourself as well as others'],
    personalGrowth: ['Prioritize your own needs', 'Say no without guilt', 'Share your feelings openly', 'Allow others to support you'],
  },
  INFP: {
    name: 'The Mediator',
    description: 'Idealistic, adaptable individuals who are loyal to their values and focused on personal growth. INFPs are empathetic, creative, and often seek harmony while staying true to their principles.',
    keyCharacteristics: ['Idealistic', 'Empathetic', 'Creative', 'Adaptable', 'Values-driven', 'Reserved'],
    strengths: ['Deep empathy and compassion', 'Creative and imaginative', 'Authentic and genuine', 'Open-minded and accepting'],
    weaknesses: ['Can be overly idealistic', 'May avoid conflict', 'Struggle with structure', 'Sensitive to criticism'],
    professionGrowth: ['Set and defend boundaries', 'Share your ideas even when uncertain', 'Create structure for your projects', 'Advocate for your work'],
    personalGrowth: ['Express needs directly', 'Handle conflict rather than avoiding it', 'Celebrate your achievements', 'Stay grounded in reality'],
  },
  ENFJ: {
    name: 'The Protagonist',
    description: 'Charismatic, inspiring leaders who naturally motivate and guide others. ENFJs are empathetic, organized, and dedicated to helping people grow and achieve their goals.',
    keyCharacteristics: ['Charismatic', 'Empathetic', 'Organized', 'Inspiring', 'Supportive', 'Idealistic'],
    strengths: ['Natural leadership and motivation', 'Strong empathy and people skills', 'Organized and dedicated', 'Inspire others to grow'],
    weaknesses: ['Can be overly idealistic', 'May neglect own needs', 'Sensitive to criticism', 'Can be controlling'],
    professionGrowth: ['Delegate and trust others', 'Accept that not everyone will agree', 'Set boundaries to avoid burnout', 'Focus on your own growth too'],
    personalGrowth: ['Take time for yourself', 'Let others make their own choices', 'Receive help and support', 'Accept imperfection in relationships'],
  },
  ENFP: {
    name: 'The Campaigner',
    description: 'Enthusiastic, creative free spirits who love exploring possibilities and connecting with people. ENFPs are optimistic, adaptable, and bring energy and warmth to their relationships and projects.',
    keyCharacteristics: ['Enthusiastic', 'Creative', 'Optimistic', 'Adaptable', 'Warm', 'Curious'],
    strengths: ['Energizing and inspiring', 'Creative and innovative', 'Strong people skills', 'Adaptable and resilient'],
    weaknesses: ['Can struggle with follow-through', 'May overlook details', 'Can be emotionally intense', 'Struggle with routine'],
    professionGrowth: ['Create systems for follow-through', 'Balance enthusiasm with execution', 'Prioritize and focus', 'Document and complete projects'],
    personalGrowth: ['Ground yourself in the present', 'Follow through on commitments', 'Manage emotional intensity', 'Create stability for loved ones'],
  },
  ISTJ: {
    name: 'The Logistician',
    description: 'Practical, thorough, and dependable individuals who value tradition and order. ISTJs are reliable, detail-oriented, and excel at creating and following through on clear plans.',
    keyCharacteristics: ['Practical', 'Thorough', 'Dependable', 'Detail-oriented', 'Traditional', 'Reserved'],
    strengths: ['Reliable and consistent', 'Strong attention to detail', 'Excellent at planning', 'Dedicated and responsible'],
    weaknesses: ['Can be inflexible', 'May resist change', 'Struggle with abstract ideas', 'Can seem unemotional'],
    professionGrowth: ['Embrace change and new approaches', 'Share the reasoning behind rules', 'Flex when circumstances demand it', 'Recognize others\' contributions'],
    personalGrowth: ['Express feelings more openly', 'Try new experiences', 'Listen without fixing', 'Celebrate spontaneity'],
  },
  ISFJ: {
    name: 'The Defender',
    description: 'Warm, dedicated protectors who are loyal and conscientious. ISFJs are supportive, observant, and often go out of their way to help others and maintain harmony.',
    keyCharacteristics: ['Warm', 'Dedicated', 'Loyal', 'Supportive', 'Observant', 'Conscientious'],
    strengths: ['Reliable and caring', 'Attentive to others\' needs', 'Practical and thorough', 'Loyal and dedicated'],
    weaknesses: ['Can neglect own needs', 'May avoid conflict', 'Struggle with change', 'Can be overly self-critical'],
    professionGrowth: ['Advocate for yourself', 'Embrace new approaches', 'Set boundaries', 'Share your accomplishments'],
    personalGrowth: ['Prioritize your needs', 'Handle conflict directly', 'Accept help from others', 'Celebrate your contributions'],
  },
  ESTJ: {
    name: 'The Executive',
    description: 'Practical organizers and natural leaders who value structure and efficiency. ESTJs are decisive, direct, and excel at managing people and projects to achieve results.',
    keyCharacteristics: ['Practical', 'Organized', 'Decisive', 'Direct', 'Efficient', 'Structured'],
    strengths: ['Strong organizational skills', 'Decisive and direct', 'Reliable and responsible', 'Natural leadership'],
    weaknesses: ['Can be inflexible', 'May seem harsh', 'Struggle with ambiguity', 'Can be impatient'],
    professionGrowth: ['Listen before directing', 'Acknowledge others\' perspectives', 'Flex when needed', 'Balance efficiency with empathy'],
    personalGrowth: ['Pause before reacting', 'Ask how others feel', 'Allow flexibility in plans', 'Express appreciation openly'],
  },
  ESFJ: {
    name: 'The Consul',
    description: 'Caring, sociable individuals who are conscientious and people-focused. ESFJs value harmony, work hard to support others, and thrive in collaborative environments.',
    keyCharacteristics: ['Caring', 'Sociable', 'Conscientious', 'Harmony-seeking', 'Supportive', 'Practical'],
    strengths: ['Strong people skills', 'Reliable and supportive', 'Create harmony', 'Dedicated and loyal'],
    weaknesses: ['Can be overly sensitive to criticism', 'May avoid conflict', 'Struggle with change', 'Can neglect own needs'],
    professionGrowth: ['Accept constructive criticism', 'Set boundaries', 'Embrace necessary change', 'Advocate for yourself'],
    personalGrowth: ['Prioritize your needs', 'Handle disagreement directly', 'Allow others to support you', 'Accept imperfection'],
  },
  ISTP: {
    name: 'The Virtuoso',
    description: 'Pragmatic, flexible problem-solvers who analyze cause and effect. ISTPs are calm under pressure, enjoy hands-on work, and prefer to take action rather than theorize.',
    keyCharacteristics: ['Pragmatic', 'Flexible', 'Calm', 'Hands-on', 'Analytical', 'Independent'],
    strengths: ['Calm under pressure', 'Practical problem-solving', 'Adaptable and flexible', 'Hands-on and skilled'],
    weaknesses: ['Can seem detached', 'May resist commitment', 'Struggle with long-term planning', 'Can be private'],
    professionGrowth: ['Share your process with others', 'Commit to long-term projects', 'Communicate your value', 'Build lasting relationships'],
    personalGrowth: ['Share your thoughts and feelings', 'Show up for others consistently', 'Express appreciation', 'Plan for the future together'],
  },
  ISFP: {
    name: 'The Adventurer',
    description: 'Quiet, sensitive individuals who enjoy the present moment and value personal space. ISFPs are artistic, gentle, and often express themselves through creativity and action.',
    keyCharacteristics: ['Quiet', 'Sensitive', 'Artistic', 'Gentle', 'Present-focused', 'Flexible'],
    strengths: ['Creative and artistic', 'Gentle and considerate', 'Present and attentive', 'Authentic and genuine'],
    weaknesses: ['Can avoid conflict', 'May struggle with planning', 'Sensitive to criticism', 'Can be overly private'],
    professionGrowth: ['Advocate for your work', 'Plan for long-term goals', 'Share your ideas', 'Handle feedback constructively'],
    personalGrowth: ['Express needs directly', 'Engage in conflict when needed', 'Share your inner world', 'Set and maintain boundaries'],
  },
  ESTP: {
    name: 'The Entrepreneur',
    description: 'Flexible, pragmatic individuals who focus on immediate results and action. ESTPs are energetic, observant, and thrive in dynamic environments where they can think on their feet.',
    keyCharacteristics: ['Flexible', 'Pragmatic', 'Energetic', 'Observant', 'Action-oriented', 'Adaptable'],
    strengths: ['Quick-thinking and adaptable', 'Energetic and engaging', 'Practical and results-focused', 'Calm under pressure'],
    weaknesses: ['Can overlook long-term impact', 'May seem insensitive', 'Struggle with routine', 'Can be impulsive'],
    professionGrowth: ['Consider long-term consequences', 'Build consistent habits', 'Listen before acting', 'Balance action with reflection'],
    personalGrowth: ['Pause before reacting', 'Consider others\' feelings', 'Follow through on commitments', 'Create stability for loved ones'],
  },
  ESFP: {
    name: 'The Entertainer',
    description: 'Outgoing, spontaneous lovers of life and people who learn through doing. ESFPs bring enthusiasm and warmth to social situations and enjoy making others feel good.',
    keyCharacteristics: ['Outgoing', 'Spontaneous', 'Enthusiastic', 'Warm', 'Present-focused', 'Practical'],
    strengths: ['Energizing and fun', 'Observant and attentive', 'Warm and caring', 'Adaptable and flexible'],
    weaknesses: ['Can avoid long-term planning', 'May struggle with conflict', 'Sensitive to criticism', 'Can be impulsive'],
    professionGrowth: ['Plan for the future', 'Handle difficult conversations', 'Balance fun with responsibility', 'Build lasting professional relationships'],
    personalGrowth: ['Consider long-term impact', 'Address conflict directly', 'Create stability', 'Balance spontaneity with commitment'],
  },
};

export function getMBTITypeInfo(type: string): MBTITypeInfo | null {
  const key = type?.toUpperCase?.();
  return (key && MBTI_TYPE_DESCRIPTIONS[key]) || null;
}
