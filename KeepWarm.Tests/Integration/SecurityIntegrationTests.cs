using KeepWarm.Data;
using KeepWarm.Models;
using KeepWarm.Services;
using KeepWarm.Tests.TestHelpers;
using Shouldly;

namespace KeepWarm.Tests.Integration;

/// <summary>
/// Kritiska säkerhetsintegrationstester
/// Testar att användare endast kan se och manipulera sin egen data
/// </summary>
public class SecurityIntegrationTests : IDisposable
{
    private readonly ApplicationDbContext _context;
    private readonly CustomerService _customerService;

    public SecurityIntegrationTests()
    {
        _context = TestDbContextFactory.CreateInMemoryDbContext();
        _customerService = new CustomerService(_context);
    }

    public void Dispose()
    {
        _context.Dispose();
    }

    [Fact]
    public async Task GetAllCustomersAsync_SomStandardUser_ReturnearEndastEgnaKunder()
    {
        // Given - Två användare med varsina kunder
        var user1 = await TestUserFactory.CreateStandardUserAsync(_context, "kalle");
        var user2 = await TestUserFactory.CreateStandardUserAsync(_context, "lisa");
        
        await _context.Customers.AddAsync(TestDataSeeder.CreateCustomer(user1.Id, "Anna", "Andersson", "anna@test.se"));
        await _context.Customers.AddAsync(TestDataSeeder.CreateCustomer(user1.Id, "Bengt", "Bengtsson", "bengt@test.se"));
        await _context.Customers.AddAsync(TestDataSeeder.CreateCustomer(user2.Id, "Cecilia", "Carlsson", "cecilia@test.se"));
        await _context.SaveChangesAsync();

        // When - User1 hämtar sina kunder
        var user1Customers = (await _customerService.GetAllCustomersAsync(user1.Id)).ToList();
        
        // Then - User1 ska endast se sina egna kunder (Anna och Bengt)
        user1Customers.Count.ShouldBe(2);
        user1Customers.ShouldAllBe(c => c.UserId == user1.Id);
        user1Customers.ShouldContain(c => c.FirstName == "Anna");
        user1Customers.ShouldContain(c => c.FirstName == "Bengt");
        user1Customers.ShouldNotContain(c => c.FirstName == "Cecilia");
    }

    [Fact]
    public async Task GetCustomerByIdAsync_SomIckeAgare_ReturnearNull()
    {
        // Given - User1 har en kund
        var user1 = await TestUserFactory.CreateStandardUserAsync(_context, "kalle");
        var user2 = await TestUserFactory.CreateStandardUserAsync(_context, "lisa");
        
        var customer = TestDataSeeder.CreateCustomer(user1.Id, "Anna", "Andersson", "anna@test.se");
        await _context.Customers.AddAsync(customer);
        await _context.SaveChangesAsync();

        // When - User2 försöker hämta User1:s kund
        var result = await _customerService.GetCustomerByIdAsync(customer.Id, user2.Id);

        // Then - Ska returnera null (säkerhetsskydd)
        result.ShouldBeNull();
    }

    [Fact]
    public async Task UpdateCustomerAsync_SomIckeAgare_KanInteUppdatera()
    {
        // Given - User1 har en kund
        var user1 = await TestUserFactory.CreateStandardUserAsync(_context, "kalle");
        var user2 = await TestUserFactory.CreateStandardUserAsync(_context, "lisa");
        
        var customer = TestDataSeeder.CreateCustomer(user1.Id, "Anna", "Andersson", "anna@test.se");
        await _context.Customers.AddAsync(customer);
        await _context.SaveChangesAsync();
        
        // Detach för att kunna göra ändringar
        _context.Entry(customer).State = Microsoft.EntityFrameworkCore.EntityState.Detached;

        // When - User2 försöker uppdatera User1:s kund
        customer.FirstName = "Hacker";
        customer.Email = "hacker@evil.com";
        var result = await _customerService.UpdateCustomerAsync(customer, user2.Id);

        // Then - Uppdatering ska misslyckas
        result.ShouldBeNull();
        
        // Verifiera att originalet är oförändrat
        var unchanged = await _customerService.GetCustomerByIdAsync(customer.Id, user1.Id);
        unchanged!.FirstName.ShouldBe("Anna");
        unchanged.Email.ShouldBe("anna@test.se");
    }

    [Fact]
    public async Task DeleteCustomerAsync_SomIckeAgare_KanInteTaBort()
    {
        // Given - User1 har en kund
        var user1 = await TestUserFactory.CreateStandardUserAsync(_context, "kalle");
        var user2 = await TestUserFactory.CreateStandardUserAsync(_context, "lisa");
        
        var customer = TestDataSeeder.CreateCustomer(user1.Id, "Anna", "Andersson", "anna@test.se");
        await _context.Customers.AddAsync(customer);
        await _context.SaveChangesAsync();

        // When - User2 försöker ta bort User1:s kund
        var result = await _customerService.DeleteCustomerAsync(customer.Id, user2.Id);

        // Then - Borttagning ska misslyckas
        result.ShouldBeFalse();
        
        // Verifiera att kunden fortfarande finns
        var stillExists = await _customerService.GetCustomerByIdAsync(customer.Id, user1.Id);
        stillExists.ShouldNotBeNull();
        stillExists.FirstName.ShouldBe("Anna");
    }

    [Fact]
    public async Task GetAllCustomersForAdminAsync_SomAdmin_ReturnearAllaKunder()
    {
        // Given - Tre användare med varsina kunder
        var user1 = await TestUserFactory.CreateStandardUserAsync(_context, "kalle");
        var user2 = await TestUserFactory.CreateStandardUserAsync(_context, "lisa");
        var user3 = await TestUserFactory.CreateStandardUserAsync(_context, "erik");
        
        await _context.Customers.AddAsync(TestDataSeeder.CreateCustomer(user1.Id, "Anna", "Andersson", "anna@test.se"));
        await _context.Customers.AddAsync(TestDataSeeder.CreateCustomer(user2.Id, "Bengt", "Bengtsson", "bengt@test.se"));
        await _context.Customers.AddAsync(TestDataSeeder.CreateCustomer(user3.Id, "Cecilia", "Carlsson", "cecilia@test.se"));
        await _context.SaveChangesAsync();

        // When - Admin hämtar alla kunder
        var allCustomers = (await _customerService.GetAllCustomersForAdminAsync()).ToList();

        // Then - Admin ska se alla kunder oavsett ägare
        allCustomers.Count.ShouldBeGreaterThanOrEqualTo(3);
        allCustomers.ShouldContain(c => c.FirstName == "Anna" && c.UserId == user1.Id);
        allCustomers.ShouldContain(c => c.FirstName == "Bengt" && c.UserId == user2.Id);
        allCustomers.ShouldContain(c => c.FirstName == "Cecilia" && c.UserId == user3.Id);
    }

    [Fact]
    public async Task GetCustomerByIdForAdminAsync_SomAdmin_KanHamtaVillkenKundSomHelst()
    {
        // Given - En användare med en kund
        var user = await TestUserFactory.CreateStandardUserAsync(_context, "kalle");
        var customer = TestDataSeeder.CreateCustomer(user.Id, "Anna", "Andersson", "anna@test.se");
        await _context.Customers.AddAsync(customer);
        await _context.SaveChangesAsync();

        // When - Admin hämtar kundens detaljer
        var result = await _customerService.GetCustomerByIdForAdminAsync(customer.Id);

        // Then - Admin ska kunna se kunden med användarrelation
        result.ShouldNotBeNull();
        result.FirstName.ShouldBe("Anna");
        result.UserId.ShouldBe(user.Id);
        result.User.ShouldNotBeNull();
        result.User.Email.ShouldBe(user.Email);
    }

    [Fact]
    public async Task UpdateCustomerForAdminAsync_SomAdmin_KanUppdateraVillkenKundSomHelst()
    {
        // Given - En användare med en kund
        var user = await TestUserFactory.CreateStandardUserAsync(_context, "kalle");
        var customer = TestDataSeeder.CreateCustomer(user.Id, "Anna", "Andersson", "anna@test.se");
        await _context.Customers.AddAsync(customer);
        await _context.SaveChangesAsync();
        
        // Detach för att kunna göra ändringar
        _context.Entry(customer).State = Microsoft.EntityFrameworkCore.EntityState.Detached;

        // When - Admin uppdaterar kunden
        customer.FirstName = "Annika";
        customer.Email = "annika.andersson@foretag.se";
        var result = await _customerService.UpdateCustomerForAdminAsync(customer);

        // Then - Uppdateringen ska lyckas
        result.ShouldNotBeNull();
        result.FirstName.ShouldBe("Annika");
        result.Email.ShouldBe("annika.andersson@foretag.se");
        
        // Verifiera att ändringen finns i databasen
        var updated = await _customerService.GetCustomerByIdForAdminAsync(customer.Id);
        updated!.FirstName.ShouldBe("Annika");
    }

    [Fact]
    public async Task DeleteCustomerForAdminAsync_SomAdmin_KanTaBortVillkenKundSomHelst()
    {
        // Given - En användare med en kund
        var user = await TestUserFactory.CreateStandardUserAsync(_context, "kalle");
        var customer = TestDataSeeder.CreateCustomer(user.Id, "Anna", "Andersson", "anna@test.se");
        await _context.Customers.AddAsync(customer);
        await _context.SaveChangesAsync();

        // When - Admin tar bort kunden
        var result = await _customerService.DeleteCustomerForAdminAsync(customer.Id);

        // Then - Borttagningen ska lyckas
        result.ShouldBeTrue();
        
        // Verifiera att kunden är borttagen
        var deleted = await _customerService.GetCustomerByIdForAdminAsync(customer.Id);
        deleted.ShouldBeNull();
    }

    [Fact]
    public async Task ComplettSakerhetsflode_MultiplaAnvandareOchRoller_FungearKorrekt()
    {
        // Given - Två standardanvändare och en admin
        var user1 = await TestUserFactory.CreateStandardUserAsync(_context, "kalle");
        var user2 = await TestUserFactory.CreateStandardUserAsync(_context, "lisa");
        var admin = await TestUserFactory.CreateAdminUserAsync(_context);
        
        // User1 skapar två kunder
        var user1Customer1 = TestDataSeeder.CreateCustomer(user1.Id, "Anna", "Andersson", "anna@test.se");
        var user1Customer2 = TestDataSeeder.CreateCustomer(user1.Id, "Bengt", "Bengtsson", "bengt@test.se");
        
        // User2 skapar en kund
        var user2Customer = TestDataSeeder.CreateCustomer(user2.Id, "Cecilia", "Carlsson", "cecilia@test.se");
        
        await _context.Customers.AddRangeAsync(user1Customer1, user1Customer2, user2Customer);
        await _context.SaveChangesAsync();

        // When/Then - User1 ser endast sina egna kunder
        var user1View = (await _customerService.GetAllCustomersAsync(user1.Id)).ToList();
        user1View.Count.ShouldBe(2);
        user1View.ShouldAllBe(c => c.UserId == user1.Id);

        // When/Then - User2 ser endast sin egen kund
        var user2View = (await _customerService.GetAllCustomersAsync(user2.Id)).ToList();
        user2View.Count.ShouldBe(1);
        user2View.ShouldAllBe(c => c.UserId == user2.Id);

        // When/Then - Admin ser alla kunder
        var adminView = (await _customerService.GetAllCustomersForAdminAsync()).ToList();
        adminView.Count.ShouldBeGreaterThanOrEqualTo(3);
        adminView.ShouldContain(c => c.UserId == user1.Id && c.FirstName == "Anna");
        adminView.ShouldContain(c => c.UserId == user1.Id && c.FirstName == "Bengt");
        adminView.ShouldContain(c => c.UserId == user2.Id && c.FirstName == "Cecilia");

        // When/Then - User1 kan inte se User2:s kund
        var unauthorized = await _customerService.GetCustomerByIdAsync(user2Customer.Id, user1.Id);
        unauthorized.ShouldBeNull();

        // When/Then - Admin kan se User2:s kund
        var authorized = await _customerService.GetCustomerByIdForAdminAsync(user2Customer.Id);
        authorized.ShouldNotBeNull();
        authorized.FirstName.ShouldBe("Cecilia");
    }
}

