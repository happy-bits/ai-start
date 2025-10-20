using KeepWarm.Models;
using KeepWarm.Services;
using KeepWarm.Tests.Helpers;
using Microsoft.Extensions.DependencyInjection;
using Shouldly;
using Xunit;

namespace KeepWarm.Tests.ServiceTests.CustomerManagement;

/// <summary>
/// User Story: Som användare vill jag redigera kundinformation för att hålla data aktuell.
/// </summary>
public class US_User_EditCustomer_Service : ServiceTestBase
{
    private readonly ICustomerService _customerService;

    public US_User_EditCustomer_Service()
    {
        _customerService = ServiceProvider.GetRequiredService<ICustomerService>();
    }

    [Fact]
    public async Task Användare_KanUppdateraSinEgenKund()
    {
        // Given: En användare med en befintlig kund
        var user = await CreateUserAsync("user@example.com");
        var customer = await CreateCustomerAsync(user.Id, "Anna", "Karlsson", "anna@ex.com", "+461234567");

        // When: Användaren uppdaterar kundens data
        customer.FirstName = "Annika";
        customer.LastName = "Carlsson";
        customer.Email = "annika.carlsson@example.com";
        customer.Phone = "+469876543";
        customer.Address = "Nya gatan 2";
        customer.City = "Göteborg";
        customer.PostalCode = "41111";
        customer.Country = "Sverige";

        var updated = await _customerService.UpdateCustomerAsync(customer, user.Id);

        // Then: Uppdateringen ska lyckas och värden ska vara uppdaterade
        updated.ShouldNotBeNull();
        updated!.FirstName.ShouldBe("Annika");
        updated.LastName.ShouldBe("Carlsson");
        updated.Email.ShouldBe("annika.carlsson@example.com");
        updated.Phone.ShouldBe("+469876543");
        updated.Address.ShouldBe("Nya gatan 2");
        updated.City.ShouldBe("Göteborg");
        updated.PostalCode.ShouldBe("41111");
        updated.Country.ShouldBe("Sverige");
        updated.UserId.ShouldBe(user.Id);
        updated.UpdatedAt.ShouldBeGreaterThanOrEqualTo(updated.CreatedAt);
    }

    [Fact]
    public async Task Användare_KanInteUppdateraAndraAnvändaresKund()
    {
        // Given: Två användare och en kund som tillhör user2
        var user1 = await CreateUserAsync("user1@example.com");
        var user2 = await CreateUserAsync("user2@example.com");
        var user2Customer = await CreateCustomerAsync(user2.Id, "User2", "Customer");

        // When: user1 försöker uppdatera user2:s kund
        user2Customer.FirstName = "Hacker";
        var updated = await _customerService.UpdateCustomerAsync(user2Customer, user1.Id);

        // Then: Uppdateringen ska misslyckas (null)
        updated.ShouldBeNull();
    }

    [Fact]
    public async Task UppdateringAvIckeExisterandeKund_ReturnerarNull()
    {
        // Given: En användare och en kund som inte finns i databasen
        var user = await CreateUserAsync("user@example.com");
        var ghost = new Customer
        {
            Id = 99999,
            FirstName = "Ghost",
            LastName = "Customer",
            Email = "ghost@example.com",
            UserId = user.Id
        };

        // When: Användaren försöker uppdatera
        var updated = await _customerService.UpdateCustomerAsync(ghost, user.Id);

        // Then: Null ska returneras
        updated.ShouldBeNull();
    }

    [Fact]
    public async Task Uppdatering_SkaÄndraUpdatedAt()
    {
        // Given: En användare och en kund
        var user = await CreateUserAsync("user@example.com");
        var customer = await CreateCustomerAsync(user.Id, "Before", "Update");
        var originalUpdatedAt = customer.UpdatedAt;

        // When: Kunden uppdateras
        await Task.Delay(5);
        customer.FirstName = "After";
        var updated = await _customerService.UpdateCustomerAsync(customer, user.Id);

        // Then: UpdatedAt ska vara senare
        updated.ShouldNotBeNull();
        updated!.UpdatedAt.ShouldBeGreaterThan(originalUpdatedAt);
    }
}


