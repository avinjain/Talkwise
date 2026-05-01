import { getAuthUserId } from '@/lib/session';
import { getPersonaById, updatePersona, deletePersona } from '@/lib/db';
import { rowToPersona } from '@/lib/personaRow';

export const runtime = 'nodejs';

const lifeContextForPut = (track: string, raw: unknown): string => {
  if (track !== 'personal') return '';
  if (raw === 'social' || raw === 'dating') return raw;
  return 'dating';
};

// PUT /api/personas/[id] — update a persona
export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const userId = await getAuthUserId();
    if (!userId) {
      return Response.json({ error: 'Authentication required' }, { status: 401 });
    }

    const existing = getPersonaById(params.id, userId);
    if (!existing) {
      return Response.json({ error: 'Persona not found' }, { status: 404 });
    }

    const body = await req.json();
    const track = body.track ?? existing.track ?? 'professional';

    updatePersona(params.id, userId, {
      name: body.name,
      designation: typeof body.designation === 'string' ? body.designation : undefined,
      life_context: lifeContextForPut(track, body.lifeContext),
      goal: body.goal,
      scenario: body.scenario,
      track: body.track,
      difficulty_level: body.difficultyLevel,
      decision_orientation: body.decisionOrientation,
      communication_style: body.communicationStyle,
      authority_posture: body.authorityPosture,
      temperament_stability: body.temperamentStability,
      social_presence: body.socialPresence,
      interest_level: body.interestLevel,
      flirtatiousness: body.flirtatiousness,
      communication_effort: body.communicationEffort,
      emotional_openness: body.emotionalOpenness,
      humor_style: body.humorStyle,
      pickiness: body.pickiness,
    });

    const updated = getPersonaById(params.id, userId);
    if (!updated) {
      return Response.json({ error: 'Failed to update persona' }, { status: 500 });
    }

    return Response.json(rowToPersona(updated));
  } catch (error) {
    console.error('Personas PUT error:', error);
    return Response.json({ error: 'Failed to update persona' }, { status: 500 });
  }
}

// DELETE /api/personas/[id] — delete a persona
export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    const userId = await getAuthUserId();
    if (!userId) {
      return Response.json({ error: 'Authentication required' }, { status: 401 });
    }

    const existing = getPersonaById(params.id, userId);
    if (!existing) {
      return Response.json({ error: 'Persona not found' }, { status: 404 });
    }

    deletePersona(params.id, userId);
    return Response.json({ success: true });
  } catch (error) {
    console.error('Personas DELETE error:', error);
    return Response.json({ error: 'Failed to delete persona' }, { status: 500 });
  }
}
