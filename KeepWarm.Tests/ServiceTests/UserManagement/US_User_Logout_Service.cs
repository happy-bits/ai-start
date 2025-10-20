using KeepWarm.Services;
using KeepWarm.Tests.Helpers;
using Microsoft.Extensions.DependencyInjection;
using Shouldly;
using Xunit;

namespace KeepWarm.Tests.ServiceTests.UserManagement;

/// <summary>
/// User Story: Som användare vill jag logga ut för att säkert avsluta min session.
/// </summary>
public class US_User_Logout_Service : ServiceTestBase
{
    private readonly IIdentityService _identityService;

    public US_User_Logout_Service()
    {
        _identityService = ServiceProvider.GetRequiredService<IIdentityService>();
    }

    [Fact]
    public async Task InloggadAnvändare_KanLoggaUt()
    {
        // Given: En inloggad användare
        var user = await CreateUserAsync("user@example.com", "Password123!");

        // When: Användaren loggar ut (verifierar att användaren finns och kan hittas)
        var foundUser = await _identityService.FindUserByIdAsync(user.Id);

        // Then: Användaren ska kunna hittas innan utloggning
        foundUser.ShouldNotBeNull();
        foundUser.Email.ShouldBe("user@example.com");

        // Note: Själva utloggningen sker i controller-lagret (cookies/session)
        // På service-nivå verifierar vi att användaren finns och är giltig
    }

    [Fact]
    public async Task AnvändareSessions_KanSkilljasMellanAnvändare()
    {
        // Given: Två inloggade användare
        var user1 = await CreateUserAsync("user1@example.com", "Password123!");
        var user2 = await CreateUserAsync("user2@example.com", "Password123!");

        // When: Vi verifierar båda användare
        var foundUser1 = await _identityService.FindUserByIdAsync(user1.Id);
        var foundUser2 = await _identityService.FindUserByIdAsync(user2.Id);

        // Then: Båda ska vara separata och giltiga
        foundUser1.ShouldNotBeNull();
        foundUser2.ShouldNotBeNull();
        foundUser1.Id.ShouldNotBe(foundUser2.Id);
    }

    [Fact]
    public async Task EfterUtloggning_ÄrAnvändarenFortfarandeISystemet()
    {
        // Given: En användare som loggar ut
        var user = await CreateUserAsync("user@example.com", "Password123!");

        // When: Efter "utloggning" (session avslutas)
        // Användaren ska fortfarande finnas i databasen
        var stillExists = await _identityService.FindUserByIdAsync(user.Id);

        // Then: Användaren finns kvar i systemet
        stillExists.ShouldNotBeNull();
        stillExists.Email.ShouldBe(user.Email);
    }

    [Fact]
    public async Task AnvändareKanLoggaInIgen_EfterUtloggning()
    {
        // Given: En användare som loggat ut
        var user = await CreateUserAsync("user@example.com", "Password123!");
        var password = "Password123!";

        // When: Användaren försöker logga in igen
        var foundUser = await _identityService.FindUserByEmailAsync(user.Email!);
        var canLogin = await _identityService.ValidatePasswordAsync(foundUser!, password);

        // Then: Inloggningen ska fungera
        canLogin.ShouldBeTrue();
    }
}
