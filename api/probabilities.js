export default async function handler(req, res) {
  try {
    let table;
    let isSimulated = false;

    if (req.method === 'POST' && req.body && req.body.table) {
      table = req.body.table;
      isSimulated = true;
    } else {
      const standingsRes = await fetch('https://api.football-data.org/v4/competitions/PL/standings', {
        headers: { 'X-Auth-Token': process.env.FOOTBALL_API_KEY }
      });
      const standingsData = await standingsRes.json();
      table = standingsData.standings.find(s => s.type === 'TOTAL').table;
    }

    const tableSummary = table.map(row =>
      `${row.position}. ${row.team.name} — ${row.playedGames} played, ${row.points}pts, GD ${row.goalDifference}`
    ).join('\n');

    const gamesTotal = 38;

    let prompt;
    if (isSimulated) {
      prompt = `You are a football analyst estimating title race, Champions League qualification, and relegation probabilities for the English Premier League, based on a HYPOTHETICAL current table a user has simulated. The season has ${gamesTotal} games per team in total.

Hypothetical table:
${tableSummary}

For each team, estimate the realistic probability (0-100, can include decimals) of finishing 1st ("title"), finishing in the top 4 ("cl"), or finishing in the bottom 3 ("relegation"), based purely on points, games played, and goal difference above. Make sure probabilities are internally consistent (title probabilities across all teams should sum to roughly 100).

Respond with ONLY a JSON object, no surrounding text, in exactly this format:
{"probabilities": [{"team": "team name", "title": 0, "cl": 0, "relegation": 0}]}`;
    } else {
      const today = new Date().toISOString().split('T')[0];
      prompt = `You are a football analyst estimating title race, Champions League qualification, and relegation probabilities for the English Premier League. Today's date is ${today}. The season has ${gamesTotal} games per team in total.

Current table:
${tableSummary}

Before estimating, search the web for the latest news relevant to the title race, top-4 race, and relegation battle: team form, injuries, run-in fixture difficulty, and anything else that would meaningfully shift these odds beyond the raw points.

For each team, estimate the realistic probability (0-100, can include decimals) of finishing 1st ("title"), finishing in the top 4 ("cl"), or finishing in the bottom 3 ("relegation"). Make sure probabilities are internally consistent (title probabilities across all teams should sum to roughly 100).

Respond with ONLY a JSON object, no surrounding text, in exactly this format:
{"probabilities": [{"team": "team name", "title": 0, "cl": 0, "relegation": 0}]}`;
    }

    const requestBody = {
      model: 'claude-sonnet-5',
      max_tokens: isSimulated ? 4096 : 8192,
      messages: [{ role: 'user', content: prompt }]
    };
    if (!isSimulated) {
      requestBody.tools = [{ type: 'web_search_20250305', name: 'web_search' }];
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify(requestBody)
    });

    const data = await response.json();
    const textBlocks = data.content.filter(block => block.type === 'text');
    if (textBlocks.length === 0) {
      return res.status(500).json({ error: 'No text response from Claude', stopReason: data.stop_reason, raw: data });
    }
    const text = textBlocks[textBlocks.length - 1].text;
    const clean = text.replace(/```json|```/g, '').trim();
    const probabilities = JSON.parse(clean);

    if (!isSimulated) {
      res.setHeader('Cache-Control', 's-maxage=21600, stale-while-revalidate');
    }
    res.status(200).json(probabilities);
  } catch (err) {
    res.status(500).json({ error: 'Could not get probabilities', details: err.message });
  }
}
