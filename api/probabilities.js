export default async function handler(req, res) {
  try {
    const standingsRes = await fetch('https://api.football-data.org/v4/competitions/PL/standings', {
      headers: { 'X-Auth-Token': process.env.FOOTBALL_API_KEY }
    });
    const standingsData = await standingsRes.json();
    const table = standingsData.standings.find(s => s.type === 'TOTAL').table;

    const tableSummary = table.map(row =>
      `${row.position}. ${row.team.name} — ${row.playedGames} played, ${row.points}pts, GD ${row.goalDifference}`
    ).join('\n');

    const gamesTotal = 38;
    const today = new Date().toISOString().split('T')[0];

    const prompt = `You are a football analyst estimating title race, Champions League qualification, and relegation probabilities for the English Premier League. Today's date is ${today}. The season has ${gamesTotal} games per team in total.

Current table:
${tableSummary}

Before estimating, search the web for the latest news relevant to the title race, top-4 race, and relegation battle: team form, injuries, run-in fixture difficulty, and anything else that would meaningfully shift these odds beyond the raw points.

For each team, estimate the realistic probability (0-100, can include decimals) of:
- "title": finishing 1st
- "cl": finishing in the top 4 (Champions League qualification)
- "relegation": finishing in the bottom 3 (relegation)

Make sure the probabilities are realistic given how many games remain, and that they are internally consistent (e.g. title probabilities across all teams should sum to roughly 100).

Respond with ONLY a JSON object, no surrounding text, in exactly this format:
{"probabilities": [{"team": "team name", "title": 0, "cl": 0, "relegation": 0}]}`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-5',
        max_tokens: 4096,
        tools: [{ type: 'web_search_20250305', name: 'web_search' }],
        messages: [{ role: 'user', content: prompt }]
      })
    });

    const data = await response.json();
    const textBlocks = data.content.filter(block => block.type === 'text');
    const text = textBlocks[textBlocks.length - 1].text;
    const clean = text.replace(/```json|```/g, '').trim();
    const probabilities = JSON.parse(clean);

    res.setHeader('Cache-Control', 's-maxage=21600, stale-while-revalidate');
    res.status(200).json(probabilities);
  } catch (err) {
    res.status(500).json({ error: 'Could not get probabilities', details: err.message });
  }
}
