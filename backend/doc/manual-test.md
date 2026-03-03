
# Starta server med seed-data

SEED_DB=true npm run dev

# Kolla om servern är igång

curl http://localhost:3001/health

# Logga in och få token

curl http://localhost:3001/auth/login \
-H "Content-Type: application/json" \
-d '{"email": "admin@keepwarm.com", "password": "admin123"}'

# Lista alla säljare

curl http://localhost:3001/api/sellers \
  -H "Authorization: Bearer TOKEN"

# Snyggare

## Logga in och spara token

TOKEN=$(curl -s -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@keepwarm.com", "password": "admin123"}' \
  | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

echo $TOKEN

## Använd token för att lista säljare

curl -s http://localhost:3001/api/sellers \
  -H "Authorization: Bearer $TOKEN" | jq

Detaljer:
- s är "silent mode", så slipper du se progress
- jq ger snyggare JSON-formattering

## Lägg till en säljare

curl -X POST -s http://localhost:3001/api/sellers \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"email": "kalle@keepwarm.com", "password": "password123", "name": "Kalle"}' \
  | jq

## Visa alla säljare (ink den nya)

curl -s http://localhost:3001/api/sellers \
  -H "Authorization: Bearer $TOKEN" | jq