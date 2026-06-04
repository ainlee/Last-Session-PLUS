/**
 * AI Service Layer
 * Handles communication with OpenAI-compatible AI providers for tab optimization.
 */

/**
 * Optimizes a list of tabs using a custom AI configuration.
 * @param {Array} tabs - List of tabs { id, title, url }
 * @param {Object} aiConfig - AI configuration { baseUrl, apiKey, model }
 * @returns {Promise<Object>} - Structured optimization suggestions
 */
export async function optimizeTabs(tabs, aiConfig) {
  if (!aiConfig || !aiConfig.baseUrl || !aiConfig.apiKey || !aiConfig.model) {
    throw new Error('AI configuration is incomplete. baseUrl, apiKey, and model are required.');
  }

  // Ensure baseUrl doesn't have a trailing slash before appending the endpoint
  const baseUrl = aiConfig.baseUrl.replace(/\/+$/, '');
  const endpoint = `${baseUrl}/chat/completions`;

  const prompt = `
You are a browser tab organization expert. I will provide a list of open tabs (title and URL). 
Your task is to analyze them and return a JSON object that optimizes the tab layout.

Tasks:
1. Deduplication: Identify tabs that are highly redundant or duplicates of the same content.
2. Semantic Grouping: Group tabs into logical categories (e.g., "Work", "Shopping", "Entertainment", "Research").
3. Sorting: Order the tabs within each group and the groups themselves by logical importance.

Input Tabs:
${tabs.map((t, i) => `[${i}] ${t.title} (${t.url})`).join('\n')}

Output Format (Strict JSON):
{
  "groups": [
    {
      "name": "Group Name",
      "tabIndices": [0, 2, 5], // Indices of tabs in this group, sorted by priority
      "reason": "Brief explanation for this group"
    }
  ],
  "duplicates": [
    {
      "keepIndex": 0,
      "removeIndices": [1, 4],
      "reason": "These are duplicate pages of the same content"
    }
  ],
  "unclassified": [3, 7] // Indices of tabs that didn't fit any group
}

Return ONLY the JSON object. No markdown formatting, no preamble.
`;

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${aiConfig.apiKey}`,
      },
      body: JSON.stringify({
        model: aiConfig.model,
        messages: [
          { role: 'system', content: 'You are a helpful assistant that outputs only valid JSON.' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.3,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `AI API Error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    return JSON.parse(content);
  } catch (error) {
    console.error('AI Optimization Error:', error);
    throw error;
  }
}
