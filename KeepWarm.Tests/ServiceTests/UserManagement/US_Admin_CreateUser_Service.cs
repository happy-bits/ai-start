using KeepWarm.Services;
using KeepWarm.Tests.Helpers;
using Microsoft.Extensions.DependencyInjection;
using Shouldly;
using Xunit;

namespace KeepWarm.Tests.ServiceTests.UserManagement;

/// <summary>
/// User Story: Som admin vill jag skapa nya användare för att ge dem åtkomst till systemet.
/// </summary>
public class US_Admin_CreateUser_Service : ServiceTestBase
{
    private readonly IIdentityService _identityService;

    public US_Admin_CreateUser_Service()
    {
        _identityService = ServiceProvider.GetRequiredService<IIdentityService>();
    }

    [Fact]
    public async Task Admin_KanSkapaNyAnvändare()
    {
        // Given: En admin (implicit - vi testar bara service-funktionen)
        var email = "newuser@example.com";
        var firstName = "Ny";
        var lastName = "Användare";
        var password = "NewUser123!";

        // When: Admin skapar en ny användare
        var user = await CreateUserAsync(email, password, firstName, lastName);

        // Then: Användaren ska finnas i systemet
        user.ShouldNotBeNull();
        user.Email.ShouldBe(email);
        user.FirstName.ShouldBe(firstName);
        user.LastName.ShouldBe(lastName);

        // Verify: Användaren kan hittas via service
        var foundUser = await _identityService.FindUserByEmailAsync(email);
        foundUser.ShouldNotBeNull();
        foundUser.Id.ShouldBe(user.Id);
    }

    [Fact]
    public async Task SkapaNyAnvändare_MedOgiltigEmail_SkaGeMisslyckat()
    {
        // Given: Ogiltigt email
        var user = new Models.ApplicationUser
        {
            UserName = "invalid-email",
            Email = "invalid-email",  // Ogiltigt format
            FirstName = "Test",
            LastName = "User"
        };

        // When: Försök att skapa användare med ogiltigt email
        var result = await UserManager.CreateAsync(user, "Test123!");

        // Then: Skapandet ska misslyckas
        result.Succeeded.ShouldBeFalse();
        result.Errors.ShouldNotBeEmpty();
    }

    [Fact]
    public async Task SkapaNyAnvändare_MedFörKortLösenord_SkaGeMisslyckat()
    {
        // Given: För kort lösenord
        var user = new Models.ApplicationUser
        {
            UserName = "test@example.com",
            Email = "test@example.com",
            FirstName = "Test",
            LastName = "User"
        };

        // When: Försök att skapa användare med för kort lösenord
        var result = await UserManager.CreateAsync(user, "123");

        // Then: Skapandet ska misslyckas
        result.Succeeded.ShouldBeFalse();
        result.Errors.Any(e => e.Code.Contains("Password")).ShouldBeTrue();
    }

    [Fact]
    public async Task SkapaNyAnvändare_MedDuplicatEmail_SkaGeMisslyckat()
    {
        // Given: En befintlig användare
        var email = "existing@example.com";
        await CreateUserAsync(email);

        // When: Försök att skapa en till användare med samma email
        var user = new Models.ApplicationUser
        {
            UserName = email,
            Email = email,
            FirstName = "Another",
            LastName = "User"
        };
        var result = await UserManager.CreateAsync(user, "Test123!");

        // Then: Skapandet ska misslyckas
        result.Succeeded.ShouldBeFalse();
        result.Errors.Any(e => e.Code.Contains("Duplicate")).ShouldBeTrue();
    }

    [Fact]
    public async Task NySkapadAnvändare_KanTilldelasRoll()
    {
        // Given: En nyskapad användare
        var user = await CreateUserAsync("user@example.com");

        // When: Användaren tilldelas Admin-roll
        var assigned = await _identityService.AssignRoleToUserAsync(user.Id, "Admin");

        // Then: Rolltilldelningen ska lyckas
        assigned.ShouldBeTrue();

        var isAdmin = await _identityService.IsUserInRoleAsync(user.Id, "Admin");
        isAdmin.ShouldBeTrue();
    }
}
