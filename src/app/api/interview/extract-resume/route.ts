import { NextResponse } from 'next/server';
import { getAuthUserId } from '@/lib/session';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParse = require('pdf-parse-new');
import mammoth from 'mammoth';

export const runtime = 'nodejs';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

async function extractText(file: File): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer());
  if (buffer.length > MAX_FILE_SIZE) throw new Error('File too large. Max 5MB.');
  const type = file.type;
  const name = (file.name || '').toLowerCase();
  if (type === 'application/pdf' || name.endsWith('.pdf')) {
    const data = await pdfParse(buffer);
    return (data?.text ?? '').trim();
  }
  if (type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || name.endsWith('.docx')) {
    const result = await mammoth.extractRawText({ buffer });
    return (result.value || '').trim();
  }
  if (type === 'text/plain' || name.endsWith('.txt')) {
    return buffer.toString('utf-8').trim();
  }
  throw new Error('Use PDF, DOCX, or TXT.');
}

export async function POST(req: Request) {
  try {
    const userId = await getAuthUserId();
    if (!userId) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    if (!file?.size) return NextResponse.json({ error: 'Resume file is required' }, { status: 400 });

    const text = await extractText(file);
    return NextResponse.json({ text });
  } catch (err) {
    console.error('Resume extract error:', err);
    const msg = err instanceof Error ? err.message : 'Failed to extract text';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
