#!/usr/bin/env bash
# Smoke against a running API (default http://127.0.0.1:8080)
set -euo pipefail
BASE="${1:-http://127.0.0.1:8080}"
TODAY=$(date +%F)

echo "== health =="
curl -sf "$BASE/health"
echo
echo "== readyz =="
curl -sf "$BASE/readyz"
echo
echo "== spots =="
curl -sf "$BASE/api/spots"
echo
echo "== today =="
curl -sf "$BASE/api/bookings/today"
echo
echo "== create booking (noon today on C) =="
curl -sf -X POST "$BASE/api/bookings" \
  -H 'Content-Type: application/json' \
  -d "{\"sessionId\":\"smoke-session\",\"date\":\"$TODAY\",\"period\":\"noon\",\"vehicle\":{\"plate\":\"浙A88888\",\"color\":\"blue\",\"type\":\"pickup\"}}"
echo
echo "== conflict (expect ok:false) =="
curl -sf -X POST "$BASE/api/bookings" \
  -H 'Content-Type: application/json' \
  -d "{\"sessionId\":\"smoke-session\",\"date\":\"$TODAY\",\"period\":\"noon\",\"vehicle\":{\"plate\":\"浙A88888\",\"color\":\"blue\",\"type\":\"pickup\"}}"
echo
echo "== me bookings =="
curl -sf "$BASE/api/me/bookings?sessionId=smoke-session"
echo
echo "== today after =="
curl -sf "$BASE/api/bookings/today"
echo
echo "OK"
