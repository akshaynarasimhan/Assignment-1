import axios from 'axios';

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-sonnet-4-20250514';

const SYSTEM_PROMPT = `You are a territory intelligence assistant for Gartner. You receive rule engine output and a user query. Return ONLY valid JSON matching this exact schema — no preamble, no markdown:
{
  "view_title": "string",
  "narrative": "string",
  "tag": "llm" | "hybrid",
  "columns": [{ "field": "string", "headerName": "string", "width": number }],
  "row_filter": { "field": "string", "operator": "string", "value": "any" } | null,
  "sort": { "field": "string", "direction": "asc" | "desc" } | null,
  "highlight_field": "string" | null
}`;

/**
 * @param {string} userPrompt
 * @param {object} ruleOutput - output from runRules()
 * @param {object} datasetSummary - summary stats from buildDatasetSummary()
 * @returns {object|null} parsed JSON grid spec or null on failure
 */
export async function generateGridSpec(userPrompt, ruleOutput, datasetSummary) {
  const apiKey = process.env.REACT_APP_ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error('[LLM] No API key configured. Set REACT_APP_ANTHROPIC_API_KEY in .env');
    return getMockGridSpec(userPrompt, ruleOutput);
  }

  const contextBlock = `
RULE ENGINE OUTPUT:
${JSON.stringify(
  {
    flags: ruleOutput.flags,
    rankedAEs: ruleOutput.rankedAEs?.map((ae) => ({
      aeName: ae.aeName,
      cv: ae.cv,
      compositeScore: ae.compositeScore,
      availableCapacity: ae.availableCapacity,
    })),
    eligibleForGrowth: ruleOutput.eligibleForGrowth?.map((ae) => ae.aeName),
    eligibleForCollapse: ruleOutput.eligibleForCollapse?.map((ae) => ae.aeName),
    ruleLog: ruleOutput.ruleLog?.slice(-10),
  },
  null,
  2
)}

DATASET SUMMARY:
${JSON.stringify(datasetSummary, null, 2)}

USER QUERY: ${userPrompt}
`.trim();

  try {
    const response = await axios.post(
      ANTHROPIC_API_URL,
      {
        model: MODEL,
        max_tokens: 1024,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: contextBlock }],
      },
      {
        headers: {
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
        },
      }
    );

    const rawText = response.data?.content?.[0]?.text ?? '';
    try {
      return JSON.parse(rawText);
    } catch (parseErr) {
      console.error('[LLM] JSON parse failure. Raw response:', rawText);
      return null;
    }
  } catch (err) {
    console.error('[LLM] API call failed:', err.response?.data ?? err.message);
    return getMockGridSpec(userPrompt, ruleOutput);
  }
}

/**
 * Fallback mock grid spec when API key is missing or call fails.
 */
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
