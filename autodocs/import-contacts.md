# Import av kontakter från JSON – KeepWarm CRM

## Översikt

Säljare kan importera flera kontakter samtidigt genom att ladda upp en JSON-fil. Funktionen finns på ContactList-sidan via knappen "Import" och öppnar en modal där användaren väljer fil, granskar en förhandsvisning och väljer vilka kontakter som ska importeras. Kontakter kan även inkludera interaktioner i samma import.

## Användarflöde

1. **Öppna import** – Klicka på "Import" på kontaktsidan (`/contacts`)
2. **Välj JSON-fil** – Klicka eller dra och släpp en `.json`-fil
3. **Granska** – Tabell med förhandsvisning visar namn, e-post, företag, interaktioner och status (Valid/Invalid/Duplicate)
4. **Välj kontakter** – Avmarkera ogiltiga eller duplicerade kontakter
5. **Importera** – Klicka "Import X contacts" för att skapa kontakterna och deras interaktioner

## JSON-format

### Grundläggande struktur

```json
{
  "contacts": [
    {
      "name": "Anna Andersson",
      "email": "anna@example.com",
      "phone": "+46 70 123 45 67",
      "company": "Acme AB",
      "linkedin": "anna-andersson",
      "followUpDate": "2026-03-15",
      "interactions": [
        {
          "type": "call",
          "date": "2026-03-05",
          "time": "14:30",
          "notes": "Diskuterade projekt"
        },
        {
          "type": "meeting",
          "date": "2026-03-10",
          "notes": "Följupp-möte"
        }
      ]
    }
  ]
}
```

### Fält

#### Kontaktfält

| Fält | Typ | Obligatoriskt | Beskrivning |
|------|-----|--------------|-------------|
| name | string | Ja | Kontaktens namn |
| email | string | Nej | E-postadress (valideras om angiven) |
| phone | string | Nej | Telefonnummer |
| company | string | Nej | Företagsnamn |
| linkedin | string | Nej | LinkedIn-användarnamn (ej full URL) |
| followUpDate | string | Nej | Följupp-datum i format `YYYY-MM-DD` |
| interactions | array | Nej | Array av interaktioner (se nedan) |

#### Interaktionsfält

| Fält | Typ | Obligatoriskt | Beskrivning |
|------|-----|--------------|-------------|
| type | string | Ja | Typ: `call`, `meeting`, `email`, `video_call`, eller `note` |
| date | string | Ja | Datum i format `YYYY-MM-DD` |
| time | string | Nej | Tid i format `HH:MM` |
| notes | string | Nej | Anteckningar |

## Validering

### Frontend (preview)

#### Kontakter
- **Namn** – Obligatoriskt. Tomt namn → "Invalid".
- **E-post** – Om angiven måste ha giltigt format (regex).
- **Följupp-datum** – Om angivet måste vara `YYYY-MM-DD`.

#### Interaktioner
- **Typ** – Måste vara en av de tillåtna värdena.
- **Datum** – Obligatoriskt och måste vara `YYYY-MM-DD`.
- Om någon interaktion är ogiltig markeras kontakten som "Invalid".

### Duplicatkontroll

En kontakt markeras som "Duplicate" om den matchar existerande kontakt via:

- **E-post** – Samma e-postadress (case-insensitive), eller
- **Namn + företag** – Samma namn och företag (case-insensitive).

### Backend (all-or-nothing)

- Alla kontakter och interaktioner valideras med Zod innan någon insert
- Om någon kontakt eller interaktion är ogiltig avvisas hela batch
- Inga partiella uppdateringar
- Atomisk transaktion: alla kontakter och interaktioner skapas tillsammans eller inga

## API

### POST /api/contacts/bulk

**Request:** 
```json
{
  "contacts": [
    {
      "name": "Anna Andersson",
      "email": "anna@example.com",
      "interactions": [
        {
          "type": "call",
          "date": "2026-03-05",
          "time": "14:30",
          "notes": "Test"
        }
      ]
    }
  ]
}
```

**Response:** `201 { contacts: Contact[], interactions: Interaction[] }`

**Validering:** 
- Kontakter: Samma schema som `CreateContactSchema` (name, email, phone, company, linkedin, followUpDate)
- Interaktioner: type (enum), date (YYYY-MM-DD), time (optional), notes (optional)
- Minst en kontakt krävs

**Åtkomst:** Bearer token. Säljare skapar kontakter under sin egen `sellerId`.

## Teknisk implementation

### Frontend

| Komponent | Filsökväg | Beskrivning |
|-----------|-----------|-------------|
| ImportContactsModal | `frontend/src/pages/contacts/ImportContactsModal.tsx` | Modal med filval, preview och import |
| Kontaktlista | `frontend/src/pages/contacts/ContactList.tsx` | Visar Import-knappen och öppnar modalen |

### API-hooks

- **useCreateContactsBulk** – Mutation som anropar `POST /api/contacts/bulk`
- **createContactsBulk** – API-funktion i `frontend/src/api/contacts.ts`
- **BulkContactData** – Typ som inkluderar interaktioner för bulk-import

### Backend

- **POST /api/contacts/bulk** – Skapar kontakter och interaktioner i atomisk transaktion
- Använder `db.transaction()` för att säkerställa att alla skapas tillsammans eller inga
- Validerar både kontakter och interaktioner innan någon insert

## Beteende

- **Ogiltiga kontakter** – Auto-avmarkeras när validering körs
- **Ogiltiga interaktioner** – Markerar kontakten som ogiltig; auto-avmarkeras
- **Duplicerade kontakter** – Markeras i preview; användaren kan avmarkera om önskat
- **Tom fil** – Tom contacts-array eller saknad contacts-nyckel → felmeddelande "File is empty or has no contacts"
- **Parse-fel** – Felmeddelande "Could not parse JSON file. Make sure it is valid JSON."
- **Import-fel** – API-fel visas i `ErrorMessage`
- **Interaktioner** – Visas i preview-tabellen med typ och datum; ogiltiga interaktioner markeras med ⚠

## E2E-tester

Tester i `frontend/e2e/contact-import.spec.ts`:

- **Happy path** – Importera två nya kontakter
- **With interactions** – Importera kontakt med interaktioner
- **Invalid row** – Ogiltig kontakt (saknad namn) visar fel och auto-avmarkeras; endast giltig kontakt importeras
- **Invalid interaction** – Ogiltig interaktion (felaktigt datumformat) markerar kontakten som ogiltig
- **Duplicate** – Duplicerad kontakt markeras; användaren kan avmarkera och importera endast nya
- **Empty file** – Tom contacts-array visar felmeddelande
- **Invalid JSON** – Ogiltig JSON visar felmeddelande

## Relaterad dokumentation

- **autodocs/oversikt.md** – Systemöversikt, kontaktflöden
- **autodocs/frontend.md** – Frontend-komponenter
- **autodocs/backend.md** – API-struktur
