const Anthropic = require('@anthropic-ai/sdk');
const { SYSTEM_PROMPT } = require('./systemPrompt');

const MODEL = process.env.CLAUDE_MODEL || 'claude-sonnet-4-5-20250929';

let client;
function getClient() {
  if (!client) {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY is not set');
    }
    client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return client;
}

// Strips markdown code fences if Claude wraps the JSON despite instructions not to.
function extractJson(text) {
  const trimmed = text.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1] : trimmed;
  const start = candidate.indexOf('{');
  const end = candidate.lastIndexOf('}');
  if (start === -1 || end === -1) {
    throw new Error('Could not find a JSON object in the Claude response');
  }
  return JSON.parse(candidate.slice(start, end + 1));
}

async function tailorResume({ jobUrl, jobTitle, company, jobDescription }) {
  const anthropic = getClient();

  const userMessage = `Tailor the master resume for the following job.

Job Title: ${jobTitle}
Company: ${company}
Job URL: ${jobUrl || 'N/A'}

Job Description:
${jobDescription}

Return only the JSON object described in the system prompt.`;

  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 4096,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: userMessage }],
  });

  const textBlock = response.content.find((block) => block.type === 'text');
  if (!textBlock) {
    throw new Error('Claude response did not contain a text block');
  }

  const parsed = extractJson(textBlock.text);
  if (!parsed.resume || !Array.isArray(parsed.tailoring_notes)) {
    throw new Error('Claude response JSON is missing "resume" or "tailoring_notes"');
  }

  return {
    resume: parsed.resume,
    tailoringNotes: parsed.tailoring_notes,
  };
}

module.exports = { tailorResume };
