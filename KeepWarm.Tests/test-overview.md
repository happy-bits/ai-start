# 📋 Testöversikt - KeepWarm CRM

## Sammanfattning

Detta dokument beskriver de affärskritiska flöden som testas i KeepWarm CRM-systemet. Testerna är prioriterade baserat på affärsvärde och risk, enligt TDD-principer och best practices.


---

## 🎯 Affärskritiska Testområden

### 1️⃣ Säkerhets- och Auktoriseringsflöden
**Prioritet:** 🔴 HÖGST  
**Testtyp:** Integrationstester (Service + DB)  
**Affärsvärde:** Säkerställa att användare endast kan se och manipulera sin egen data

#### Kritiska scenarier som testas - Kunder:
- ✅ User kan endast se sina egna kunder
- ✅ User kan inte redigera/ta bort andra användares kunder
- ✅ Admin kan se alla kunder
- ✅ Admin kan agera på uppdrag av andra användare
- ✅ Oauktoriserad åtkomst blockeras korrekt

**Tester:** `SecurityIntegrationTests.cs`

#### Kritiska scenarier som testas - Interaktioner:
- ✅ User kan endast se sina egna interaktioner
- ✅ User kan inte läsa andra användares interaktioner
- ✅ User kan inte uppdatera andra användares interaktioner
- ✅ User kan inte ta bort andra användares interaktioner
- ✅ Säkerhetskontroller fungerar vid hämtning av interaktioner per kund
- ✅ Komplett säkerhetsflöde med flera användare verifieras

**Tester:** `InteractionSecurityIntegrationTests.cs` 

---

### 2️⃣ Interaktions- och Uppföljningslogik
**Prioritet:** 🔴 HÖGST  
**Testtyp:** Integrationstester (InteractionService + CustomerService + DB)  
**Affärsvärde:** Kärnan i CRM - att hålla koll på kundinteraktioner och uppföljningar

#### Kritiska scenarier som testas:
- ✅ När en interaktion skapas med `FollowUpDate`, uppdateras `Customer.NextFollowUpDate`
- ✅ När en interaktion uppdateras med nytt `FollowUpDate`, uppdateras `Customer.NextFollowUpDate`
- ✅ När `FollowUpDate` tas bort vid uppdatering, sätts `Customer.NextFollowUpDate` till null
- ✅ När en interaktion tas bort, räknas `Customer.NextFollowUpDate` om till tidigaste kvarvarande datum
- ✅ Interaktionsdatum formateras korrekt till minutprecision
- ✅ Äldsta uppföljningsdatum visas först i kundlistan
- ✅ Om ingen `FollowUpDate` sätts, uppdateras `Customer.NextFollowUpDate` till null

**Tester:** `InteractionServiceIntegrationTests.cs`

---

### 3️⃣ Användarhantering och Datarelationer
**Prioritet:** 🟠 HÖG  
**Testtyp:** Integrationstester (IdentityService + CustomerService + DB)  
**Affärsvärde:** Undvika dataintegritetsproblem vid användarborttag

#### Kritiska scenarier som testas:
- ✅ När en användare tas bort, sätts `Customer.UserId` till null (inte cascade delete)
- ✅ Kunder förblir i systemet efter användarborttag
- ✅ Admin kan fortfarande se/hantera "föräldralösa" kunder
- ✅ `UpdatedAt` uppdateras korrekt vid användarborttag

**Tester:** `UserDeletionIntegrationTests.cs` 

---

### 4️⃣ Kundhantering - CRUD med Validering
**Prioritet:** 🟡 MEDEL  
**Testtyp:** Enhetstester för services + vissa integrationstester  
**Affärsvärde:** Säkerställa datakvalitet och korrekt beteende

#### Kritiska scenarier som testas:
- ✅ `CustomerService.CreateCustomer` sätter `CreatedAt` och `UpdatedAt` korrekt
- ✅ `CustomerService.UpdateCustomer` uppdaterar endast `UpdatedAt` (inte `CreatedAt`)
- ✅ `Customer.Email` valideras som giltig e-post
- ✅ Required-fält (`FirstName`, `LastName`, `Email`) kan inte vara tomma
- ✅ Kunder sorteras korrekt efter namn

**Tester:** `CustomerServiceTests.cs` 

---

### 5️⃣ DateTimeHelper - Datumformatering
**Prioritet:** 🟢 LÅG (men enkel att implementera)  
**Testtyp:** Enhetstester (ren funktionslogik, inga dependencies)  
**Affärsvärde:** Konsekvent datumhantering genom hela systemet

#### Kritiska scenarier som testas:
- ✅ `FormatToMinutePrecision` tar bort sekunder och millisekunder
- ✅ `FormatForDisplay` returnerar korrekt format (`yyyy-MM-dd HH:mm`)
- ✅ `FormatForDateTimeLocalInput` returnerar korrekt format för HTML5 input

**Tester:** `DateTimeHelperTests.cs` 

---

## 🌐 E2E HTTP-tester

**Testtyp:** End-to-End tester via HTTP  
**Affärsvärde:** Verifiera att hela stacken fungerar korrekt

#### Scenarier som testas:
- ✅ Hemsidan laddas korrekt
- ✅ Privacy-sidan laddas korrekt
- ✅ Skyddade sidor redirectar till login
- ✅ Statiska filer (CSS/JS) serveras korrekt
- ✅ Icke-existerande sidor returnerar 404

**Tester:** `CriticalFlowsE2ETests.cs`

---


## 🎓 Testprinciper som följs

### ✅ Vad vi testar:
- **Beteende och affärsvärde** - Inte implementation
- **Kritiska flöden** - Säkerhet, datarelationer, kärnfunktionalitet
- **Integration där det behövs** - Databasinteraktioner, service-samspel
- **Realistisk testdata** - Användarnamn, e-postadresser, datum

### ✅ Teststruktur:
- **Given-When-Then** - Tydlig struktur
- **En orsak per test** - Ett test per scenario
- **Beskrivande namn** - `Method_Condition_ExpectedOutcome`

### ❌ Vad vi INTE testar:
- Private metoder
- ASP.NET Identity interna funktioner
- EF Core query-generering
- View-rendering
- 100% code coverage för sakens skull
- Controllers (de är tunna orchestrations-lager utan komplexitet, och skulle kräva massa mockning)


---

## 📊 Teststatistik

- **Totalt antal tester:** 74
- **Integrationstester:** 46
- **Enhetstester:** 23
- **E2E-tester:** 5

**Testkategorifördelning:**
- Säkerhetstester (kunder): 10 tester
- Säkerhetstester (interaktioner): 9 tester
- Interaktionslogik: 17 tester
- Användarhantering: 10 tester
- Kundhantering (CRUD): 18 tester
- DateTimeHelper: 5 tester
- E2E HTTP-flöden: 5 tester

---

*Dokumentet uppdaterat: 2025-10-04*

