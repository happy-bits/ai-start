Skapa ett webbprojekt med den senaste versionen av **.NET** och använd **SQLite** som databas.  

Projektet ska byggas enligt **TDD (Test-Driven Development)** – börja alltid med att skriva ett test som misslyckas innan du implementerar funktionaliteten.

### Kravspecifikation

#### Roller
- **Admin**
  - Har fullständiga rättigheter i systemet.  
  - Kan skapa och hantera användarkonton.  
  - När ett nytt konto skapas ska rollen alltid vara **user** (admin får inte skapa andra admins).  

- **User**
  - Kan logga in i systemet.  
  - Kan skapa, läsa, uppdatera och ta bort **Customers**, men endast de Customers som tillhör den egna användaren.  

#### Funktionalitet
1. **Autentisering & auktorisering**  
   - Implementera ett rollbaserat behörighetssystem.  
   - Endast inloggade användare ska ha åtkomst till resurser.  

2. **Customer-hantering**  
   - En **user** kan hantera sina egna Customers (CRUD).  
   - En **admin** ska ha möjlighet att se och hantera alla Customers.  

3. **Databas (SQLite)**  
   - Använd migrations för att skapa och underhålla databasschemat.  

#### Utvecklingsprocess (TDD)
- Skriv först ett test som beskriver den önskade funktionaliteten.  
- Kör testet och verifiera att det misslyckas.  
- Implementera koden för att uppfylla testet.  
- Refaktorera vid behov.  

#### Tekniska krav
- .NET (senaste versionen)  
- SQLite  
- Enhetstester (t.ex. xUnit eller NUnit)  
- Möjlighet att köra applikationen lokalt med minimalt setup.  
