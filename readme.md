# KeepWarm CRM

Starta både backend och frontend från projektroten:

    npm run dev

Backend startar först (port 3001), sedan frontend (port 5173). Med `npm run dev:seed` seedas databasen vid start.

---

# Backend


Gå in i projektmappen

    cd backend

Installera
    
    npm install


Starta första gången

    npm run dev:seed 

    Alternativt om du använder Powershell:

    npm run dev:seed:powershell

    Alternativt om du använder Commandline:

    npm run dev:seed:commandline

I fortsättningen kan du starta backend utan att seeda med:
    
    npm run dev

Kör tester

    npm run test

Testerna körs automatiskt när en fil ändras


# Frontend

Gå in i projektmappen

    cd frontend

Starta
    
    npm run dev


Kör tester:

    npm run test                "Vitest", kör alla tester utom "e2e"

Kör e2e-tester 🦄

    npm run test:e2e	        Snabbast stättet att köra (ingen browser eller ui) 
    npm run test:e2e:debug	    Kan stega, interaktivt 
    npm run test:e2e:codegen    Skapa e2e-tester grafiskt 

Fler sätt:

    npm run test:e2e:ui	        Visuell interaktiv debugger
    npm run test:e2e:headed	    Öppnar en webläsare och kör testet
    npm run test:e2e:trace	    Skapa en interaktiv rapport med skärmdumpar o nätverkslogg

Kör enstaka tester

    npm run test:e2e:trace -- e2e/inline-editing.spec.ts
    npm run test:e2e contact-delete.spec.ts
    npm run test:e2e:debug e2e/contact-followup-date.spec.ts


