using KeepWarm.Services;
using KeepWarm.Tests.Helpers;
using Microsoft.Extensions.DependencyInjection;
using Shouldly;
using Xunit;

namespace KeepWarm.Tests.ServiceTests.UserManagement;

/// <summary>
/// User Story: Som admin vill jag ta bort användare för att hantera åtkomst.
/// </summary>
public class US_Admin_DeleteUser_Service : ServiceTestBase
{
    private readonly IIdentityService _identityService;

    public US_Admin_DeleteUser_Service()
    {
        _identityService = ServiceProvider.GetRequiredService<IIdentityService>();
    }

    [Fact]
    public async Task Admin_KanTaBortAnvändare()
    {
        // Given: En användare att ta bort
        var userToDelete = await CreateUserAsync("delete@example.com");

        // When: Admin tar bort användaren
        var result = await _identityService.DeleteUserAsync(userToDelete.Id);

        // Then: Borttagningen ska lyckas
        result.ShouldBeTrue();

        // Verify: Användaren är borttagen
        var deletedUser = await _identityService.FindUserByIdAsync(userToDelete.Id);
        deletedUser.ShouldBeNull();
    }

    [Fact]
    public async Task NärAnvändareTasBort_SkaKundernasUserIdSättasTillNull()
    {
        // Given: En användare med kunder
        var user = await CreateUserAsync("user@example.com");
        var customer1 = await CreateCustomerAsync(user.Id, "Customer", "One");
        var customer2 = await CreateCustomerAsync(user.Id, "Customer", "Two");

        // When: Användaren tas bort och kunder uppdateras
        await _identityService.DeleteUserAsync(user.Id);

        // Then: Kunderna ska finnas kvar men UserId ska vara null
        var remainingCustomer1 = Context.Customers.Find(customer1.Id);
        var remainingCustomer2 = Context.Customers.Find(customer2.Id);

        remainingCustomer1.ShouldNotBeNull();
        remainingCustomer1.UserId.ShouldBeNull();

        remainingCustomer2.ShouldNotBeNull();
        remainingCustomer2.UserId.ShouldBeNull();
    }

    [Fact]
    public async Task TaBortIckeExisterandeAnvändare_SkaReturnFalse()
    {
        // Given: Inget (ingen användare)

        // When: Försök att ta bort icke-existerande användare
        var result = await _identityService.DeleteUserAsync("non-existent-id");

        // Then: False ska returneras
        result.ShouldBeFalse();
    }

    [Fact]
    public async Task BorttagnAnvändare_KanInteLoggaIn()
    {
        // Given: En användare
        var user = await CreateUserAsync("user@example.com", "Password123!");

        // When: Användaren tas bort
        await _identityService.DeleteUserAsync(user.Id);

        // Then: Användaren kan inte hittas för inloggning
        var foundUser = await _identityService.FindUserByEmailAsync("user@example.com");
        foundUser.ShouldBeNull();
    }

    [Fact]
    public async Task FlereAnvändare_KanTasBortOberoende()
    {
        // Given: Tre användare
        var user1 = await CreateUserAsync("user1@example.com");
        var user2 = await CreateUserAsync("user2@example.com");
        var user3 = await CreateUserAsync("user3@example.com");

        // When: user2 tas bort
        await _identityService.DeleteUserAsync(user2.Id);

        // Then: user1 och user3 ska finnas kvar, user2 ska vara borttagen
        var foundUser1 = await _identityService.FindUserByIdAsync(user1.Id);
        var foundUser2 = await _identityService.FindUserByIdAsync(user2.Id);
        var foundUser3 = await _identityService.FindUserByIdAsync(user3.Id);

        foundUser1.ShouldNotBeNull();
        foundUser2.ShouldBeNull();
        foundUser3.ShouldNotBeNull();
    }
}
