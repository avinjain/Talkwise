import { getAuthUserId } from '@/lib/session';
import { getUserPersonas, savePersona } from '@/lib/db';
import { SavedPersona } from '@/lib/types';
import { SavedPersonaRow } from '@/lib/db';

export const runtime = 'nodejs';

function rowToPersona(row: SavedPersonaRow): SavedPersona {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    goal: row.goal,
    scenario: row.scenario,
    difficultyLevel: row.difficulty_level,
    decisionOrientation: row.decision_orientation,
    communicationStyle: row.communication_style,
    authorityPosture: row.authority_posture,
    temperamentStability: row.temperament_stability,
    socialPresence: row.social_presence,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// GET /api/personas — list user's saved personas
export async function GET() {
  try {
    const userId = await getAuthUserId();
    if (!userId) {
      return Response.json({ error: 'Authentication required' }, { status: 401 });
    }

    const rows = getUserPersonas(userId);
    const personas = rows.map(rowToPersona);
    return Response.json(personas);
  } catch (error) {
    console.error('Personas GET error:', error);
    return Response.json({ error: 'Failed to fetch personas' }, { status: 500 });
  }
}

// POST /api/personas — create a new persona
export async function POST(req: Request) {
  try {
    const userId = await getAuthUserId();
    if (!userId) {
      console.error('Personas POST: auth failed, no userId. NEXTAUTH_URL:', process.env.NEXTAUTH_URL);
      return Response.json({ error: 'Authentication required. Please sign out and sign back in.' }, { status: 401 });
    }

    const body = await req.json();
    const id = crypto.randomUUID();

    console.log('Creating persona for user:', userId, 'name:', body.name);

    savePersona({
      id,
      user_id: userId,
      name: body.name || 'Unnamed Persona',
      goal: body.goal || '',
      scenario: body.scenario || '',
      difficulty_level: body.difficultyLevel ?? 5,
      decision_orientation: body.decisionOrientation ?? 5,
      communication_style: body.communicationStyle ?? 5,
      authority_posture: body.authorityPosture ?? 5,
      temperament_stability: body.temperamentStability ?? 5,
      social_presence: body.socialPresence ?? 5,
    });

    const rows = getUserPersonas(userId);
    const created = rows.find((r) => r.id === id);
    if (!created) {
      console.error('Personas POST: insert succeeded but row not found. id:', id);
      return Response.json({ error: 'Persona was saved but could not be retrieved.' }, { status: 500 });
    }

    return Response.json(rowToPersona(created), { status: 201 });
  } catch (error) {
    console.error('Personas POST error:', error);
    const message = error instanceof Error ? error.message : 'Failed to create persona';
    return Response.json({ error: message }, { status: 500 });
  }
}
