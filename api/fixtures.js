export default async function handler(req, res) {
  try {
    const response = await fetch('https://api.football-data.org/v4/competitions/PL/matches?status=SCHEDULED', {
      headers: { 'X-Auth-Token': process.env.FOOTBALL_API_KEY }
    });
    const data = await response.json();
    res.setHeader('Cache-Control', 's-maxage=1800, stale-while-revalidate');
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: 'Kunde inte hämta matcher' });
  }
}
