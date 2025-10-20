using KeepWarm.Services;
using KeepWarm.Tests.Helpers;
using Microsoft.Extensions.DependencyInjection;
using Shouldly;
using Xunit;

namespace KeepWarm.Tests.ServiceTests.CustomerManagement;

/// <summary>
/// User Story: Som användare vill jag lista mina kunder sorterade på återkomstdatum för att se vilka som behöver uppföljning.
/// </summary>
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
        await CreateCustomerAsync(user2.Id, "Customer2", "FromUser2");

        // When: user1 hämtar sina kunder
        var user1Customers = await _customerService.GetAllCustomersAsync(user1.Id);

        // Then: user1 ser endast sina 3 kunder
        user1Customers.Count().ShouldBe(3);
        user1Customers.All(c => c.UserId == user1.Id).ShouldBeTrue();
        user1Customers.All(c => c.LastName == "FromUser1").ShouldBeTrue();
    }

    [Fact]
    public async Task Användare_SerInteAndraAnvändaresKunder()
    {
        // Given: Två användare med kunder
        var user1 = await CreateUserAsync("user1@example.com");
        var user2 = await CreateUserAsync("user2@example.com");

        await CreateCustomerAsync(user1.Id, "User1", "Customer");
        await CreateCustomerAsync(user2.Id, "User2", "Customer");

        // When: user1 hämtar sina kunder
        var user1Customers = await _customerService.GetAllCustomersAsync(user1.Id);

        // Then: user1 ser inte user2:s kunder
        user1Customers.Count().ShouldBe(1);
        user1Customers.First().FirstName.ShouldBe("User1");
        user1Customers.Any(c => c.FirstName == "User2").ShouldBeFalse();
    }

    [Fact]
    public async Task AnvändareMedIngaKunder_FårTomLista()
    {
        // Given: Användare utan kunder
        var user = await CreateUserAsync("user@example.com");

        // When: Användaren hämtar sina kunder
        var customers = await _customerService.GetAllCustomersAsync(user.Id);

        // Then: Tom lista returneras
        customers.ShouldBeEmpty();
    }

    [Fact]
    public async Task Admin_KanSeAllaKunder()
    {
        // Given: En admin och flera användare med kunder
        var admin = await CreateUserAsync("admin@example.com", role: "Admin");
        var user1 = await CreateUserAsync("user1@example.com");
        var user2 = await CreateUserAsync("user2@example.com");

        await CreateCustomerAsync(user1.Id, "Customer1", "FromUser1");
        await CreateCustomerAsync(user1.Id, "Customer2", "FromUser1");
        await CreateCustomerAsync(user2.Id, "Customer1", "FromUser2");

        // When: Admin hämtar alla kunder
        var allCustomers = await _customerService.GetAllCustomersForAdminAsync();

        // Then: Alla 3 kunder ska visas
        allCustomers.Count().ShouldBe(3);
    }

    [Fact]
    public async Task FlyttadeKunder_VisasInteIAnvändarensLista()
    {
        // Given: Användare med kunder där en kund inte längre tillhör användaren
        var user1 = await CreateUserAsync("user1@example.com");
        var user2 = await CreateUserAsync("user2@example.com");

        var customer1 = await CreateCustomerAsync(user1.Id, "Stays", "WithUser1");
        var customer2 = await CreateCustomerAsync(user1.Id, "Moves", "ToUser2");

        // When: customer2 flyttas till user2
        customer2.UserId = user2.Id;
        Context.Update(customer2);
        await Context.SaveChangesAsync();

        var user1Customers = await _customerService.GetAllCustomersAsync(user1.Id);

        // Then: user1 ser endast customer1
        user1Customers.Count().ShouldBe(1);
        user1Customers.First().Id.ShouldBe(customer1.Id);
    }
}
