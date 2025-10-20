using KeepWarm.Services;
using KeepWarm.Tests.Helpers;
using Microsoft.Extensions.DependencyInjection;
using Shouldly;
using Xunit;

namespace KeepWarm.Tests.ServiceTests.CustomerManagement;

/// <summary>
/// User Story: Som användare vill jag ta bort en kund för att rensa bort gamla kontakter.
/// </summary>
public class US_User_DeleteCustomer_Service : ServiceTestBase
{
    private readonly ICustomerService _customerService;

    public US_User_DeleteCustomer_Service()
    {
        _customerService = ServiceProvider.GetRequiredService<ICustomerService>();
    }

    [Fact]
    public async Task Användare_KanTaBortSinaEgnaKunder()
    {
        // Given: En användare med en kund
        var user = await CreateUserAsync("user@example.com");
        var customer = await CreateCustomerAsync(user.Id, "Test", "Customer");

        // When: Användaren tar bort kunden
        var result = await _customerService.DeleteCustomerAsync(customer.Id, user.Id);

        // Then: Borttagningen ska lyckas
        result.ShouldBeTrue();

        // Verify: Kunden finns inte längre
        var deletedCustomer = await _customerService.GetCustomerByIdAsync(customer.Id, user.Id);
        deletedCustomer.ShouldBeNull();
    }

    [Fact]
    public async Task Användare_KanInteTaBortAndraAnvändaresKunder()
    {
        // Given: Två användare med egna kunder
        var user1 = await CreateUserAsync("user1@example.com");
        var user2 = await CreateUserAsync("user2@example.com");
        var user2Customer = await CreateCustomerAsync(user2.Id, "User2", "Customer");

        // When: user1 försöker ta bort user2:s kund
        var result = await _customerService.DeleteCustomerAsync(user2Customer.Id, user1.Id);

        // Then: Borttagningen ska misslyckas
        result.ShouldBeFalse();

        // Verify: Kunden finns fortfarande kvar
        var stillExists = await _customerService.GetCustomerByIdAsync(user2Customer.Id, user2.Id);
        stillExists.ShouldNotBeNull();
    }

    [Fact]
    public async Task TaBortIckeExisterandeKund_SkaReturnFalse()
    {
        // Given: En användare
        var user = await CreateUserAsync("user@example.com");

        // When: Användaren försöker ta bort en kund som inte finns
        var result = await _customerService.DeleteCustomerAsync(99999, user.Id);

        // Then: False ska returneras
        result.ShouldBeFalse();
    }

    [Fact]
    public async Task Admin_KanTaBortAllaKunder()
    {
        // Given: En admin och en användares kund
        var admin = await CreateUserAsync("admin@example.com", role: "Admin");
        var user = await CreateUserAsync("user@example.com");
        var customer = await CreateCustomerAsync(user.Id, "Test", "Customer");

        // When: Admin tar bort kunden
        var result = await _customerService.DeleteCustomerForAdminAsync(customer.Id);

        // Then: Borttagningen ska lyckas
        result.ShouldBeTrue();

        // Verify: Kunden är borttagen
        var deletedCustomer = await _customerService.GetCustomerByIdForAdminAsync(customer.Id);
        deletedCustomer.ShouldBeNull();
    }

    [Fact]
    public async Task BorttagnKund_VisasInteIAnvändarensLista()
    {
        // Given: En användare med två kunder
        var user = await CreateUserAsync("user@example.com");
        var customer1 = await CreateCustomerAsync(user.Id, "Stays", "Customer");
        var customer2 = await CreateCustomerAsync(user.Id, "Deleted", "Customer");

        // When: customer2 tas bort
        await _customerService.DeleteCustomerAsync(customer2.Id, user.Id);

        // Then: Endast customer1 ska finnas i listan
        var customers = await _customerService.GetAllCustomersAsync(user.Id);
        customers.Count().ShouldBe(1);
        customers.First().Id.ShouldBe(customer1.Id);
    }
}
