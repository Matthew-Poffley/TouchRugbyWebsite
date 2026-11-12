#!/usr/bin/env bash
# Rewrites status.json for one week, commits and pushes it.
# Env: STATUS_CANCELLED (true|false), STATUS_DAY (both|sat|sun),
#      STATUS_MESSAGE (optional text), STATUS_WEEK (this|next)
set -euo pipefail

export TZ=Europe/London
offset_days=0
[ "${STATUS_WEEK:-this}" = "next" ] && offset_days=7
# Monday of the chosen week (date -d handles the weekday maths).
week_start=$(date -d "$(date +%F) -$(( ($(date +%u) - 1) )) days +${offset_days} days" +%F)

jq -n \
  --arg week "$week_start" \
  --argjson cancelled "${STATUS_CANCELLED:-false}" \
  --arg day "${STATUS_DAY:-both}" \
  --arg message "${STATUS_MESSAGE:-}" \
  '{week: $week, cancelled: $cancelled, winterDay: $day, message: $message}' > status.json

cat status.json
git config user.name "github-actions[bot]"
git config user.email "41898282+github-actions[bot]@users.noreply.github.com"
git add status.json
if git diff --cached --quiet; then
  echo "status.json already up to date"
  exit 0
fi
git commit -m "Update weekly status: week of $week_start"
git pull --rebase origin "${GITHUB_REF_NAME:-main}"
git push
