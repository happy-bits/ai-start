using KeepWarm.Services;
using KeepWarm.Tests.Helpers;
using Microsoft.Extensions.DependencyInjection;
using Shouldly;
using Xunit;

namespace KeepWarm.Tests.ServiceTests.UserManagement;

/// <summary>
/// User Story: Som admin vill jag redigera användarinformation för att hålla data aktuell.
/// </summary>
public class US_Admin_EditUser_Service : ServiceTestBase
{
    private readonly IIdentityService _identityService;

    public US_Admin_EditUser_Service()
    {
        _identityService = ServiceProvider.GetRequiredService<IIdentityService>();
    }

    [Fact]
    public async Task Admin_KanRedigeraAnvändarinformation()
    {
        // Given: En användare med ursprunglig information
        var user = await CreateUserAsync("user@example.com", "Password123!", "Gamla", "Namnet");

        // When: Admin uppdaterar användarinformation
        user.FirstName = "Nya";
        user.LastName = "Namnet";
        var result = await _identityService.UpdateUserAsync(user);

        // Then: Uppdateringen ska lyckas
        result.ShouldBeTrue();

        // Verify: Användaren har uppdaterad information
        var updatedUser = await _identityService.FindUserByIdAsync(user.Id);
        updatedUser.ShouldNotBeNull();
        updatedUser.FirstName.ShouldBe("Nya");
        updatedUser.LastName.ShouldBe("Namnet");
    }

    [Fact]
    public async Task Admin_KanÄndraAnvändarensEmail()
    {
        // Given: En användare med ett email
        var user = await CreateUserAsync("old@example.com", "Password123!");

        // When: Admin ändrar emailen
        user.Email = "new@example.com";
        user.UserName = "new@example.com"; // Username måste också uppdateras
        var result = await _identityService.UpdateUserAsync(user);

        // Then: Uppdateringen ska lyckas
        result.ShouldBeTrue();

        // Verify: Användaren kan hittas med nya emailen
        var updatedUser = await _identityService.FindUserByEmailAsync("new@example.com");
        updatedUser.ShouldNotBeNull();
        updatedUser.Id.ShouldBe(user.Id);
    }

    [Fact]
    public async Task Admin_KanÄndraAnvändarensRoll()
    {
        // Given: En vanlig användare
        var user = await CreateUserAsync("user@example.com", "Password123!", role: "User");

        // When: Admin ändrar rollen till Admin
        var removed = await _identityService.RemoveRoleFromUserAsync(user.Id, "User");
        var added = await _identityService.AssignRoleToUserAsync(user.Id, "Admin");

        // Then: Rollbytet ska lyckas
        removed.ShouldBeTrue();
        added.ShouldBeTrue();

        // Verify: Användaren har nu Admin-rollen
        var isUser = await _identityService.IsUserInRoleAsync(user.Id, "User");
        var isAdmin = await _identityService.IsUserInRoleAsync(user.Id, "Admin");

        isUser.ShouldBeFalse();
        isAdmin.ShouldBeTrue();
    }

    [Fact]
    public async Task RedigeraAnvändare_UppdaterarUpdatedAt()
    {
        // Given: En användare
        var user = await CreateUserAsync("user@example.com", "Password123!");
        var originalUpdatedAt = user.UpdatedAt;

        // When: Admin uppdaterar användaren
        await Task.Delay(10); // Små fördröjning för att säkerställa ny tidsstämpel
        user.FirstName = "Uppdaterat";
        var result = await _identityService.UpdateUserAsync(user);

        // Then: UpdatedAt ska ha ändrats
        result.ShouldBeTrue();
        var updatedUser = await _identityService.FindUserByIdAsync(user.Id);
        updatedUser!.UpdatedAt.ShouldBeGreaterThan(originalUpdatedAt);
    }

    [Fact]
    public async Task Admin_KanRedigeraFlereAnvändareOberoende()
    {
        // Given: Tre användare
        var user1 = await CreateUserAsync("user1@example.com", "Password123!", "User", "One");
        var user2 = await CreateUserAsync("user2@example.com", "Password123!", "User", "Two");
        var user3 = await CreateUserAsync("user3@example.com", "Password123!", "User", "Three");

        // When: Admin uppdaterar endast user2
        user2.FirstName = "Updated";
        await _identityService.UpdateUserAsync(user2);

        // Then: Endast user2 ska vara uppdaterad
        var updated1 = await _identityService.FindUserByIdAsync(user1.Id);
        var updated2 = await _identityService.FindUserByIdAsync(user2.Id);
        var updated3 = await _identityService.FindUserByIdAsync(user3.Id);

        updated1!.FirstName.ShouldBe("User");
        updated2!.FirstName.ShouldBe("Updated");
        updated3!.FirstName.ShouldBe("User");
    }
}
