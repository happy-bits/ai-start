using KeepWarm.Services;
using KeepWarm.Tests.Helpers;
using Microsoft.Extensions.DependencyInjection;
using Shouldly;
using Xunit;

namespace KeepWarm.Tests.ServiceTests.CustomerManagement;

/// <summary>
/// User Story: Som admin vill jag se alla kunder i systemet för att ha full översikt.
/// </summary>
public class US_Admin_ViewAllCustomers_Service : ServiceTestBase
{
    private readonly ICustomerService _customerService;

    public US_Admin_ViewAllCustomers_Service()
    {
        _customerService = ServiceProvider.GetRequiredService<ICustomerService>();
    }

    [Fact]
    public async Task Admin_SerAllaKunder()
    {
        // Given: Två användare med flera kunder samt en admin
        var admin = await CreateUserAsync("admin@example.com", role: "Admin");
        var user1 = await CreateUserAsync("user1@example.com");
        var user2 = await CreateUserAsync("user2@example.com");

        await CreateCustomerAsync(user1.Id, "U1", "C1");
        await CreateCustomerAsync(user1.Id, "U1", "C2");
        await CreateCustomerAsync(user2.Id, "U2", "C1");

        // When: Admin hämtar alla kunder
        var all = await _customerService.GetAllCustomersForAdminAsync();

        // Then: Alla 3 kunder ska returneras
        all.Count().ShouldBe(3);
    }

    [Fact]
    public async Task Admin_SerTomListaNärIngaKunderFinns()
    {
        // Given: En admin och inga kunder
        var admin = await CreateUserAsync("admin@example.com", role: "Admin");

        // When: Admin hämtar alla kunder
        var all = await _customerService.GetAllCustomersForAdminAsync();

        // Then: Tom lista
        all.ShouldBeEmpty();
    }

    [Fact]
    public async Task NyskapadKund_SynsIDirektIAdminListan()
    {
        // Given: Admin och en användare som skapar kund
        var admin = await CreateUserAsync("admin@example.com", role: "Admin");
        var user = await CreateUserAsync("user@example.com");

        await CreateCustomerAsync(user.Id, "Fresh", "Customer");

        // When: Admin hämtar alla kunder
        var all = await _customerService.GetAllCustomersForAdminAsync();

        // Then: Minst en kund och rätt namn finns
        all.Any(c => c.FirstName == "Fresh" && c.LastName == "Customer").ShouldBeTrue();
    }
}


