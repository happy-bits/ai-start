using KeepWarm.Services;
using KeepWarm.Tests.Helpers;
using Microsoft.Extensions.DependencyInjection;
using Shouldly;
using Xunit;

namespace KeepWarm.Tests.ServiceTests.CustomerManagement;

/// <summary>
/// User Story: Som användare vill jag visa kunddetaljer för att se kundens information.
/// </summary>
public class US_User_ViewCustomerDetails_Service : ServiceTestBase
{
    private readonly ICustomerService _customerService;

    public US_User_ViewCustomerDetails_Service()
    {
        _customerService = ServiceProvider.GetRequiredService<ICustomerService>();
    }

    [Fact]
    public async Task Användare_KanHämtaSinaKunddetaljer()
    {
        // Given: En användare med en kund
        var user = await CreateUserAsync("user@example.com");
        var customer = await CreateCustomerAsync(user.Id, "John", "Doe", "john@customer.com", "555-1234");

        // When: Användaren hämtar kunddetaljer
        var foundCustomer = await _customerService.GetCustomerByIdAsync(customer.Id, user.Id);

        // Then: Kunddetaljer ska returneras
        foundCustomer.ShouldNotBeNull();
        foundCustomer.Id.ShouldBe(customer.Id);
        foundCustomer.FirstName.ShouldBe("John");
        foundCustomer.LastName.ShouldBe("Doe");
        foundCustomer.Email.ShouldBe("john@customer.com");
        foundCustomer.Phone.ShouldBe("555-1234");
        foundCustomer.UserId.ShouldBe(user.Id);
    }

    [Fact]
    public async Task Användare_KanInteSe_AndraAnvändaresKunddetaljer()
    {
        // Given: Två användare med egna kunder
        var user1 = await CreateUserAsync("user1@example.com");
        var user2 = await CreateUserAsync("user2@example.com");
        var user2Customer = await CreateCustomerAsync(user2.Id, "Jane", "Smith");

        // When: user1 försöker hämta user2:s kund
        var foundCustomer = await _customerService.GetCustomerByIdAsync(user2Customer.Id, user1.Id);

        // Then: Null ska returneras (data-isolering)
        foundCustomer.ShouldBeNull();
    }

    [Fact]
    public async Task HämtaIckeExisterandeKund_SkaReturnNull()
    {
        // Given: En användare
        var user = await CreateUserAsync("user@example.com");

        // When: Användaren försöker hämta icke-existerande kund
        var foundCustomer = await _customerService.GetCustomerByIdAsync(99999, user.Id);

        // Then: Null ska returneras
        foundCustomer.ShouldBeNull();
    }

    [Fact]
    public async Task Kunddetaljer_InkluderarTidsstämplar()
    {
        // Given: En användare med en kund
        var user = await CreateUserAsync("user@example.com");
        var customer = await CreateCustomerAsync(user.Id, "Test", "Customer");

        // When: Användaren hämtar kunden
        var foundCustomer = await _customerService.GetCustomerByIdAsync(customer.Id, user.Id);

        // Then: CreatedAt och UpdatedAt ska vara satta
        foundCustomer.ShouldNotBeNull();
        foundCustomer.CreatedAt.ShouldNotBe(default(DateTime));
        foundCustomer.UpdatedAt.ShouldNotBe(default(DateTime));
        foundCustomer.CreatedAt.ShouldBeLessThanOrEqualTo(foundCustomer.UpdatedAt);
    }

    [Fact]
    public async Task Admin_KanSeAllaKunddetaljer()
    {
        // Given: En admin och en användares kund
        var admin = await CreateUserAsync("admin@example.com", role: "Admin");
        var user = await CreateUserAsync("user@example.com");
        var customer = await CreateCustomerAsync(user.Id, "Test", "Customer");

        // When: Admin hämtar kunden
        var foundCustomer = await _customerService.GetCustomerByIdForAdminAsync(customer.Id);

        // Then: Kunden ska returneras
        foundCustomer.ShouldNotBeNull();
        foundCustomer.Id.ShouldBe(customer.Id);
        foundCustomer.UserId.ShouldBe(user.Id);
    }
}
