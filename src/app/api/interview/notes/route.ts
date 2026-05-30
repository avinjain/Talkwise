import { NextResponse } from 'next/server';
import { getAuthUserId } from '@/lib/session';
import {
  listInterviewNotes,
  insertInterviewNote,
  updateInterviewNote,
  deleteInterviewNote,
  type InterviewNoteRow,
} from '@/lib/db';

export const runtime = 'nodejs';

const MAX_BODY = 8000;
const MAX_TITLE = 200;

function toDTO(row: InterviewNoteRow) {
  return {
    id: row.id,
    title: row.title,
    body: row.body,
    tag: row.tag,
    updatedAt: row.updated_at,
    createdAt: row.created_at,
  };
}

// GET — list notes
export async function GET() {
  const userId = await getAuthUserId();
  if (!userId) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  return NextResponse.json({ notes: listInterviewNotes(userId).map(toDTO) });
}

// POST — create note
export async function POST(req: Request) {
  const userId = await getAuthUserId();
  if (!userId) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const title = (typeof body.title === 'string' ? body.title : '').trim().slice(0, MAX_TITLE);
  const noteBody = (typeof body.body === 'string' ? body.body : '').slice(0, MAX_BODY);
  const tag = (typeof body.tag === 'string' ? body.tag : '').trim().slice(0, 60);
  if (!title && !noteBody) return NextResponse.json({ error: 'A note needs a title or body.' }, { status: 400 });
  const id = insertInterviewNote(userId, { title: title || 'Untitled note', body: noteBody, tag });
  const created = listInterviewNotes(userId).find((n) => n.id === id);
  return NextResponse.json({ note: created ? toDTO(created) : null });
}

// PATCH — update note
export async function PATCH(req: Request) {
  const userId = await getAuthUserId();
  if (!userId) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const id = typeof body.id === 'string' ? body.id : '';
  if (!id) return NextResponse.json({ error: 'Missing note id' }, { status: 400 });
  updateInterviewNote(id, userId, {
    title: typeof body.title === 'string' ? body.title.slice(0, MAX_TITLE) : undefined,
    body: typeof body.body === 'string' ? body.body.slice(0, MAX_BODY) : undefined,
    tag: typeof body.tag === 'string' ? body.tag.slice(0, 60) : undefined,
  });
  const updated = listInterviewNotes(userId).find((n) => n.id === id);
  return NextResponse.json({ note: updated ? toDTO(updated) : null });
}

// DELETE — remove note (?id=...)
export async function DELETE(req: Request) {
  const userId = await getAuthUserId();
  if (!userId) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  const id = new URL(req.url).searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Missing note id' }, { status: 400 });
  deleteInterviewNote(id, userId);
  return NextResponse.json({ ok: true });
}
