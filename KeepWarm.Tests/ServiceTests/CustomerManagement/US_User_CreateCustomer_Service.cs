using KeepWarm.Models;
using KeepWarm.Services;
using KeepWarm.Tests.Helpers;
using Microsoft.Extensions.DependencyInjection;
using Shouldly;
using Xunit;

namespace KeepWarm.Tests.ServiceTests.CustomerManagement;

/// <summary>
/// User Story: Som användare vill jag skapa en ny kund för att börja hantera relationen.
/// </summary>
public class US_User_CreateCustomer_Service : ServiceTestBase
{
    private readonly ICustomerService _customerService;

    public US_User_CreateCustomer_Service()
    {
        _customerService = ServiceProvider.GetRequiredService<ICustomerService>();
    }

    [Fact]
    public async Task Användare_KanSkapaNyKund()
    {
        // Given: En användare
        var user = await CreateUserAsync("user@example.com");

        // When: Användaren skapar en ny kund
        var customer = new Customer
        {
            FirstName = "Ny",
            LastName = "Kund",
            Email = "ny.kund@example.com",
            Phone = "+46701234567",
            Address = "Kundgatan 1",
            City = "Stockholm",
            PostalCode = "12345",
            Country = "Sverige",
            UserId = user.Id
        };

        var createdCustomer = await _customerService.CreateCustomerAsync(customer);

        // Then: Kunden ska skapas och tillhöra användaren
        createdCustomer.ShouldNotBeNull();
        createdCustomer.Id.ShouldBeGreaterThan(0);
        createdCustomer.FirstName.ShouldBe("Ny");
        createdCustomer.LastName.ShouldBe("Kund");
        createdCustomer.UserId.ShouldBe(user.Id);

        // Verify: Kunden finns i databasen
        var foundCustomer = await _customerService.GetCustomerByIdAsync(createdCustomer.Id, user.Id);
        foundCustomer.ShouldNotBeNull();
        foundCustomer.Email.ShouldBe("ny.kund@example.com");
    }

    [Fact]
    public async Task SkapaNyKund_SätterCreatedAtOchUpdatedAt()
    {
        // Given: En användare och en ny kund
        var user = await CreateUserAsync("user@example.com");
        var beforeCreate = DateTime.UtcNow;

        var customer = new Customer
        {
            FirstName = "Test",
            LastName = "Kund",
            Email = "test@example.com",
            UserId = user.Id
        };

        // When: Kunden skapas
        var createdCustomer = await _customerService.CreateCustomerAsync(customer);

        // Then: Tidsstämplar ska sättas
        createdCustomer.CreatedAt.ShouldBeGreaterThanOrEqualTo(beforeCreate);
        createdCustomer.UpdatedAt.ShouldBeGreaterThanOrEqualTo(beforeCreate);
        createdCustomer.CreatedAt.ShouldBeGreaterThanOrEqualTo(createdCustomer.UpdatedAt);
    }

    [Fact]
    public async Task FlereAnvändare_KanSkapaKunderMedSammaEmail()
    {
        // Given: Två användare
        var user1 = await CreateUserAsync("user1@example.com");
        var user2 = await CreateUserAsync("user2@example.com");

        var email = "duplicate@example.com";

        // When: Båda användarna skapar kunder med samma email
        var customer1 = await CreateCustomerAsync(user1.Id, "Customer", "One", email);
        var customer2 = await CreateCustomerAsync(user2.Id, "Customer", "Two", email);

        // Then: Båda kunderna ska skapas (ingen unique constraint på email)
        customer1.ShouldNotBeNull();
        customer2.ShouldNotBeNull();
        customer1.Id.ShouldNotBe(customer2.Id);
        customer1.Email.ShouldBe(email);
        customer2.Email.ShouldBe(email);
    }

    [Fact]
    public async Task NySkapadKund_SynsIDatabasen()
    {
        // Given: En användare
        var user = await CreateUserAsync("user@example.com");

        // When: En kund skapas
        var customer = await CreateCustomerAsync(user.Id, "Database", "Test");

        // Then: Kunden ska finnas i databasen
        var dbCustomer = Context.Customers.Find(customer.Id);
        dbCustomer.ShouldNotBeNull();
        dbCustomer.FirstName.ShouldBe("Database");
        dbCustomer.LastName.ShouldBe("Test");
        dbCustomer.UserId.ShouldBe(user.Id);
    }

    [Fact]
    public async Task NySkapadKund_KanHämtasAvÄgare()
    {
        // Given: En användare med en kund
        var user = await CreateUserAsync("user@example.com");
        var customer = await CreateCustomerAsync(user.Id);

        // When: Användaren hämtar kunden
        var retrieved = await _customerService.GetCustomerByIdAsync(customer.Id, user.Id);

        // Then: Kunden ska hittas
        retrieved.ShouldNotBeNull();
        retrieved.Id.ShouldBe(customer.Id);
    }
}
