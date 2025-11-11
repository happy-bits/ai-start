using KeepWarm.Models;
using KeepWarm.Services;
using KeepWarm.Tests.Helpers;
using Microsoft.Extensions.DependencyInjection;
using Shouldly;
using Xunit;

namespace KeepWarm.Tests.ServiceTests.InteractionManagement;

/// <summary>
/// User Story: Som admin vill jag se alla interaktioner för vilken kund som helst för att ha full synlighet.
/// </summary>
public class US_Admin_ViewAllInteractions_Service : ServiceTestBase
{
    private readonly IInteractionService _interactionService;

    public US_Admin_ViewAllInteractions_Service()
    {
        _interactionService = ServiceProvider.GetRequiredService<IInteractionService>();
    }

    [Fact]
    public async Task Admin_KanSeAllaInteraktionerFörKund()
    {
        // Given: En admin och en användare med en kund och flera interaktioner från olika användare
        var admin = await CreateUserAsync("admin@example.com", role: "Admin");
        var user1 = await CreateUserAsync("user1@example.com");
        var user2 = await CreateUserAsync("user2@example.com");
        var customer = await CreateCustomerAsync(user1.Id, "Shared", "Customer");
        var user1Interaction = await CreateInteractionAsync(customer.Id, user1.Id, InteractionType.Call, notes: "User1 call");
        var user2Interaction = await CreateInteractionAsync(customer.Id, user2.Id, InteractionType.Email, notes: "User2 email");

        // When: Admin hämtar alla interaktioner för kunden
        var interactions = await _interactionService.GetInteractionsByCustomerIdForAdminAsync(customer.Id);

        // Then: Alla interaktioner ska returneras
        interactions.ShouldNotBeNull();
        interactions.Count().ShouldBe(2);
        interactions.ShouldContain(i => i.Id == user1Interaction.Id);
        interactions.ShouldContain(i => i.Id == user2Interaction.Id);
    }

    [Fact]
    public async Task Admin_KanHämtaVilkenInteraktionSomHelst()
    {
        // Given: En admin och en användare med en interaktion
        var admin = await CreateUserAsync("admin@example.com", role: "Admin");
        var user = await CreateUserAsync("user@example.com");
        var customer = await CreateCustomerAsync(user.Id, "Test", "Customer");
        var interaction = await CreateInteractionAsync(customer.Id, user.Id, InteractionType.Meeting, notes: "User interaction");

        // When: Admin hämtar interaktionen
        var foundInteraction = await _interactionService.GetInteractionByIdForAdminAsync(interaction.Id);

        // Then: Interaktionen ska returneras
        foundInteraction.ShouldNotBeNull();
        foundInteraction!.Id.ShouldBe(interaction.Id);
        foundInteraction.UserId.ShouldBe(user.Id);
        foundInteraction.Notes.ShouldBe("User interaction");
    }

    [Fact]
    public async Task Admin_KanSeInteraktionerFörVilkenKundSomHelst()
    {
        // Given: En admin och två användare med egna kunder och interaktioner
        var admin = await CreateUserAsync("admin@example.com", role: "Admin");
        var user1 = await CreateUserAsync("user1@example.com");
        var user2 = await CreateUserAsync("user2@example.com");
        var customer1 = await CreateCustomerAsync(user1.Id, "Customer", "One");
        var customer2 = await CreateCustomerAsync(user2.Id, "Customer", "Two");
        var interaction1 = await CreateInteractionAsync(customer1.Id, user1.Id, InteractionType.Call);
        var interaction2 = await CreateInteractionAsync(customer2.Id, user2.Id, InteractionType.Email);

        // When: Admin hämtar interaktioner för båda kunderna
        var customer1Interactions = await _interactionService.GetInteractionsByCustomerIdForAdminAsync(customer1.Id);
        var customer2Interactions = await _interactionService.GetInteractionsByCustomerIdForAdminAsync(customer2.Id);

        // Then: Admin ska se alla interaktioner för båda kunderna
        customer1Interactions.Count().ShouldBe(1);
        customer1Interactions.ShouldContain(i => i.Id == interaction1.Id);
        customer2Interactions.Count().ShouldBe(1);
        customer2Interactions.ShouldContain(i => i.Id == interaction2.Id);
    }

    [Fact]
    public async Task Admin_KanUppdateraVilkenInteraktionSomHelst()
    {
        // Given: En admin och en användare med en interaktion
        var admin = await CreateUserAsync("admin@example.com", role: "Admin");
        var user = await CreateUserAsync("user@example.com");
        var customer = await CreateCustomerAsync(user.Id, "Test", "Customer");
        var interaction = await CreateInteractionAsync(customer.Id, user.Id, InteractionType.Call, notes: "Old notes");

        // When: Admin uppdaterar interaktionen
        interaction.Notes = "Admin updated notes";
        var updated = await _interactionService.UpdateInteractionForAdminAsync(interaction);

        // Then: Uppdateringen lyckas
        updated.ShouldNotBeNull();
        updated!.Notes.ShouldBe("Admin updated notes");
    }

    [Fact]
    public async Task Admin_KanTaBortVilkenInteraktionSomHelst()
    {
        // Given: En admin och en användare med en interaktion
        var admin = await CreateUserAsync("admin@example.com", role: "Admin");
        var user = await CreateUserAsync("user@example.com");
        var customer = await CreateCustomerAsync(user.Id, "Test", "Customer");
        var interaction = await CreateInteractionAsync(customer.Id, user.Id, InteractionType.Call, notes: "To be deleted");

        // When: Admin tar bort interaktionen
        var result = await _interactionService.DeleteInteractionForAdminAsync(interaction.Id);

        // Then: Borttagningen lyckas
        result.ShouldBeTrue();

        // Verify: Interaktionen finns inte längre
        var deletedInteraction = await _interactionService.GetInteractionByIdForAdminAsync(interaction.Id);
        deletedInteraction.ShouldBeNull();
    }
}

