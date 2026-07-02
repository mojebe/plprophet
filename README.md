# PL Prophet

A mobile-first Premier League table simulator. See the live standings, fill in your own predicted scores (or let "the Prophet" — an AI — guess for you), and instantly see how the table would look.

🔗 [plprophet.com](https://plprophet.com)

## Features

- **Live table** — current Premier League standings, fetched from [football-data.org](https://www.football-data.org/)
- **Upcoming matches** — grouped by matchday, with score inputs
- **Simulate table** — enter your own scores (or a mix of your own and the Prophet's) and see the resulting table
- **The Prophet** — an AI (Claude) that predicts realistic scorelines, either per match, per matchday round, or you can fill in your own
- **Title / Champions League / relegation odds** — AI-estimated probability per team, shown as the Ti / CL / Re columns, based on the real table (updated periodically) or recalculated instantly for your simulated table

## Tech stack

- Plain HTML/CSS/JS (`index.html`) — no build step, no framework
- Vercel serverless functions (`/api`) — keep API keys secret and talk to external APIs
- [football-data.org](https://www.football-data.org/) — live Premier League data
- [Anthropic API](https://www.anthropic.com/) (Claude) — powers the Prophet's predictions and probabilities

## Project structure

```
index.html          — the entire front-end (HTML + CSS + JS in one file)
api/standings.js     — fetches the current league table
api/fixtures.js      — fetches upcoming matches, grouped by matchday
api/predict.js       — asks Claude to predict scorelines for given matches
api/probabilities.js — asks Claude to estimate title/CL/relegation odds
```

## Environment variables

Set these in Vercel → Settings → Environment Variables:

| Key | Description |
|---|---|
| `FOOTBALL_API_KEY` | API key from football-data.org |
| `ANTHROPIC_API_KEY` | API key from console.anthropic.com |

## Deployment

Pushing to `main` automatically deploys via Vercel. No build step required.

## Notes on cost & caching

- `/api/standings` and `/api/fixtures` are cached for 30 minutes.
- `/api/probabilities` (for the real table) is cached for 6 hours and uses web search for up-to-date form/injury context — the more expensive call.
- Simulated-table probabilities and match predictions skip web search to stay fast and cheap.

---

Built by Jens Moberg · with Claude
