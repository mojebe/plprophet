export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Only POST allowed' });
  }
  try {
    const { matches } = req.body;
    const matchList = matches.map(m =>
      `${m.home} (position ${m.homePos}, ${m.homePts}pts, GD ${m.homeGd}) vs ${m.away} (position ${m.awayPos}, ${m.awayPts}pts, GD ${m.awayGd})`
    ).join('\n');

    const prompt = `You are a football analyst predicting realistic scorelines in the English Premier League. Base your predictions on the table stats below and your knowledge of the teams' typical strength, style, and squad quality.

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
        max_tokens: 1024,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    const data = await response.json();
    const textBlock = data.content.find(block => block.type === 'text');
    if (!textBlock) {
      return res.status(500).json({ error: 'No text response from Claude', raw: data });
    }
    const clean = textBlock.text.replace(/```json|```/g, '').trim();
    const predictions = JSON.parse(clean);

    res.status(200).json(predictions);
  } catch (err) {
    res.status(500).json({ error: 'Could not get predictions', details: err.message });
  }
}
