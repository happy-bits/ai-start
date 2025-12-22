# Backend


Gå in i projektmappen

    cd backend

Installera
    
    npm install


Starta första gången

    SEED_DB=true npm run dev  

    If you use PowerShell you write this instead: $env:SEED_DB="true"; npm run dev

    If you use Command line (PC) you write: SEED_DB=true && npm run dev

Starta i fortsättningen
    
    npm run dev

Kör tester

    npm run test

Testerna körs automatiskt om när det behövs


# Frontend

Gå in i projektmappen

    cd frontend

Starta
    
    npm run dev


Testa på fem olika sätt:

    npm run test:e2e	        Snabbast stättet att köra (ingen browser eller ui)
    npm run test:e2e:ui	        Visuell interaktiv debugger
    npm run test:e2e:headed	    Öppnar en webläsare och kör testet
    npm run test:e2e:trace	    Skapa en interaktiv rapport med skärmdumpar o nätverkslogg
    npm run test:e2e:debug	    Kan stega, interaktivt

Kör bara ett test

    npm run test:e2e:trace -- e2e/inline-editing.spec.ts

    npm run test:e2e contact-delete.spec.ts


Skapa e2e-tester med playwright

    npx playwright codegen http://localhost:5173/