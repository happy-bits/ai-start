# Import av kontakter från CSV – KeepWarm CRM

## Översikt

Säljare kan importera flera kontakter samtidigt genom att ladda upp en CSV-fil. Funktionen finns på ContactList-sidan via knappen "Import" och öppnar en modal där användaren väljer fil, mappar kolumner till fält, granskar en förhandsvisning och väljer vilka rader som ska importeras.

## Användarflöde

1. **Öppna import** – Klicka på "Import" på kontaktsidan (`/contacts`)
2. **Välj CSV-fil** – Klicka eller dra och släpp en `.csv`- eller `.txt`-fil
3. **Kolumner mappas** – Systemet föreslår automatisk mappning baserat på kolumnnamn (t.ex. "name", "namn", "email", "e-post")
4. **Granska** – Tabell med förhandsvisning visar namn, e-post, företag och status (Valid/Invalid/Duplicate)
5. **Välj rader** – Avmarkera ogiltiga eller duplicerade rader
6. **Importera** – Klicka "Import X contacts" för att skapa kontakterna

## Validering

### Frontend (preview)

- **Namn** – Obligatoriskt. Tomt namn → "Invalid".
- **E-post** – Om angiven måste ha giltigt format (regex).
- **Följupp-datum** – Om angivet måste vara `YYYY-MM-DD`.

### Duplicatkontroll

En rad markeras som "Duplicate" om den matchar existerande kontakt via:

- **E-post** – Samma e-postadress (case-insensitive), eller
- **Namn + företag** – Samma namn och företag (case-insensitive).

### Backend (all-or-nothing)

- Alla kontakter valideras med Zod innan någon insert
- Om någon rad är ogiltig avvisas hela batch
- Inga partiella uppdateringar

## API

### POST /api/contacts/bulk

**Request:** `{ contacts: CreateContactData[] }`

**Response:** `201 { contacts: Contact[] }`

**Validering:** Samma schema som `CreateContactSchema` (name, email, phone, company, linkedin, followUpDate). Minst en kontakt krävs.

**Åtkomst:** Bearer token. Säljare skapar kontakter under sin egen `sellerId`.

## Teknisk implementation

### Frontend

| Komponent | Filsökväg | Beskrivning |
|-----------|-----------|-------------|
| ImportContactsModal | `frontend/src/pages/contacts/ImportContactsModal.tsx` | Modal med filval, kolumnmappning, preview och import |
| Kontaktlista | `frontend/src/pages/contacts/ContactList.tsx` | Visar Import-knappen och öppnar modalen |

### Utils

| Funktion | Filsökväg | Beskrivning |
|----------|-----------|-------------|
| parseCSV | `frontend/src/utils/csv.ts` | Parsar CSV-text till array av objekt |
| suggestColumnMapping | `frontend/src/utils/csv.ts` | Föreslår mappning från kolumnnamn till fält |
| COLUMN_ALIASES | `frontend/src/utils/csv.ts` | Alias för svenska/engelska kolumnnamn |

### API-hooks

- **useCreateContactsBulk** – Mutation som anropar `POST /api/contacts/bulk`
- **createContactsBulk** – API-funktion i `frontend/src/api/contacts.ts`

### CSV-format

- **Separator** – Komma eller tab
- **Citat** – Fält med komma eller radbrytning kan wrappas i `"`
- **Header** – Första raden är kolumnnamn
- **Kodning** – UTF-8

### Kolumnnamn som stöds (alias)

| Fält | Exempel på kolumnnamn |
|------|------------------------|
| name | name, namn, contact, contact name, full name |
| email | email, e-post, e-postadress, mail |
| phone | phone, telefon, tel, mobile, mobil |
| company | company, företag, organization, organisation |
| linkedin | linkedin, linkedin url, linkedin profile |
| followUpDate | follow up date, followup, följupp, följ upp, follow_up_date |

## Beteende

- **Ogiltiga rader** – Auto-avmarkeras när validering körs
- **Duplicerade rader** – Markeras i preview; användaren kan avmarkera om önskat
- **Tom fil** – Endast headers eller ingen data → felmeddelande "File is empty or has no data rows"
- **Parse-fel** – Felmeddelande "Could not parse CSV file"
- **Import-fel** – API-fel visas i `ErrorMessage`

## E2E-tester

Tester i `frontend/e2e/contact-import.spec.ts`:

- **Happy path** – Importera två nya kontakter
- **Invalid row** – Ogiltig rad (saknad namn) visar fel och auto-avmarkeras; endast giltig rad importeras
- **Duplicate** – Duplicerad rad markeras; användaren kan avmarkera och importera endast nya
- **Empty file** – Tom fil med endast headers visar felmeddelande

## Relaterad dokumentation

- **autodocs/oversikt.md** – Systemöversikt, kontaktflöden
- **autodocs/frontend.md** – Frontend-komponenter
- **autodocs/backend.md** – API-struktur
