import axios from 'axios';

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
const MODEL = 'gpt-4o';

const GRID_SPEC_SYSTEM_PROMPT = `You are a territory intelligence assistant for Gartner. You receive rule engine output and a user query. Return ONLY valid JSON matching this exact schema — no preamble, no markdown:
{
  "view_title": "string",
  "narrative": "string",
  "tag": "llm" | "hybrid",
  "columns": [{ "field": "string", "headerName": "string", "width": number }],
  "row_filter": { "field": "string", "operator": "string", "value": "any" } | null,
  "sort": { "field": "string", "direction": "asc" | "desc" } | null,
  "highlight_field": "string" | null
}`;

const ASSIGNMENT_SYSTEM_PROMPT = `You are a territory rebalancing assistant for Gartner. The user will describe account assignment changes in natural language.
Extract their intent and return ONLY valid JSON — no preamble, no markdown:
{
  "intent": "assign" | "unassign" | "query" | "unknown",
  "actions": [
    {
      "company": "string — company name mentioned, or null",
      "toAE": "string — target AE name mentioned, or null",
      "fromAE": "string — source AE name mentioned, or null"
    }
  ],
  "narrative": "string — short confirmation or clarification message to show the user",
  "tag": "llm" | "hybrid"
}
If the user is asking a question rather than giving instructions, set intent to "query" and answer in narrative.`;

/**
 * Generate a grid spec (used at Step 3 load and general chat)
 */
export async function generateGridSpec(userPrompt, ruleOutput, datasetSummary) {
  const apiKey = process.env.REACT_APP_OPENAI_API_KEY;
  if (!apiKey) {
    console.warn('[LLM] No API key — using mock spec.');
    return getMockGridSpec(userPrompt, ruleOutput);
  }

  const contextBlock = buildContext(userPrompt, ruleOutput, datasetSummary);

  try {
    const response = await axios.post(
      OPENAI_API_URL,
      {
        model: MODEL,
        max_tokens: 1024,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: GRID_SPEC_SYSTEM_PROMPT },
          { role: 'user', content: contextBlock },
        ],
      },
      { headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' } }
    );
    const rawText = response.data?.choices?.[0]?.message?.content ?? '';
    try { return JSON.parse(rawText); } catch { return null; }
  } catch (err) {
    console.error('[LLM] generateGridSpec failed:', err.response?.data ?? err.message);
    return getMockGridSpec(userPrompt, ruleOutput);
  }
}

/**
 * Parse natural language assignment instructions.
 * Returns { intent, actions, narrative, tag } or null on failure.
 */
export async function parseAssignmentIntent(userPrompt, aeData, accounts) {
  const apiKey = process.env.REACT_APP_OPENAI_API_KEY;

  const context = `
AVAILABLE AEs: ${aeData.map((ae) => `${ae.aeName} (id: ${ae.id})`).join(', ')}
AVAILABLE ACCOUNTS: ${accounts.map((a) => `${a.company} (id: ${a.id})`).join(', ')}
USER INSTRUCTION: ${userPrompt}
`.trim();

  if (!apiKey) {
    return getMockAssignmentIntent(userPrompt, aeData, accounts);
  }

  try {
    const response = await axios.post(
      OPENAI_API_URL,
      {
        model: MODEL,
        max_tokens: 512,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: ASSIGNMENT_SYSTEM_PROMPT },
          { role: 'user', content: context },
        ],
      },
      { headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' } }
    );
    const rawText = response.data?.choices?.[0]?.message?.content ?? '';
    try { return JSON.parse(rawText); } catch { return null; }
  } catch (err) {
    console.error('[LLM] parseAssignmentIntent failed:', err.response?.data ?? err.message);
    return getMockAssignmentIntent(userPrompt, aeData, accounts);
  }
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function buildContext(userPrompt, ruleOutput, datasetSummary) {
  return `
RULE ENGINE OUTPUT:
${JSON.stringify({
  flags: ruleOutput.flags,
  rankedAEs: ruleOutput.rankedAEs?.map((ae) => ({ aeName: ae.aeName, cv: ae.cv, compositeScore: ae.compositeScore, availableCapacity: ae.availableCapacity })),
  eligibleForGrowth: ruleOutput.eligibleForGrowth?.map((ae) => ae.aeName),
  eligibleForCollapse: ruleOutput.eligibleForCollapse?.map((ae) => ae.aeName),
  ruleLog: ruleOutput.ruleLog?.slice(-10),
}, null, 2)}

DATASET SUMMARY:
${JSON.stringify(datasetSummary, null, 2)}

USER QUERY: ${userPrompt}
`.trim();
}

function getMockGridSpec(userPrompt, ruleOutput) {
  const hasGrowth = ruleOutput?.eligibleForGrowth?.length > 0;
  const topAE = ruleOutput?.rankedAEs?.[0]?.aeName ?? 'top AE';
  return {
    view_title: 'Territory Intelligence View',
    narrative: `Based on rule engine analysis, ${ruleOutput?.eligibleForGrowth?.length ?? 0} AE(s) are eligible for growth rebalancing. ${ruleOutput?.flags?.cv_breach ? `CV threshold breached by ${ruleOutput.flags.breach_pct}% of the team.` : 'No CV threshold breaches detected.'} Top ranked AE by proxy score: ${topAE}. ${hasGrowth ? 'Recommend prioritising growth accounts for eligible AEs.' : 'Consider collapse rebalancing to free up capacity.'}`,
    tag: 'hybrid',
    columns: [
      { field: 'aeName', headerName: 'AE Name', width: 160 },
      { field: 'cv', headerName: 'CV', width: 100 },
      { field: 'availableCapacity', headerName: 'Available Capacity', width: 140 },
      { field: 'proxyGraded', headerName: 'Proxy Graded', width: 120 },
    ],
    row_filter: null,
    sort: { field: 'proxyGraded', direction: 'desc' },
    highlight_field: 'availableCapacity',
  };
}

function getMockAssignmentIntent(userPrompt, aeData, accounts) {
  const lower = userPrompt.toLowerCase();
  // Simple keyword matching for fallback
  const matchedAE = aeData.find((ae) => lower.includes(ae.aeName.toLowerCase().split(' ')[0].toLowerCase()));
  const matchedAccount = accounts.find((a) => lower.includes(a.company.toLowerCase().split(' ')[0].toLowerCase()));

  if ((lower.includes('assign') || lower.includes('move') || lower.includes('give')) && matchedAE && matchedAccount) {
    return {
      intent: 'assign',
      actions: [{ company: matchedAccount.company, toAE: matchedAE.aeName, fromAE: null }],
      narrative: `Understood. Assigning **${matchedAccount.company}** to **${matchedAE.aeName}**. Metrics updating live.`,
      tag: 'hybrid',
    };
  }
  if (lower.includes('remove') || lower.includes('unassign') || lower.includes('reverse')) {
    return {
      intent: 'unassign',
      actions: [{ company: matchedAccount?.company ?? null, toAE: null, fromAE: null }],
      narrative: `Understood. Reversing the assignment${matchedAccount ? ` of **${matchedAccount.company}**` : ''}. Metrics restored.`,
      tag: 'rule',
    };
  }
  return {
    intent: 'query',
    actions: [],
    narrative: `I can help you assign accounts. Try saying something like: *"Assign Nexgen Systems to Quinn Patel"* or *"Move Arcturus to Taylor Singh"*.`,
    tag: 'llm',
  };
}
