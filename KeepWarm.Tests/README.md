# KeepWarm.Tests

Service-level tester för KeepWarm CRM-systemet, strukturerade enligt user stories från `Docs/userstories.md`.

✅ **Alla 30 tester passerar (100%)**

## Struktur

Testprojektet är organiserat för att direkt spegla user stories:

```
KeepWarm.Tests/
├── ServiceTests/                  # ✅ Service-level tester (30 tester, alla passerar)
│   ├── UserManagement/
│   │   ├── US_User_Login_Service.cs
│   │   ├── US_Admin_CreateUser_Service.cs
│   │   └── US_Admin_DeleteUser_Service.cs
│   │
│   └── CustomerManagement/
│       ├── US_User_ListCustomers_Service.cs
│       ├── US_User_CreateCustomer_Service.cs
│       └── US_User_DeleteCustomer_Service.cs
│
└── Helpers/
    ├── ServiceTestBase.cs             # Basklass för service-tester
    ├── TestWebApplicationFactory.cs   # WebApplicationFactory (ej använd)
    ├── TestDataBuilder.cs             # Hjälpklass (ej använd)
    └── AuthenticationHelper.cs        # Hjälpklass (ej använd)
```

## Köra tester

### Alla tester
```bash
dotnet test
```

### Specifik kategori
```bash
# Endast användarhantering
dotnet test --filter "FullyQualifiedName~ServiceTests.UserManagement"

# Endast kundhantering
dotnet test --filter "FullyQualifiedName~ServiceTests.CustomerManagement"
```

### Specifik user story
```bash
# Login-tester
dotnet test --filter "FullyQualifiedName~US_User_Login_Service"

# Skapa användare-tester
dotnet test --filter "FullyQualifiedName~US_Admin_CreateUser_Service"

# Lista kunder-tester
dotnet test --filter "FullyQualifiedName~US_User_ListCustomers_Service"
```

## Testtyp

**Service-level tester** som testar business logic direkt:

- ✅ Testar business logic via services (CustomerService, IdentityService)
- ✅ Använder in-memory databas (Entity Framework Core InMemory provider)
- ✅ Snabba och pålitliga (~24ms per test i genomsnitt)
- ✅ Ingen beroende på controllers eller HTTP
- ✅ Perfekt för TDD och CI/CD

## Teknisk implementation

### ServiceTestBase
- Basklass som sätter upp in-memory databas och services
- Tillhandahåller UserManager, RoleManager, Context och ServiceProvider
- Helper-metoder för att skapa användare och kunder
- Automatisk cleanup med IDisposable
- Varje test får en isolerad databas

## Exempel på test

```csharp
public class US_User_ListCustomers_Service : ServiceTestBase
{
    private readonly ICustomerService _customerService;

    public US_User_ListCustomers_Service()
    {
        _customerService = ServiceProvider.GetRequiredService<ICustomerService>();
    }

    [Fact]
    public async Task Användare_SerEndasSinaEgnaKunder()
    {
        // Given: Två användare med egna kunder
        var user1 = await CreateUserAsync("user1@example.com");
        var user2 = await CreateUserAsync("user2@example.com");

        await CreateCustomerAsync(user1.Id, "Customer1", "FromUser1");
        await CreateCustomerAsync(user1.Id, "Customer2", "FromUser1");
        await CreateCustomerAsync(user1.Id, "Customer3", "FromUser1");
        await CreateCustomerAsync(user2.Id, "Customer1", "FromUser2");

        // When: user1 hämtar sina kunder
        var user1Customers = await _customerService.GetAllCustomersAsync(user1.Id);

        // Then: user1 ser endast sina 3 kunder
        user1Customers.Count().ShouldBe(3);
        user1Customers.All(c => c.UserId == user1.Id).ShouldBeTrue();
        user1Customers.All(c => c.LastName == "FromUser1").ShouldBeTrue();
    }
}
```

## Teststatistik

- **Totalt antal tester**: 30
- **Passerar**: ✅ 30/30 (100%)
- **Testfiler**: 6
- **Körtid**: ~720ms
- **Genomsnittlig tid per test**: ~24ms

### Täckning per user story
- ✅ US_User_Login (5 tester)
- ✅ US_Admin_CreateUser (5 tester)
- ✅ US_Admin_DeleteUser (5 tester)
- ✅ US_User_ListCustomers (5 tester)
- ✅ US_User_CreateCustomer (5 tester)
- ✅ US_User_DeleteCustomer (5 tester)

### Testad funktionalitet

**Användarhantering:**
- Skapa användare med validering (email, lösenord)
- Hitta användare via email
- Validera lösenord
- Rollhantering (Admin/User)
- Ta bort användare
- Hantera kund-relation vid användarborttagning

**Kundhantering:**
- Skapa kunder med tidsstämplar
- Lista kunder (användarspecifik)
- Data-isolering mellan användare
- Ta bort kunder
- Admin-funktionalitet (se alla kunder)
- Flytta kunder mellan användare

## Dependencies

- xUnit (testramverk)
- Shouldly (assertion library)
- Microsoft.AspNetCore.Mvc.Testing (integration testing)
- Microsoft.EntityFrameworkCore.InMemory (in-memory databas)
