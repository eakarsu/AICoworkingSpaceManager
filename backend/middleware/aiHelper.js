/**
 * Shared OpenRouter helper for AICoworkingSpaceManager.
 * - DEFAULT_MODEL = anthropic/claude-3-5-sonnet-20241022
 * - 3-strategy parseAIJson
 * - retry on 5xx/429
 * - saveAIResult writes to ai_results JSONB table (auto-created)
 */
const axios = require('axios');

const DEFAULT_MODEL = 'anthropic/claude-3-5-sonnet-20241022';

async function callOpenRouter(systemPrompt, userMessage, opts = {}) {
  const {
    temperature = 0.4,
    maxTokens = 2500,
    model = process.env.OPENROUTER_MODEL || DEFAULT_MODEL,
  } = opts;
  const url = (process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1') + '/chat/completions';
  const payload = {
    model,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage }
    ],
    temperature,
    max_tokens: maxTokens
  };
  const headers = {
    'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
    'Content-Type': 'application/json',
    'HTTP-Referer': process.env.FRONTEND_URL || 'http://localhost:5173',
    'X-Title': 'AI Coworking Space Manager'
  };

  let lastErr;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const r = await axios.post(url, payload, { headers, timeout: 90000 });
      return {
        content: r.data.choices?.[0]?.message?.content || '',
        model: r.data.model,
        usage: r.data.usage,
        raw: r.data
      };
    } catch (err) {
      lastErr = err;
      const status = err.response?.status;
      if (status && status < 500 && status !== 429) break;
      await new Promise(res => setTimeout(res, 800 * (attempt + 1)));
    }
  }
  throw lastErr;
}

function parseAIJson(text) {
  if (!text || typeof text !== 'string') return null;
  const trimmed = text.trim();
  try { return JSON.parse(trimmed); } catch (_) {}
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced) { try { return JSON.parse(fenced[1].trim()); } catch (_) {} }
  const f = trimmed.indexOf('{'); const l = trimmed.lastIndexOf('}');
  if (f !== -1 && l > f) { try { return JSON.parse(trimmed.slice(f, l + 1)); } catch (_) {} }
  return null;
}

async function saveAIResult(pool, { feature, user_id, input, output, model, usage }) {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS ai_results (
        id SERIAL PRIMARY KEY,
        feature VARCHAR(100) NOT NULL,
        user_id INTEGER,
        input JSONB,
        output JSONB,
        model VARCHAR(255),
        usage JSONB,
        created_at TIMESTAMP DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_ai_results_feature ON ai_results(feature);
      CREATE INDEX IF NOT EXISTS idx_ai_results_user ON ai_results(user_id);
    `);
    const r = await pool.query(
      `INSERT INTO ai_results (feature, user_id, input, output, model, usage)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING id`,
      [feature, user_id || null,
       input ? JSON.stringify(input) : null,
       output ? JSON.stringify(output) : null,
       model || null,
       usage ? JSON.stringify(usage) : null]
    );
    return r.rows[0].id;
  } catch (err) {
    console.error('saveAIResult failed:', err.message);
    return null;
  }
}

module.exports = { callOpenRouter, parseAIJson, saveAIResult, DEFAULT_MODEL };
