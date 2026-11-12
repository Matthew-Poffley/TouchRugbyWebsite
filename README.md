# TouchRugbyWebsite
## Cancelling / changing a week's session (admin)

`status.json` holds a one-week override that the site reads on load. Don't edit it by hand — use the GitHub Actions buttons:

1. In the GitHub app or website, open the repo → **Actions**.
2. Pick a workflow and tap **Run workflow**:
   - **1. Cancel this week** — red "No session this week" banner; the countdown and weather card jump to the next real session.
   - **2. This week - Saturday only** / **3. Sunday only** — winter only; the countdown and weather card target that day.
   - **4. This week - back to normal** — clears any override.
   - **5. Custom status** — add a banner message (e.g. "pitch waterlogged") or set up *next* week in advance.
3. The site updates within a minute or two. An override only applies to the week it was set for, so it expires by itself.
