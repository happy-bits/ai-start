Uppdatera dokumentationen i mappen `docs` enligt följande:

## 1. Vad som ska uppdateras

- **Enstaka fil**: Om användaren skriver `/autodoc <filnamn>` uppdateras endast `docs/<filnamn>.md`. Avsluta direkt utan att fråga om nästa dokument.
  - Exempel: `/autodoc abc` → uppdaterar endast `docs/abc.md` och avslutar.
- **Alla dokument**: Om inget filnamn anges uppdateras alla dokument (se punkt 2). Uppdatera ett i taget och vänta på bekräftelse mellan varje.

## 2. Vilka dokument

- **Alla dokument** = alla `.md`-filer i `docs/` utom `_ai_instructions.md`.
- **Gör aldrig ändringar** i `docs/_ai_instructions.md`.

## 3. Hur varje dokument uppdateras

Utgå från:
- Instruktioner i `docs/_ai_instructions.md`
- Rubriken "Syfte" i dokumentet

Om dokumentet har en sektion "Instruktioner till AI" gäller den före `_ai_instructions.md` vid konflikt.

## 4. Bekräftelse mellan dokument

När flera dokument ska uppdateras:
- Efter varje uppdatering, ställ frågan "Ska jag fortsätta?"
- Tomt svar (bara Enter), punktum (`.`), eller korta bekräftelser (t.ex. `j`, `ok`) tolkas som ja.
- Fortsätt tills alla dokument är uppdaterade eller användaren avbryter.
