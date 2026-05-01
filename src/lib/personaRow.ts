import type { SavedPersonaRow } from '@/lib/db';
import type { LifeContext, SavedPersona, Track } from '@/lib/types';

export function rowToPersona(row: SavedPersonaRow): SavedPersona {
  const lc = row.life_context;
  const track = (row.track || 'professional') as Track;
  const lifeContext: LifeContext | undefined =
    track === 'personal' && (lc === 'social' || lc === 'dating') ? lc : undefined;

  return {
    id: row.id,
    userId: row.user_id,
    track,
    name: row.name,
    designation: row.designation?.trim() ? row.designation : undefined,
    lifeContext,
    goal: row.goal,
    scenario: row.scenario,
    difficultyLevel: row.difficulty_level,
    decisionOrientation: row.decision_orientation,
    communicationStyle: row.communication_style,
    authorityPosture: row.authority_posture,
    temperamentStability: row.temperament_stability,
    socialPresence: row.social_presence,
    interestLevel: row.interest_level ?? 5,
    flirtatiousness: row.flirtatiousness ?? 5,
    communicationEffort: row.communication_effort ?? 5,
    emotionalOpenness: row.emotional_openness ?? 5,
    humorStyle: row.humor_style ?? 5,
    pickiness: row.pickiness ?? 5,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
