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

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
  'text/plain',
];

function parseLinkedInUrl(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  try {
    const url = new URL(trimmed.startsWith('http') ? trimmed : `https://${trimmed}`);
    if (url.hostname.includes('linkedin.com') && url.pathname.includes('/in/')) return url.href;
  } catch {}
  return null;
}

function profileToText(profile: Record<string, unknown>): string {
  const parts: string[] = [];
  if (profile.full_name) parts.push(`Name: ${profile.full_name}`);
  if (profile.headline) parts.push(`Headline: ${profile.headline}`);
  if (profile.summary) parts.push(`About:\n${profile.summary}`);
  if (profile.occupation) parts.push(`Occupation: ${profile.occupation}`);
  if (Array.isArray(profile.experiences) && profile.experiences.length > 0) {
    parts.push('Experience:');
    for (const exp of profile.experiences.slice(0, 10) as Record<string, unknown>[]) {
      const title = exp.title || '';
      const companyRaw = exp.company ?? exp.company_linkedin_profile_name;
      const company = typeof companyRaw === 'object' && companyRaw && typeof (companyRaw as Record<string, unknown>).name === 'string'
        ? (companyRaw as Record<string, unknown>).name
        : String(companyRaw || '');
      const desc = exp.description ? `\n  ${exp.description}` : '';
      parts.push(`- ${title} at ${company}${desc}`);
    }
  }
  if (Array.isArray(profile.education) && profile.education.length > 0) {
    parts.push('Education:');
    for (const ed of profile.education.slice(0, 5) as Record<string, unknown>[]) {
      const schoolRaw = ed.school ?? ed.school_linkedin_profile_name;
      const school = typeof schoolRaw === 'object' && schoolRaw && typeof (schoolRaw as Record<string, unknown>).name === 'string'
        ? (schoolRaw as Record<string, unknown>).name
        : String(schoolRaw || '');
      const degree = ed.degree_name || '';
      const field = ed.field_of_study || '';
      parts.push(`- ${degree} ${field} @ ${school}`);
    }
  }
  if (profile.country || profile.city) parts.push(`Location: ${[profile.city, profile.country].filter(Boolean).join(', ')}`);
  return parts.join('\n\n');
}

async function fetchLinkedInProfile(url: string): Promise<string> {
  const apiKey = process.env.PROXYCURL_API_KEY;
  if (!apiKey) throw new Error('Add PROXYCURL_API_KEY to fetch LinkedIn profiles by URL.');

  const res = await fetch(
    `https://nubela.co/proxycurl/api/v2/linkedin?url=${encodeURIComponent(url)}`,
    {
      headers: { Authorization: `Bearer ${apiKey}` },
      signal: AbortSignal.timeout(30000),
    }
  );
  if (!res.ok) throw new Error(res.status === 429 ? 'LinkedIn rate limit. Try again later.' : 'Failed to fetch profile');
  const profile = (await res.json()) as Record<string, unknown>;
  return profileToText(profile);
}

async function extractResumeText(file: File): Promise<string> {
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
  throw new Error('Unsupported format. Use PDF, DOCX, or TXT.');
}

export async function POST(req: Request) {
  try {
    const userId = await getAuthUserId();
    if (!userId) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

    const rateCheck = checkRateLimit(userId);
    if (!rateCheck.allowed) return NextResponse.json({ error: rateCheck.reason }, { status: 429 });

    const contentType = req.headers.get('content-type') || '';
    let resumeContent = '';
    let profileContent = '';
    let role = '';
    let jd = '';

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      role = (formData.get('role') as string) || '';
      jd = (formData.get('jd') as string) || '';
      const resumePaste = (formData.get('resume') as string) || '';
      const linkedInUrl = (formData.get('linkedInUrl') as string) || '';
      const linkedInPaste = (formData.get('linkedIn') as string) || '';

      const resumeFile = formData.get('resumeFile') as File | null;
      if (resumeFile?.size) {
        resumeContent = await extractResumeText(resumeFile);
      } else if (resumePaste?.trim()) {
        resumeContent = resumePaste.trim();
      }

      if (linkedInPaste?.trim()) {
        profileContent = linkedInPaste.trim();
      } else {
        const url = parseLinkedInUrl(linkedInUrl || '');
        if (url) profileContent = await fetchLinkedInProfile(url);
      }
    } else {
      const body = await req.json();
      role = body.role || '';
      jd = body.jd || '';
      resumeContent = (body.resume || '').trim();
      if (body.linkedIn?.trim()) profileContent = body.linkedIn.trim();
      else {
        const url = parseLinkedInUrl(body.linkedInUrl || '');
        if (url) profileContent = await fetchLinkedInProfile(url);
      }
    }

    if (!resumeContent && !profileContent) {
      return NextResponse.json({ error: 'Provide at least a resume (file or paste) or LinkedIn profile (URL or paste)' }, { status: 400 });
    }

    const prompt = `You are an expert career coach and LinkedIn profile optimizer. A candidate has shared their resume and/or LinkedIn profile. When both are provided, compare them; when only one is provided, use it to suggest how to build or improve their LinkedIn profile. Provide specific recommendations on how to improve their LinkedIn profile.

${resumeContent ? `RESUME:
---
${resumeContent.slice(0, 6000)}
---` : ''}
${profileContent ? `
LINKEDIN PROFILE:
---
${profileContent.slice(0, 6000)}
---` : ''}
${role ? `\nTarget role: ${role}` : ''}
${jd ? `\nJob description (use for fit):\n---\n${jd.slice(0, 3000)}\n---` : ''}

Provide a detailed, actionable analysis (plain text, no markdown) with:

1. **Alignment gap** — What’s on the resume but missing or weak on LinkedIn? What should be added or emphasized?
2. **Headline & About** — Specific suggestions to make the headline and About section stronger, drawing from resume strengths.
3. **Experience section** — Gaps, missing achievements, or better ways to phrase roles. Reference resume for specifics.
4. **Keywords & positioning** — What keywords or themes from the resume should appear on LinkedIn${role ? ` for this role` : ''}?
5. **5–7 concrete action items** — Specific, copy-paste-ready or very clear edits to improve the profile.

Keep it actionable and under 600 words.`;

    const model = process.env.GPT_MODEL || 'gpt-4o';
    const response = await getOpenAI().chat.completions.create({
      model,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.5,
      max_tokens: 1000,
    });

    const text = response.choices[0]?.message?.content || 'No analysis generated.';
    const usage = response.usage;
    const promptTokens = usage?.prompt_tokens || 0;
    const completionTokens = usage?.completion_tokens || 0;
    try {
      logUsage({
        userId,
        endpoint: '/api/interview/analyze-profile',
        model,
        promptTokens,
        completionTokens,
        totalTokens: promptTokens + completionTokens,
        estimatedCost: estimateCost(model, promptTokens, completionTokens),
      });
    } catch {}

    return NextResponse.json({
      analysis: text,
      resumeContent: resumeContent || undefined,
      profileContent: profileContent || undefined,
    });
  } catch (err) {
    console.error('Profile analysis error:', err);
    const msg = err instanceof Error ? err.message : 'Failed to analyze profile';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
