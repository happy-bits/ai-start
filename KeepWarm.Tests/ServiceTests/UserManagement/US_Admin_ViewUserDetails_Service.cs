using KeepWarm.Services;
using KeepWarm.Tests.Helpers;
using Microsoft.Extensions.DependencyInjection;
using Shouldly;
using Xunit;

namespace KeepWarm.Tests.ServiceTests.UserManagement;

/// <summary>
/// User Story: Som admin vill jag visa användardetaljer för att se användarens information.
/// </summary>
public class US_Admin_ViewUserDetails_Service : ServiceTestBase
{
    private readonly IIdentityService _identityService;

    public US_Admin_ViewUserDetails_Service()
    {
        _identityService = ServiceProvider.GetRequiredService<IIdentityService>();
    }

    [Fact]
    public async Task Admin_KanHämtaAnvändardetaljerViaId()
    {
        // Given: En användare i systemet
        var user = await CreateUserAsync("user@example.com", "Password123!", "John", "Doe");

        // When: Admin hämtar användardetaljer
        var foundUser = await _identityService.FindUserByIdAsync(user.Id);

        // Then: Användardetaljer ska returneras
        foundUser.ShouldNotBeNull();
        foundUser.Id.ShouldBe(user.Id);
        foundUser.Email.ShouldBe("user@example.com");
        foundUser.FirstName.ShouldBe("John");
        foundUser.LastName.ShouldBe("Doe");
    }

    [Fact]
    public async Task Admin_KanHämtaAnvändardetaljerViaEmail()
    {
        // Given: En användare i systemet
        var user = await CreateUserAsync("test@example.com", "Password123!", "Jane", "Smith");

        // When: Admin hämtar användare via email
        var foundUser = await _identityService.FindUserByEmailAsync("test@example.com");

        // Then: Användardetaljer ska returneras
        foundUser.ShouldNotBeNull();
        foundUser.Id.ShouldBe(user.Id);
        foundUser.FirstName.ShouldBe("Jane");
        foundUser.LastName.ShouldBe("Smith");
    }

    [Fact]
    public async Task HämtaIckeExisterandeAnvändare_SkaReturnNull()
    {
        // Given: Inget (ingen användare)

        // When: Admin försöker hämta icke-existerande användare
        var foundUser = await _identityService.FindUserByIdAsync("non-existent-id");

        // Then: Null ska returneras
        foundUser.ShouldBeNull();
    }

    [Fact]
    public async Task Admin_KanSeAnvändarensRoll()
    {
        // Given: En användare med Admin-roll
        var adminUser = await CreateUserAsync("admin@example.com", "Password123!", role: "Admin");
        var normalUser = await CreateUserAsync("user@example.com", "Password123!", role: "User");

        // When: Admin kontrollerar roller
        var adminIsAdmin = await _identityService.IsUserInRoleAsync(adminUser.Id, "Admin");
        var normalIsAdmin = await _identityService.IsUserInRoleAsync(normalUser.Id, "Admin");
        var normalIsUser = await _identityService.IsUserInRoleAsync(normalUser.Id, "User");

        // Then: Rollerna ska vara korrekta
        adminIsAdmin.ShouldBeTrue();
        normalIsAdmin.ShouldBeFalse();
        normalIsUser.ShouldBeTrue();
    }

    [Fact]
    public async Task Admin_KanSeAnvändarensTidsstämplar()
    {
        // Given: En användare i systemet
        var user = await CreateUserAsync("user@example.com", "Password123!");

        // When: Admin hämtar användaren
        var foundUser = await _identityService.FindUserByIdAsync(user.Id);

        // Then: CreatedAt och UpdatedAt ska vara satta
        foundUser.ShouldNotBeNull();
        foundUser.CreatedAt.ShouldNotBe(default(DateTime));
        foundUser.UpdatedAt.ShouldNotBe(default(DateTime));
        foundUser.CreatedAt.ShouldBeLessThanOrEqualTo(foundUser.UpdatedAt);
    }
}
