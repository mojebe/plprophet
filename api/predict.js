export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Only POST allowed' });
  }
  try {
    const { matches } = req.body;
    const matchList = matches.map(m =>
      `${m.home} (position ${m.homePos}, ${m.homePts}pts, GD ${m.homeGd}) vs ${m.away} (position ${m.awayPos}, ${m.awayPts}pts, GD ${m.awayGd})`
    ).join('\n');

    const today = new Date().toISOString().split('T')[0];

    const prompt = `You are a football analyst predicting realistic scorelines in the English Premier League. Today's date is ${today}.

Before predicting, search the web for the latest news on the teams below: current form (last 5 games), injuries or suspensions, and head-to-head history. Use this together with the table stats provided.

Matches to predict:
${matchList}

Respond with ONLY a JSON object, no surrounding text, in exactly this format:
{"predictions": [{"home": "team name", "away": "team name", "homeScore": 0, "awayScore": 0}]}`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-5',
        max_tokens: 2048,
        tools: [{ type: 'web_search_20250305', name: 'web_search' }],
        messages: [{ role: 'user', content: prompt }]
      })
    });

    const data = await response.json();
    const textBlocks = data.content.filter(block => block.type === 'text');
    const text = textBlocks[textBlocks.length - 1].text;
    const clean = text.replace(/```json|```/g, '').trim();
    const predictions = JSON.parse(clean);

    res.status(200).json(predictions);
  } catch (err) {
    res.status(500).json({ error: 'Could not get predictions', details: err.message });
  }
}
