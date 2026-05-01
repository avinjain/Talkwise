import type { LifeContext, Track } from './types';

export function personalityPreviewTitle(displayName: string): string {
  const n = displayName.trim();
  if (!n) return "This character's personality";
  return `${n}'s personality`;
}

function val(traits: Record<string, number>, key: string): number {
  return traits[key] ?? 5;
}

/**
 * Single holistic summary from all sliders — describes overall persona,
 * not pole-by-pole “bias” wording.
 */
export function buildPersonalityNarrative(
  track: Track,
  traits: Record<string, number>,
  lifeContext?: LifeContext
): { headline: string; summary: string } {
  if (track === 'personal') {
    return holisticPersonal(traits, lifeContext ?? 'dating');
  }
  return holisticProfessional(traits);
}

/** Mean of trait keys — captures overall intensity vs midpoint */
function meanScores(values: number[]): number {
  if (values.length === 0) return 5;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function holisticProfessional(traits: Record<string, number>): { headline: string; summary: string } {
  const difficulty = val(traits, 'difficultyLevel');
  const comm = val(traits, 'communicationStyle'); // low vague/flowery, high concise/direct
  const authority = val(traits, 'authorityPosture');
  const temper = val(traits, 'temperamentStability'); // low volatile, high calm
  const social = val(traits, 'socialPresence');
  const decision = val(traits, 'decisionOrientation'); // low intuitive, high analytical

  const six = [difficulty, comm, authority, temper, social, decision];
  const spread =
    Math.max(...six) - Math.min(...six);
  const centroid = meanScores(six);

  // ── Sentence 1: how conversations feel (difficulty × warmth × voice texture) ──
  let s1: string;
  const warm = social >= 6;
  const cool = social <= 4;
  const hard = difficulty >= 7;
  const easy = difficulty <= 3;
  const direct = comm >= 7;
  const indirect = comm <= 3;

  if (warm && easy && !direct) {
    s1 =
      'Overall they come across as approachable and forgiving in dialogue — socially warm, not hunting for mistakes, and rarely cutting.';
  } else if (cool && hard && direct) {
    s1 =
      'Overall they scan as intense and spare with warmth — socially cooler, quick to tighten the screws, and plain-spoken when ideas feel thin.';
  } else if (warm && hard) {
    s1 =
      'Overall they blend rapport with rigor — personable surface, but still stretches you when substance or clarity falls short.';
  } else if (cool && easy) {
    s1 =
      'Overall they feel reserved rather than cuddly, yet not outright hostile — low small-talk energy with room still to recover mistakes.';
  } else if (direct && !warm) {
    s1 =
      'Overall interactions skew efficient and unsentimental — they drive toward the point without much relational cushioning.';
  } else if (indirect && warm) {
    s1 =
      'Overall they soften friction with warmth — messages may wander or hedge, but the vibe stays human and connecting.';
  } else {
    s1 =
      'Overall workplace exchanges land near “realistic middle”: neither purely cozy nor purely hostile — challenge and warmth trade off depending on the moment.';
  }

  // ── Sentence 2: authority + steadiness ──
  let s2: string;
  const hier = authority >= 7;
  const peer = authority <= 3;
  const calm = temper >= 7;
  const edgy = temper <= 3;

  if (hier && calm) {
    s2 =
      'Taken together on authority and temperament, they carry weight calmly — expects alignment with their lane without visibly losing composure.';
  } else if (peer && edgy) {
    s2 =
      'Taken together, they lean peer-flat but emotionally reactive — less corner-office gravitas, more sharp swings when rubbed the wrong way.';
  } else if (hier && edgy) {
    s2 =
      'Taken together, hierarchy reads strong but nerves shorter — commanding posture can spike into irritation faster than a steadier exec.';
  } else if (peer && calm) {
    s2 =
      'Taken together, power feels shared and steady — collaborative stance with emotions that mostly stay level under stress.';
  } else {
    s2 =
      'Taken together on rank and nerves, they sit between collaborator and commander — neither totally flat nor theatrically imposing.';
  }

  // ── Sentence 3: decision lens ──
  let s3: string;
  const analytical = decision >= 7;
  const intuitive = decision <= 3;

  if (analytical && direct) {
    s3 =
      'Across how they weigh choices and speak, evidence and bluntness reinforce each other — gut feelings take a back seat to clarity and logic.';
  } else if (intuitive && indirect) {
    s3 =
      'Across choices and wording, intuition and nuance dominate — comfortable with ambiguity and reading between lines.';
  } else if (analytical) {
    s3 =
      'Across decisions, they tilt analytic even when communication stays softer — asks how proof and outcomes line up.';
  } else if (intuitive) {
    s3 =
      'Across decisions, gut and context weigh heavily — persuasion is often about resonance and story, not spreadsheets alone.';
  } else {
    s3 =
      'Across decisions, head and instinct trade fairly evenly — neither a pure spreadsheet persona nor a purely vibes-driven one.';
  }

  const summary = `${s1} ${s2} ${s3}`;

  // ── Headline: compressed archetype from combined pattern ──
  let headline = 'Balanced workplace persona';
  if (spread >= 6 && (Math.max(...six) >= 8 || Math.min(...six) <= 2)) {
    headline = 'Contrasted profile — sharp highs and lows across dimensions';
  } else if (centroid >= 6.5) {
    headline = 'High-intensity operator — demanding + decisive tendencies dominate';
  } else if (centroid <= 3.5) {
    headline = 'Low-load presence — forgiving, softer edges overall';
  } else if (hard && direct && hier) {
    headline = 'Sterile clarity — authority and precision forward';
  } else if (warm && easy && peer) {
    headline = 'Trusted teammate energy — approachable and egalitarian';
  }

  return { headline, summary };
}

function holisticPersonal(
  traits: Record<string, number>,
  lifeContext: LifeContext
): { headline: string; summary: string } {
  const interest = val(traits, 'interestLevel');
  const effort = val(traits, 'communicationEffort');
  const flirt = val(traits, 'flirtatiousness');
  const open = val(traits, 'emotionalOpenness');
  const humor = val(traits, 'humorStyle');
  const picky = val(traits, 'pickiness');

  const six = [interest, effort, flirt, open, humor, picky];
  const spread = Math.max(...six) - Math.min(...six);
  const centroid = meanScores(six);

  const engagement = (interest + effort) / 2;
  const sparkle = (flirt + humor) / 2;

  const scenario =
    lifeContext === 'dating'
      ? 'In a dating-style chat'
      : 'In social-first settings';

  // ── Block 1: engagement cadence ──
  let b1: string;
  if (engagement >= 7) {
    b1 = `${scenario}, they read as visibly switched on — generous texting effort and genuine curiosity carry the thread.`;
  } else if (engagement <= 3) {
    b1 = `${scenario}, they read as low-bandwidth — brief replies and lukewarm curiosity mean you supply most of the momentum.`;
  } else {
    b1 = `${scenario}, engagement lands in the middle — interested enough when hooked, cooler when the vibe falls flat.`;
  }

  // ── Block 2: warmth vs guardrails (open × picky × flirt-spark for dating) ──
  let b2: string;
  const walled = open <= 4;
  const softHeart = open >= 7;
  const selective = picky >= 7;
  const chillStandards = picky <= 3;

  if (lifeContext === 'dating') {
    if (softHeart && sparkle >= 6 && !selective) {
      b2 =
        'Layered together, openness and playfulness outweigh pickiness — emotionally available with flirt or humor ready when trust builds.';
    } else if (walled && selective && sparkle <= 4) {
      b2 =
        'Layered together, they feel guarded and choosy with muted sparkle — rapport grows slowly and ordinary lines die quietly.';
    } else if (selective && sparkle >= 6) {
      b2 =
        'Layered together, standards stay high but banter still sells — charming when impressed, cool when bored.';
    } else if (chillStandards && walled) {
      b2 =
        'Layered together, easy-going judgment meets emotional armor — rarely cruel, still slow to truly open up.';
    } else {
      b2 =
        'Layered together on emotions versus standards, they neither fully bare themselves nor audition everyone ruthlessly — selective openness with situational warmth.';
    }
  } else {
    if (humor >= 7 && engagement >= 6) {
      b2 =
        'Layered together for hanging out energy, levity and presence reinforce each other — banter-forward without needing romance as the frame.';
    } else if (humor <= 3 && engagement <= 4) {
      b2 =
        'Layered together, social juice runs quiet — minimal jokes and muted enthusiasm until something genuinely clicks.';
    } else if (selective) {
      b2 =
        'Layered together, they quietly audition people — friendly surface, selective about who earns real availability.';
    } else {
      b2 =
        'Layered together as a friend-acquaintance blend — approachable defaults without forcing loud charisma.';
    }
  }

  // ── Block 3: humor flavor tied to whole shape ──
  let b3: string;
  if (humor <= 3 && flirt >= 6 && lifeContext === 'dating') {
    b3 =
      'Rounding out the picture, chemistry skews sincere-more-than-silly — intensity shows up in tension more than punchlines.';
  } else if (humor >= 7 && flirt <= 4 && lifeContext === 'dating') {
    b3 =
      'Rounding out the picture, they bond through lightness before heat — playful rhythm even when flirt stays tame.';
  } else if (humor <= 3) {
    b3 =
      'Rounding out the picture, humor stays dry or understated — connects through sincerity, sarcasm, or quiet wit rather than big laughs.';
  } else if (humor >= 7) {
    b3 =
      'Rounding out the picture, laughter is part of how they relate — silly or upbeat beats land naturally when comfortable.';
  } else {
    b3 =
      'Rounding out the picture, humor sits neither totally flat nor cartoon-bright — jokes land situationally.';
  }

  const summary = `${b1} ${b2} ${b3}`;

  let headline =
    lifeContext === 'dating' ? 'Romantic-chat persona — blended read' : 'Social persona — blended read';

  if (spread >= 6 && (Math.max(...six) >= 8 || Math.min(...six) <= 2)) {
    headline =
      lifeContext === 'dating'
        ? 'Mixed signals by design — sharp contrasts across sliders'
        : 'Eclectic social shape — loud contrasts between traits';
  } else if (centroid >= 6.5) {
    headline = lifeContext === 'dating' ? 'High-energy romantic prospect' : 'High-energy social presence';
  } else if (centroid <= 3.5) {
    headline = lifeContext === 'dating' ? 'Slow-burn, minimal-effort vibe' : 'Low-key wallflower tilt';
  } else if (engagement >= 7 && open >= 7) {
    headline = lifeContext === 'dating' ? 'Warm and invested match energy' : 'Open and engaged socially';
  }

  return { headline, summary };
}
