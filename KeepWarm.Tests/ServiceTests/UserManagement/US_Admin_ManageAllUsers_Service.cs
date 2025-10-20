using KeepWarm.Services;
using KeepWarm.Models;
using KeepWarm.Tests.Helpers;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.DependencyInjection;
using Shouldly;
using Xunit;

namespace KeepWarm.Tests.ServiceTests.UserManagement;

/// <summary>
/// User Story: Som admin vill jag hantera alla användare för att administrera systemet.
/// </summary>
public class US_Admin_ManageAllUsers_Service : ServiceTestBase
{
    private readonly IIdentityService _identityService;
    private readonly UserManager<ApplicationUser> _userManager;

    public US_Admin_ManageAllUsers_Service()
    {
        _identityService = ServiceProvider.GetRequiredService<IIdentityService>();
        _userManager = ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();
    }

    [Fact]
    public async Task Admin_KanListaAllaAnvändare()
    {
        // Given: Flera användare i systemet
        await CreateUserAsync("user1@example.com", "Password123!");
        await CreateUserAsync("user2@example.com", "Password123!");
        await CreateUserAsync("user3@example.com", "Password123!");

        // When: Admin hämtar alla användare
        var allUsers = _userManager.Users.ToList();

        // Then: Alla användare ska returneras
        allUsers.Count.ShouldBeGreaterThanOrEqualTo(3);
        allUsers.ShouldContain(u => u.Email == "user1@example.com");
        allUsers.ShouldContain(u => u.Email == "user2@example.com");
        allUsers.ShouldContain(u => u.Email == "user3@example.com");
    }

    [Fact]
    public async Task Admin_KanFiltreraAnvändarePerRoll()
    {
        // Given: Användare med olika roller
        var admin1 = await CreateUserAsync("admin1@example.com", "Password123!", role: "Admin");
        var admin2 = await CreateUserAsync("admin2@example.com", "Password123!", role: "Admin");
        var user1 = await CreateUserAsync("user1@example.com", "Password123!", role: "User");
        var user2 = await CreateUserAsync("user2@example.com", "Password123!", role: "User");

        // When: Admin hämtar användare per roll
        var admins = new List<ApplicationUser>();
        var users = new List<ApplicationUser>();

        foreach (var u in _userManager.Users)
        {
            if (await _identityService.IsUserInRoleAsync(u.Id, "Admin"))
                admins.Add(u);
            if (await _identityService.IsUserInRoleAsync(u.Id, "User"))
                users.Add(u);
        }

        // Then: Användarna ska vara korrekt filtrerade
        admins.Count.ShouldBeGreaterThanOrEqualTo(2);
        users.Count.ShouldBeGreaterThanOrEqualTo(2);
        admins.ShouldContain(a => a.Email == "admin1@example.com");
        admins.ShouldContain(a => a.Email == "admin2@example.com");
        users.ShouldContain(u => u.Email == "user1@example.com");
        users.ShouldContain(u => u.Email == "user2@example.com");
    }

    [Fact]
    public async Task Admin_KanSökaAnvändarePerEmail()
    {
        // Given: Flera användare
        await CreateUserAsync("alice@example.com", "Password123!");
        await CreateUserAsync("bob@example.com", "Password123!");
        await CreateUserAsync("charlie@example.com", "Password123!");

        // When: Admin söker efter specifik email
        var found = await _identityService.FindUserByEmailAsync("bob@example.com");

        // Then: Rätt användare ska hittas
        found.ShouldNotBeNull();
        found.Email.ShouldBe("bob@example.com");
    }

    [Fact]
    public async Task Admin_KanSeAntalAnvändare()
    {
        // Given: Ett känt antal användare
        var initialCount = _userManager.Users.Count();

        await CreateUserAsync("user1@example.com", "Password123!");
        await CreateUserAsync("user2@example.com", "Password123!");
        await CreateUserAsync("user3@example.com", "Password123!");

        // When: Admin räknar användare
        var totalUsers = _userManager.Users.Count();

        // Then: Antalet ska vara korrekt
        totalUsers.ShouldBe(initialCount + 3);
    }

    [Fact]
    public async Task Admin_KanHanteraFlereAnvändareSimultant()
    {
        // Given: Flera användare
        var user1 = await CreateUserAsync("user1@example.com", "Password123!", "User1", "First");
        var user2 = await CreateUserAsync("user2@example.com", "Password123!", "User2", "Second");
        var user3 = await CreateUserAsync("user3@example.com", "Password123!", "User3", "Third");

        // When: Admin uppdaterar alla tre
        user1.FirstName = "Updated1";
        user2.FirstName = "Updated2";
        user3.FirstName = "Updated3";

        await _identityService.UpdateUserAsync(user1);
        await _identityService.UpdateUserAsync(user2);
        await _identityService.UpdateUserAsync(user3);

        // Then: Alla uppdateringar ska vara sparade
        var updated1 = await _identityService.FindUserByIdAsync(user1.Id);
        var updated2 = await _identityService.FindUserByIdAsync(user2.Id);
        var updated3 = await _identityService.FindUserByIdAsync(user3.Id);

        updated1!.FirstName.ShouldBe("Updated1");
        updated2!.FirstName.ShouldBe("Updated2");
        updated3!.FirstName.ShouldBe("Updated3");
    }
}
