using KeepWarm.Data;
using KeepWarm.Models;
using KeepWarm.Services;
using KeepWarm.Tests.TestHelpers;
using Shouldly;

namespace KeepWarm.Tests.Unit.Services;

/// <summary>
/// Enhetstester för CustomerService
/// Testar CRUD-operationer med in-memory databas
/// </summary>
public class CustomerServiceTests : IDisposable
{
    private readonly ApplicationDbContext _context;
    private readonly CustomerService _service;

    public CustomerServiceTests()
    {
        _context = TestDbContextFactory.CreateInMemoryDbContext();
        _service = new CustomerService(_context);
    }

    public void Dispose()
    {
        _context.Dispose();
    }

    [Fact]
    public async Task CreateCustomerAsync_MedGiltigData_SkaparKundOchSatterTimestamps()
    {
        // Given - En ny kund utan ID
        var customer = new Customer
        {
            FirstName = "Anna",
            LastName = "Andersson",
            Email = "anna.andersson@foretag.se",
            Phone = "070-123 45 67",
            UserId = "test-user-id"
        };
        var beforeCreate = DateTime.UtcNow.AddSeconds(-1);

        // When - Skapar kunden
        var result = await _service.CreateCustomerAsync(customer);
        var afterCreate = DateTime.UtcNow.AddSeconds(1);

        // Then - Kunden ska ha skapats med korrekt data och timestamps
        result.Id.ShouldBeGreaterThan(0);
        result.FirstName.ShouldBe("Anna");
        result.LastName.ShouldBe("Andersson");
        result.Email.ShouldBe("anna.andersson@foretag.se");
        result.CreatedAt.ShouldBeGreaterThanOrEqualTo(beforeCreate);
        result.CreatedAt.ShouldBeLessThanOrEqualTo(afterCreate);
        result.UpdatedAt.ShouldBeGreaterThanOrEqualTo(beforeCreate);
        result.UpdatedAt.ShouldBeLessThanOrEqualTo(afterCreate);
        // CreatedAt och UpdatedAt ska vara (nästan) samma
        (result.UpdatedAt - result.CreatedAt).TotalSeconds.ShouldBeLessThan(1);
    }

    [Fact]
    public async Task GetAllCustomersAsync_MedUserId_ReturnearEndastAnvandarensKunder()
    {
        // Given - Två användare med varsin kund
        var user1Id = "user-1";
        var user2Id = "user-2";
        
        await _context.Customers.AddAsync(TestDataSeeder.CreateCustomer(user1Id, "Anna", "Andersson", "anna@test.se"));
        await _context.Customers.AddAsync(TestDataSeeder.CreateCustomer(user2Id, "Erik", "Eriksson", "erik@test.se"));
        await _context.SaveChangesAsync();

        // When - Hämtar kunder för user1
        var result = await _service.GetAllCustomersAsync(user1Id);

        // Then - Ska endast returnera user1:s kund
        result.Count().ShouldBe(1);
        result.First().FirstName.ShouldBe("Anna");
        result.First().UserId.ShouldBe(user1Id);
    }

    [Fact]
    public async Task GetAllCustomersAsync_MedMultiplaKunder_SorterarPaEfternamnOchFornamn()
    {
        // Given - Tre kunder med olika namn
        var userId = "test-user";
        await _context.Customers.AddAsync(TestDataSeeder.CreateCustomer(userId, "Karin", "Svensson", "karin@test.se"));
        await _context.Customers.AddAsync(TestDataSeeder.CreateCustomer(userId, "Anna", "Andersson", "anna@test.se"));
        await _context.Customers.AddAsync(TestDataSeeder.CreateCustomer(userId, "Bengt", "Andersson", "bengt@test.se"));
        await _context.SaveChangesAsync();

        // When - Hämtar alla kunder
        var result = (await _service.GetAllCustomersAsync(userId)).ToList();

        // Then - Ska vara sorterade efter efternamn, sedan förnamn
        result.Count.ShouldBe(3);
        result[0].LastName.ShouldBe("Andersson");
        result[0].FirstName.ShouldBe("Anna");
        result[1].LastName.ShouldBe("Andersson");
        result[1].FirstName.ShouldBe("Bengt");
        result[2].LastName.ShouldBe("Svensson");
        result[2].FirstName.ShouldBe("Karin");
    }

    [Fact]
    public async Task GetCustomerByIdAsync_MedKorrektUserIdOchId_ReturnearKund()
    {
        // Given - En sparad kund
        var userId = "test-user";
        var customer = TestDataSeeder.CreateCustomer(userId, "Anna", "Andersson", "anna@test.se");
        await _context.Customers.AddAsync(customer);
        await _context.SaveChangesAsync();

        // When - Hämtar kunden med korrekt userId
        var result = await _service.GetCustomerByIdAsync(customer.Id, userId);

        // Then - Ska returnera kunden
        result.ShouldNotBeNull();
        result.FirstName.ShouldBe("Anna");
        result.Email.ShouldBe("anna@test.se");
    }

    [Fact]
    public async Task GetCustomerByIdAsync_MedFelUserId_ReturnearNull()
    {
        // Given - En kund som tillhör user-1
        var userId = "user-1";
        var otherUserId = "user-2";
        var customer = TestDataSeeder.CreateCustomer(userId, "Anna", "Andersson", "anna@test.se");
        await _context.Customers.AddAsync(customer);
        await _context.SaveChangesAsync();

        // When - Försöker hämta med annan användares ID
        var result = await _service.GetCustomerByIdAsync(customer.Id, otherUserId);

        // Then - Ska returnera null (säkerhetsskydd)
        result.ShouldBeNull();
    }

    [Fact]
    public async Task UpdateCustomerAsync_MedGiltigData_UppdaterarKundOchUpdatedat()
    {
        // Given - En sparad kund
        var userId = "test-user";
        var customer = TestDataSeeder.CreateCustomer(userId, "Anna", "Andersson", "anna@test.se");
        await _context.Customers.AddAsync(customer);
        await _context.SaveChangesAsync();
        
        var originalCreatedAt = customer.CreatedAt;
        await Task.Delay(10); // Säkerställ tidsskillnad

        // When - Uppdaterar kundens data
        customer.FirstName = "Annika";
        customer.Email = "annika.andersson@foretag.se";
        var result = await _service.UpdateCustomerAsync(customer, userId);

        // Then - Kunden ska vara uppdaterad
        result.ShouldNotBeNull();
        result.FirstName.ShouldBe("Annika");
        result.Email.ShouldBe("annika.andersson@foretag.se");
        result.CreatedAt.ShouldBe(originalCreatedAt); // CreatedAt ska inte ändras
        result.UpdatedAt.ShouldBeGreaterThan(originalCreatedAt); // UpdatedAt ska uppdateras
    }

    [Fact]
    public async Task UpdateCustomerAsync_MedFelUserId_ReturnearNull()
    {
        // Given - En kund som tillhör user-1
        var userId = "user-1";
        var otherUserId = "user-2";
        var customer = TestDataSeeder.CreateCustomer(userId, "Anna", "Andersson", "anna@test.se");
        await _context.Customers.AddAsync(customer);
        await _context.SaveChangesAsync();
        var customerId = customer.Id;
        
        // Detach för att kunna ladda om från databasen
        _context.Entry(customer).State = Microsoft.EntityFrameworkCore.EntityState.Detached;

        // When - Försöker uppdatera med annan användares ID
        customer.FirstName = "Hacker";
        var result = await _service.UpdateCustomerAsync(customer, otherUserId);

        // Then - Ska returnera null och inte uppdatera
        result.ShouldBeNull();
        
        // Ladda om från databasen för att verifiera att den inte ändrats
        var unchanged = await _context.Customers.FindAsync(customerId);
        unchanged!.FirstName.ShouldBe("Anna"); // Originalet ska vara oförändrat
    }

    [Fact]
    public async Task DeleteCustomerAsync_MedKorrektUserId_TarBortKund()
    {
        // Given - En sparad kund
        var userId = "test-user";
        var customer = TestDataSeeder.CreateCustomer(userId, "Anna", "Andersson", "anna@test.se");
        await _context.Customers.AddAsync(customer);
        await _context.SaveChangesAsync();

        // When - Tar bort kunden
        var result = await _service.DeleteCustomerAsync(customer.Id, userId);

        // Then - Ska returnera true och kunden ska vara borttagen
        result.ShouldBeTrue();
        var deleted = await _context.Customers.FindAsync(customer.Id);
        deleted.ShouldBeNull();
    }

    [Fact]
    public async Task DeleteCustomerAsync_MedFelUserId_ReturnearFalseOchTarInteBoertKund()
    {
        // Given - En kund som tillhör user-1
        var userId = "user-1";
        var otherUserId = "user-2";
        var customer = TestDataSeeder.CreateCustomer(userId, "Anna", "Andersson", "anna@test.se");
        await _context.Customers.AddAsync(customer);
        await _context.SaveChangesAsync();

        // When - Försöker ta bort med annan användares ID
        var result = await _service.DeleteCustomerAsync(customer.Id, otherUserId);

        // Then - Ska returnera false och kunden ska finnas kvar
        result.ShouldBeFalse();
        var stillExists = await _context.Customers.FindAsync(customer.Id);
        stillExists.ShouldNotBeNull();
    }

    [Fact]
    public async Task CustomerExistsAsync_MedExisterandeKund_ReturnearTrue()
    {
        // Given - En sparad kund
        var customer = TestDataSeeder.CreateCustomer("test-user");
        await _context.Customers.AddAsync(customer);
        await _context.SaveChangesAsync();

        // When - Kollar om kunden finns
        var result = await _service.CustomerExistsAsync(customer.Id);

        // Then - Ska returnera true
        result.ShouldBeTrue();
    }

    [Fact]
    public async Task CustomerExistsAsync_MedIckeExisterandeKund_ReturnearFalse()
    {
        // Given - Inget setup (tom databas)

        // When - Kollar om en icke-existerande kund finns
        var result = await _service.CustomerExistsAsync(99999);

        // Then - Ska returnera false
        result.ShouldBeFalse();
    }

    [Fact]
    public async Task CustomerBelongsToUserAsync_NarKundTilloerAnvandare_ReturnearTrue()
    {
        // Given - En kund som tillhör användaren
        var userId = "test-user";
        var customer = TestDataSeeder.CreateCustomer(userId);
        await _context.Customers.AddAsync(customer);
        await _context.SaveChangesAsync();

        // When - Kollar om kunden tillhör användaren
        var result = await _service.CustomerBelongsToUserAsync(customer.Id, userId);

        // Then - Ska returnera true
        result.ShouldBeTrue();
    }

    [Fact]
    public async Task CustomerBelongsToUserAsync_NarKundInTeTilloerAnvandare_ReturnearFalse()
    {
        // Given - En kund som tillhör annan användare
        var customer = TestDataSeeder.CreateCustomer("user-1");
        await _context.Customers.AddAsync(customer);
        await _context.SaveChangesAsync();

        // When - Kollar om kunden tillhör en annan användare
        var result = await _service.CustomerBelongsToUserAsync(customer.Id, "user-2");

        // Then - Ska returnera false
        result.ShouldBeFalse();
    }

    [Fact]
    public async Task SetCustomersUserIdToNullAsync_MedMultiplaKunder_SatterAllaUserIdTillNull()
    {
        // Given - Tre kunder som tillhör samma användare
        var userId = "test-user";
        var customers = TestDataSeeder.CreateMultipleCustomers(userId, 3);
        await _context.Customers.AddRangeAsync(customers);
        await _context.SaveChangesAsync();

        // When - Sätter alla kunders UserId till null
        await _service.SetCustomersUserIdToNullAsync(userId);

        // Then - Alla kunder ska ha UserId = null
        var updatedCustomers = await _service.GetAllCustomersForAdminAsync();
        var userCustomers = updatedCustomers.Where(c => c.Email.Contains("foretag")).ToList();
        
        userCustomers.Count.ShouldBe(3);
        userCustomers.ShouldAllBe(c => c.UserId == null);
    }

    [Fact]
    public async Task GetAllCustomersForAdminAsync_MedMultiplaAnvandare_ReturnearAllaKunder()
    {
        // Given - Kunder från olika användare
        await _context.Customers.AddAsync(TestDataSeeder.CreateCustomer("user-1", "Anna", "Andersson", "anna@test.se"));
        await _context.Customers.AddAsync(TestDataSeeder.CreateCustomer("user-2", "Erik", "Eriksson", "erik@test.se"));
        await _context.SaveChangesAsync();

        // When - Admin hämtar alla kunder
        var result = await _service.GetAllCustomersForAdminAsync();

        // Then - Ska returnera alla kunder oavsett userId
        result.Count().ShouldBeGreaterThanOrEqualTo(2);
    }
}

