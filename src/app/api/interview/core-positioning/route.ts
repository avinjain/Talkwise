import { NextResponse } from 'next/server';
import { getAuthUserId } from '@/lib/session';
import { checkRateLimit } from '@/lib/ratelimit';
import { logUsage } from '@/lib/db';
import { estimateCost } from '@/lib/costs';
import { getOpenAI } from '@/lib/openai';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParse = require('pdf-parse-new');
import mammoth from 'mammoth';

export const runtime = 'nodejs';

const MAX_FILE_SIZE = 5 * 1024 * 1024;

async function extractResumeText(file: File): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer());
  if (buffer.length > MAX_FILE_SIZE) throw new Error('File too large.');
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

    const rateCheck = checkRateLimit(userId);
    if (!rateCheck.allowed) return NextResponse.json({ error: rateCheck.reason }, { status: 429 });

    let resumeText = '';
    let role = '';
    let jd = '';

    const contentType = req.headers.get('content-type') || '';
    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      role = (formData.get('role') as string) || '';
      jd = (formData.get('jd') as string) || '';
      const file = formData.get('resumeFile') as File | null;
      const paste = (formData.get('resume') as string) || '';
      if (file?.size) resumeText = await extractResumeText(file);
      else if (paste?.trim()) resumeText = paste.trim();
    } else {
      const body = await req.json();
      resumeText = (body.resume || '').trim();
      role = body.role || '';
      jd = body.jd || '';
    }

    if (!resumeText) return NextResponse.json({ error: 'Resume is required' }, { status: 400 });

    const prompt = `You are an expert interview coach (aligned with interview-coach-skill framework). Create core positioning and multiple pitch variations for interview speaking points based on this resume.

RESUME:
---
${resumeText.slice(0, 6000)}
---
${role ? `\nTarget role: ${role}` : ''}
${jd ? `\nJob description:\n---\n${jd.slice(0, 3500)}\n---` : ''}

Generate interview speaking points as a JSON object with this exact structure (no markdown, no code fences):
{
  "pitches": [
    {
      "name": "Tell Me About Yourself (30-sec)",
      "hook": "Opening 1-2 sentence hook",
      "bullets": ["Bullet 1", "Bullet 2", "Bullet 3"]
    },
    {
      "name": "Leadership & Impact",
      "hook": "Short positioning line",
      "bullets": ["Key point 1", "Key point 2", "Key point 3"]
    },
    {
      "name": "Technical / Problem-solving",
      "hook": "Short positioning line",
      "bullets": ["Key point 1", "Key point 2"]
    },
    {
      "name": "Why This Role",
      "hook": "Short positioning line",
      "bullets": ["Fit point 1", "Fit point 2"]
    }
  ]
}

Create 4-5 pitch variations. Each should have 2-4 concise bullets the candidate can use as speaking points. Tailor to the role and JD when provided. Be specific—reference actual experiences from the resume.`;

    const model = process.env.GPT_MODEL || 'gpt-4o';
    const response = await getOpenAI().chat.completions.create({
      model,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.5,
      max_tokens: 1200,
    });

    const text = response.choices[0]?.message?.content?.trim() || '{}';
    let parsed: { pitches?: Array<{ name: string; hook?: string; bullets?: string[] }> } = {};
    try {
      const clean = text.replace(/```json?\s*/g, '').replace(/```\s*$/g, '').trim();
      parsed = JSON.parse(clean);
    } catch {
      parsed = { pitches: [] };
    }
    const pitches = Array.isArray(parsed.pitches) ? parsed.pitches : [];

    const usage = response.usage;
    const promptTokens = usage?.prompt_tokens || 0;
    const completionTokens = usage?.completion_tokens || 0;
    try {
      logUsage({
        userId,
        endpoint: '/api/interview/core-positioning',
        model,
        promptTokens,
        completionTokens,
        totalTokens: promptTokens + completionTokens,
        estimatedCost: estimateCost(model, promptTokens, completionTokens),
      });
    } catch {}

    return NextResponse.json({ pitches });
  } catch (err) {
    console.error('Core positioning error:', err);
    const msg = err instanceof Error ? err.message : 'Failed to generate pitches';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
