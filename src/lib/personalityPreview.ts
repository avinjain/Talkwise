import type { LifeContext, Track } from './types';

export function personalityPreviewTitle(displayName: string): string {
  const n = displayName.trim();
  if (!n) return "This character's personality";
  return `${n}'s personality`;
}

function v(traits: Record<string, number>, key: string): number {
  return traits[key] ?? 5;
}

/** Qualitative blend for configure preview — no per-slider numeric echo. */
export function buildPersonalityNarrative(
  track: Track,
  traits: Record<string, number>,
  lifeContext?: LifeContext
): { headline: string; bullets: string[] } {
  if (track === 'personal') {
    return narrativePersonal(traits, lifeContext ?? 'dating');
  }
  return narrativeProfessional(traits);
}

function narrativeProfessional(traits: Record<string, number>): { headline: string; bullets: string[] } {
  const difficulty = v(traits, 'difficultyLevel');
  const comm = v(traits, 'communicationStyle');
  const authority = v(traits, 'authorityPosture');
  const temper = v(traits, 'temperamentStability');
  const social = v(traits, 'socialPresence');
  const decision = v(traits, 'decisionOrientation');

  const bullets: string[] = [];

  if (difficulty >= 7) {
    bullets.push('Conversation skews demanding — expect pushback, skepticism, and less forgiveness for vague ideas.');
  } else if (difficulty <= 3) {
    bullets.push('Generally easier to converse with — more room to explain yourself without sharp resistance.');
  } else {
    bullets.push('Moderate friction — challenging enough to feel real without being hostile.');
  }

  if (comm <= 3) {
    bullets.push('Communication reads blunt and plain-spoken; little cushioning around disagreement.');
  } else if (comm >= 7) {
    bullets.push('Comes across diplomatic and tactful — disagreement tends to sound softened.');
  }

  if (authority >= 7) {
    bullets.push('Strong executive presence — leads the tempo and expects substance.');
  } else if (authority <= 3) {
    bullets.push('Lower dominance in the room — more collaborative or deferential stance.');
  }

  if (social <= 3) {
    bullets.push('Keeps exchanges economical — may feel brisk or distant until there’s a clear point.');
  } else if (social >= 7) {
    bullets.push('Warm openness — greets ideas with more engagement and relational warmth.');
  }

  if (temper <= 3) {
    bullets.push('Emotional edges show faster — irritation or impatience can surface under pressure.');
  } else if (temper >= 7) {
    bullets.push('Emotionally steady — harder to rattle; reactions stay measured.');
  }

  if (decision <= 3) {
    bullets.push('Oriented toward caution and downside risk — asks “what could go wrong?”');
  } else if (decision >= 7) {
    bullets.push('Bias toward momentum and outcomes — favors decisive movement over prolonged debate.');
  }

  let headline = 'Balanced workplace persona';
  const tough = difficulty >= 6;
  const soft = difficulty <= 4;
  const direct = comm <= 4;
  const warm = comm >= 6;

  if (tough && direct) headline = 'Hard-edged and plain-spoken — a stiff conversation';
  else if (tough && warm) headline = 'Tough but polished — disagreeable without being rude';
  else if (soft && warm) headline = 'Approachable professional — natural flow';
  else if (soft && direct) headline = 'Straightforward yet forgiving — easier tension';
  else if (authority >= 7 && tough) headline = 'High authority, high bar — expects clarity fast';
  else if (social >= 7 && soft) headline = 'Relational and accommodating — softer landing';

  const uniq = [...new Set(bullets)];
  return { headline, bullets: uniq.slice(0, 6) };
}

function narrativePersonal(
  traits: Record<string, number>,
  lifeContext: LifeContext
): { headline: string; bullets: string[] } {
  const interest = v(traits, 'interestLevel');
  const effort = v(traits, 'communicationEffort');
  const flirt = v(traits, 'flirtatiousness');
  const open = v(traits, 'emotionalOpenness');
  const humor = v(traits, 'humorStyle');
  const picky = v(traits, 'pickiness');

  const bullets: string[] = [];

  if (lifeContext === 'dating') {
    bullets.push('Framed like someone you matched with — pacing and stakes feel romantic or flirt-forward.');
  } else {
    bullets.push('Framed as social chemistry — friendship, parties, or casual hangouts rather than romance.');
  }

  const effortLow = effort <= 3 && interest <= 4;
  const effortHigh = effort >= 7 || interest >= 7;

  if (effortLow) {
    bullets.push('Hard to keep a thread going — short replies and low initiative unless something really hooks them.');
  } else if (effortHigh) {
    bullets.push('Easy back-and-forth — carries conversation energy and meets you halfway.');
  } else {
    bullets.push('Mixed cadence — engaged when interested, cooler when bored.');
  }

  if (picky >= 7) {
    bullets.push('High standards — generic lines land flat; originality matters.');
  } else if (picky <= 3) {
    bullets.push('Low pickiness — forgiving of awkward moments and ordinary openers.');
  }

  if (open <= 3) {
    bullets.push('Guarded emotionally — slower to share vulnerability or deep feelings.');
  } else if (open >= 7) {
    bullets.push('Emotionally open — shares feelings and warmth more readily.');
  }

  if (lifeContext === 'dating') {
    if (flirt <= 3) {
      bullets.push('Reserved flirt style — friendly more than spicy.');
    } else if (flirt >= 7) {
      bullets.push('High flirt energy — playful tension and teasing come naturally.');
    }
  }

  if (humor <= 3) {
    bullets.push('Dry or minimal humor — jokes land quietly or not at all.');
  } else if (humor >= 7) {
    bullets.push('Playful wit — enjoys banter and light roasting when it lands.');
  }

  let headline =
    lifeContext === 'dating' ? 'Dating-app chemistry — personality blend' : 'Social vibe — how they come across';

  const cold = effortLow || interest <= 3;
  const spark = flirt >= 6 || humor >= 6;

  if (lifeContext === 'dating') {
    if (cold && picky >= 6) headline = 'Slow burn — picky and low texting effort';
    else if (!cold && spark && open >= 6) headline = 'Warm and playful — easier romantic rapport';
    else if (!cold && picky >= 6) headline = 'Fun but discerning — charm has to earn its keep';
    else if (cold) headline = 'Quiet presence — takes patience to warm up';
  } else {
    if (!cold && humor >= 6) headline = 'Social butterfly energy — banter-forward';
    else if (cold) headline = 'Reserved in groups — shorter runway socially';
    else headline = 'Middle-ground friend energy — approachable without performing';
  }

  const uniq = [...new Set(bullets)];
  return { headline, bullets: uniq.slice(0, 7) };
}
