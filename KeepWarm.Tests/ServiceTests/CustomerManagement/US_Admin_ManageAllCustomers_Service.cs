using KeepWarm.Models;
using KeepWarm.Services;
using KeepWarm.Tests.Helpers;
using Microsoft.Extensions.DependencyInjection;
using Shouldly;
using Xunit;

namespace KeepWarm.Tests.ServiceTests.CustomerManagement;

/// <summary>
/// User Story: Som admin vill jag hantera alla kunder för att kunna hjälpa användare.
/// </summary>
public class US_Admin_ManageAllCustomers_Service : ServiceTestBase
{
    private readonly ICustomerService _customerService;

    public US_Admin_ManageAllCustomers_Service()
    {
        _customerService = ServiceProvider.GetRequiredService<ICustomerService>();
    }

    [Fact]
    public async Task Admin_KanUppdateraVemsSomHelstKund()
    {
        // Given: En admin och en användares kund
        var admin = await CreateUserAsync("admin@example.com", role: "Admin");
        var user = await CreateUserAsync("user@example.com");
        var customer = await CreateCustomerAsync(user.Id, "Old", "Name");

        // When: Admin uppdaterar kundens data
        customer.FirstName = "New";
        customer.LastName = "Name";
        customer.Email = "new.name@example.com";
        customer.Phone = "+46111222";
        customer.Address = "Adminvägen 1";
        customer.City = "Malmö";
        customer.PostalCode = "21121";

        var updated = await _customerService.UpdateCustomerForAdminAsync(customer);

        // Then: Uppdateringen lyckas
        updated.ShouldNotBeNull();
        updated!.FirstName.ShouldBe("New");
        updated.Email.ShouldBe("new.name@example.com");
        updated.City.ShouldBe("Malmö");
        updated.UpdatedAt.ShouldBeGreaterThanOrEqualTo(updated.CreatedAt);
    }

    [Fact]
    public async Task Admin_KanTaBortVemsSomHelstKund()
    {
        // Given: En admin och en användares kund
        var admin = await CreateUserAsync("admin@example.com", role: "Admin");
        var user = await CreateUserAsync("user@example.com");
        var customer = await CreateCustomerAsync(user.Id, "To", "Remove");

        // When: Admin tar bort kunden
        var result = await _customerService.DeleteCustomerForAdminAsync(customer.Id);

        // Then: Borttagningen ska lyckas och kunden ska vara borta
        result.ShouldBeTrue();
        var found = await _customerService.GetCustomerByIdForAdminAsync(customer.Id);
        found.ShouldBeNull();
    }

    [Fact]
    public async Task Admin_KanTaÖverKundÄgarskap_ViaSetUserIdTillNull()
    {
        // Given: En admin och en användares kund
        var admin = await CreateUserAsync("admin@example.com", role: "Admin");
        var user = await CreateUserAsync("user@example.com");
        var customer = await CreateCustomerAsync(user.Id, "Reassign", "Me");

        // When: Admin neutraliserar ägarskap (t.ex. innan reassignment)
        await _customerService.SetCustomersUserIdToNullAsync(user.Id);

        // Then: Kunden ska inte längre tillhöra användaren
        var updatedEntity = await _customerService.GetCustomerByIdForAdminAsync(customer.Id);
        updatedEntity.ShouldNotBeNull();
        updatedEntity!.UserId.ShouldBeNull();
    }

    [Fact]
    public async Task Admin_UppdateringAvIckeExisterandeKund_ReturnerarNull()
    {
        // Given: En admin och en kund som inte finns
        var admin = await CreateUserAsync("admin@example.com", role: "Admin");
        var ghost = new Customer { Id = 99999, FirstName = "Ghost", LastName = "Customer" };

        // When: Admin försöker uppdatera
        var updated = await _customerService.UpdateCustomerForAdminAsync(ghost);

        // Then: Null
        updated.ShouldBeNull();
    }
}


