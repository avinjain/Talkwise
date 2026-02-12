import { getAuthUserId } from '@/lib/session';
import { getPersonaById, updatePersona, deletePersona } from '@/lib/db';

export const runtime = 'nodejs';

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

    updatePersona(params.id, userId, {
      name: body.name,
      goal: body.goal,
      scenario: body.scenario,
      difficulty_level: body.difficultyLevel,
      decision_orientation: body.decisionOrientation,
      communication_style: body.communicationStyle,
      authority_posture: body.authorityPosture,
      temperament_stability: body.temperamentStability,
      social_presence: body.socialPresence,
    });

    const updated = getPersonaById(params.id, userId);
    if (!updated) {
      return Response.json({ error: 'Failed to update persona' }, { status: 500 });
    }

    return Response.json({
      id: updated.id,
      userId: updated.user_id,
      name: updated.name,
      goal: updated.goal,
      scenario: updated.scenario,
      difficultyLevel: updated.difficulty_level,
      decisionOrientation: updated.decision_orientation,
      communicationStyle: updated.communication_style,
      authorityPosture: updated.authority_posture,
      temperamentStability: updated.temperament_stability,
      socialPresence: updated.social_presence,
      createdAt: updated.created_at,
      updatedAt: updated.updated_at,
    });
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
