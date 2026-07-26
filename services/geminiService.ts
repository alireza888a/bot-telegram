export async function generateBroadcastMessage(prompt: string): Promise<string> {
  const licenseCacheStr = localStorage.getItem('license_cache') || '{}';
  let code = '';
  try { code = JSON.parse(licenseCacheStr).code || ''; } catch {}

  const res = await fetch('https://corepanel-api.tajikr450.workers.dev/api/ai/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, prompt })
  });
  const result = await res.json();
  if (!result.ok) {
    throw new Error(result.reason || 'AI generation failed');
  }
  return result.text;
}

export async function suggestButtonLabels(postContent: string): Promise<string[]> {
  try {
    const licenseCacheStr = localStorage.getItem('license_cache') || '{}';
    let code = '';
    try { code = JSON.parse(licenseCacheStr).code || ''; } catch {}

    const prompt = `Based on the following Telegram post content (in Persian), suggest 4 short, catchy labels for inline buttons (e.g., "Buy Now", "Join Channel", "Read More"). Return ONLY a JSON array of strings like ["label1", "label2", "label3", "label4"]. Post Content: "${postContent.substring(0, 500)}"`;

    const res = await fetch('https://corepanel-api.tajikr450.workers.dev/api/ai/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, prompt })
    });
    const result = await res.json();
    if (!result.ok) {
      throw new Error(result.reason || 'AI generation failed');
    }
    const text = result.text || '';
    const jsonMatch = text.match(/\[.*\]/s);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return JSON.parse(text);
  } catch (error) {
    console.error("AI Error:", error);
    return ["لینک", "تایید", "عضویت"];
  }
}

