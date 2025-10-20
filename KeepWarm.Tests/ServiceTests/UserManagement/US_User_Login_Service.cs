using KeepWarm.Services;
using KeepWarm.Tests.Helpers;
using Microsoft.Extensions.DependencyInjection;
using Shouldly;
using Xunit;

namespace KeepWarm.Tests.ServiceTests.UserManagement;

/// <summary>
/// User Story: Som användare vill jag logga in för att komma åt mina kunder.
/// Service-level tester som testar business logic direkt.
/// </summary>
public class US_User_Login_Service : ServiceTestBase
{
    private readonly IIdentityService _identityService;

    public US_User_Login_Service()
    {
        _identityService = ServiceProvider.GetRequiredService<IIdentityService>();
    }

    [Fact]
    public async Task GiltigAnvändare_KanSkapasOchHittas()
    {
        // Given: En ny användare skapas
        var email = "test@example.com";
        var password = "Test123!";
        var user = await CreateUserAsync(email, password);

        // When: Vi söker efter användaren
        var foundUser = await _identityService.FindUserByEmailAsync(email);

        // Then: Användaren ska hittas och ha korrekt data
        foundUser.ShouldNotBeNull();
        foundUser.Email.ShouldBe(email);
        foundUser.Id.ShouldBe(user.Id);
    }

    [Fact]
    public async Task GiltigLösenord_KanValideras()
    {
        // Given: En användare med känt lösenord
        var email = "test@example.com";
        var password = "Test123!";
        var user = await CreateUserAsync(email, password);

        // When: Vi validerar lösenordet
        var isValid = await _identityService.ValidatePasswordAsync(user, password);

        // Then: Valideringen ska lyckas
        isValid.ShouldBeTrue();
    }

    [Fact]
    public async Task FelaktigtLösenord_SkaInteValideras()
    {
        // Given: En användare med känt lösenord
        var email = "test@example.com";
        var password = "Test123!";
        var user = await CreateUserAsync(email, password);

        // When: Vi försöker validera med fel lösenord
        var isValid = await _identityService.ValidatePasswordAsync(user, "WrongPassword123!");

        // Then: Valideringen ska misslyckas
        isValid.ShouldBeFalse();
    }

    [Fact]
    public async Task IckeExisterandeAnvändare_KanInteHittas()
    {
        // Given: Ingen användare skapad

        // When: Vi söker efter en icke-existerande användare
        var user = await _identityService.FindUserByEmailAsync("nonexistent@example.com");

        // Then: Ingen användare ska hittas
        user.ShouldBeNull();
    }

    [Fact]
    public async Task AnvändareRoller_KanKontrolleras()
    {
        // Given: En användare med User-roll
        var user = await CreateUserAsync("user@example.com", role: "User");

        // When: Vi kontrollerar rollen
        var isUser = await _identityService.IsUserInRoleAsync(user.Id, "User");
        var isAdmin = await _identityService.IsUserInRoleAsync(user.Id, "Admin");

        // Then: Användaren ska vara User men inte Admin
        isUser.ShouldBeTrue();
        isAdmin.ShouldBeFalse();
    }
}
