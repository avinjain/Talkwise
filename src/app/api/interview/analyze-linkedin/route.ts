import { NextResponse } from 'next/server';
import { getAuthUserId } from '@/lib/session';
import { checkRateLimit } from '@/lib/ratelimit';
import { logUsage } from '@/lib/db';
import { estimateCost } from '@/lib/costs';
import { getOpenAI } from '@/lib/openai';

export const runtime = 'nodejs';

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
  if (!apiKey) throw new Error('LinkedIn fetch not configured. Add PROXYCURL_API_KEY to fetch profiles by URL.');

  const res = await fetch(
    `https://nubela.co/proxycurl/api/v2/linkedin?url=${encodeURIComponent(url)}`,
    {
      headers: { Authorization: `Bearer ${apiKey}` },
      signal: AbortSignal.timeout(30000),
    }
  );
  if (!res.ok) {
    const err = await res.text();
    throw new Error(res.status === 429 ? 'Rate limit reached. Try again later.' : err || 'Failed to fetch profile');
  }
  const profile = (await res.json()) as Record<string, unknown>;
  return profileToText(profile);
}

export async function POST(req: Request) {
  try {
    const userId = await getAuthUserId();
    if (!userId) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

    const rateCheck = checkRateLimit(userId);
    if (!rateCheck.allowed) {
      return NextResponse.json({ error: rateCheck.reason }, { status: 429 });
    }

    const { linkedInUrl, linkedIn, role, jd } = (await req.json()) as {
      linkedInUrl?: string;
      linkedIn?: string;
      role?: string;
      jd?: string;
    };

    let profileContent: string;
    if (linkedIn?.trim()) {
      profileContent = linkedIn.trim();
    } else {
      const url = parseLinkedInUrl(linkedInUrl || '');
      if (!url) return NextResponse.json({ error: 'LinkedIn URL or profile content is required' }, { status: 400 });
      profileContent = await fetchLinkedInProfile(url);
    }

    const prompt = `You are an expert interview coach (aligned with interview-coach-skill framework). Analyze this LinkedIn profile and provide optimization suggestions${role ? ` for a ${role} role` : ''}${jd ? '. Use the job description to assess fit.' : ''}

LINKEDIN PROFILE:
---
${profileContent.slice(0, 6000)}
---
${jd ? `\nJOB DESCRIPTION:\n---\n${jd.slice(0, 4000)}\n---` : ''}

Provide a concise optimization analysis (plain text, no markdown) with:
1. **Profile strengths** — What stands out or differentiates this candidate (headline, about, experience)
2. **Coherence** — How well does the profile tell a consistent story? Any gaps or inconsistencies?
3. **Positioning** — How clearly does the profile convey value and expertise for${role ? ` a ${role}` : ' the target'} role?
4. **Optimization suggestions** — 3–5 specific, actionable tweaks to make the profile stronger${jd ? ' given the job description' : ''}

Keep it actionable and under 500 words.`;

    const model = process.env.GPT_MODEL || 'gpt-4o';
    const response = await getOpenAI().chat.completions.create({
      model,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.5,
      max_tokens: 800,
    });

    const text = response.choices[0]?.message?.content || 'No analysis generated.';
    const usage = response.usage;
    const promptTokens = usage?.prompt_tokens || 0;
    const completionTokens = usage?.completion_tokens || 0;

    try {
      logUsage({
        userId,
        endpoint: '/api/interview/analyze-linkedin',
        model,
        promptTokens,
        completionTokens,
        totalTokens: promptTokens + completionTokens,
        estimatedCost: estimateCost(model, promptTokens, completionTokens),
      });
    } catch {}

    return NextResponse.json({ analysis: text, profileContent });
  } catch (err) {
    console.error('LinkedIn analysis error:', err);
    const msg = err instanceof Error ? err.message : 'Failed to analyze LinkedIn';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
