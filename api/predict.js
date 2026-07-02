export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Only POST allowed' });
  }

  try {
    const { matches } = req.body;

    const matchList = matches.map(m =>
      `${m.home} (plats ${m.homePos}, ${m.homePts}p, målskillnad ${m.homeGd}) vs ${m.away} (plats ${m.awayPos}, ${m.awayPts}p, målskillnad ${m.awayGd})`
    ).join('\n');

    const prompt = `Du är en fotbollsexpert som ska förutspå realistiska resultat i engelska Premier League. Basera dig på lagens tabellplacering, poäng och målskillnad nedan, samt din kunskap om lagens aktuella form, spelartrupp, skador och inbördes möten.

Matcher att förutspå:
${matchList}

Svara ENDAST med ett JSON-objekt, ingen text runtomkring, i exakt detta format:
{"predictions": [{"home": "lagnamn", "away": "lagnamn", "homeScore": 0, "awayScore": 0}]}`;

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
    return res.status(200).json({ debug: data });
    const clean = text.replace(/```json|```/g, '').trim();
    const predictions = JSON.parse(clean);

    res.status(200).json(predictions);
  } catch (err) {
    res.status(500).json({ error: 'Kunde inte hämta förutsägelser', details: err.message });
  }
}
