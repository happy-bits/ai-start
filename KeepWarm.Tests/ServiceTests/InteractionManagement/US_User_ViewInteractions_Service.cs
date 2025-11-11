using KeepWarm.Models;
using KeepWarm.Services;
using KeepWarm.Tests.Helpers;
using Microsoft.Extensions.DependencyInjection;
using Shouldly;
using Xunit;

namespace KeepWarm.Tests.ServiceTests.InteractionManagement;

/// <summary>
/// User Story: Som användare vill jag se mina interaktioner för en kund på kunddetaljsidan för att spåra kontakthistorik.
/// </summary>
public class US_User_ViewInteractions_Service : ServiceTestBase
{
    private readonly IInteractionService _interactionService;

    public US_User_ViewInteractions_Service()
    {
        _interactionService = ServiceProvider.GetRequiredService<IInteractionService>();
    }

    [Fact]
    public async Task Användare_KanSeSinaInteraktionerFörKund()
    {
        // Given: En användare med en kund och flera interaktioner
        var user = await CreateUserAsync("user@example.com");
        var customer = await CreateCustomerAsync(user.Id, "Test", "Customer");
        var interaction1 = await CreateInteractionAsync(customer.Id, user.Id, InteractionType.Call, DateTime.UtcNow.AddDays(-2), "First call");
        var interaction2 = await CreateInteractionAsync(customer.Id, user.Id, InteractionType.Meeting, DateTime.UtcNow.AddDays(-1), "Meeting notes");
        var interaction3 = await CreateInteractionAsync(customer.Id, user.Id, InteractionType.Email, DateTime.UtcNow, "Email sent");

        // When: Användaren hämtar interaktioner för kunden
        var interactions = await _interactionService.GetInteractionsByCustomerIdAsync(customer.Id, user.Id);

        // Then: Alla användarens interaktioner ska returneras
        interactions.ShouldNotBeNull();
        interactions.Count().ShouldBe(3);
        interactions.ShouldContain(i => i.Id == interaction1.Id);
        interactions.ShouldContain(i => i.Id == interaction2.Id);
        interactions.ShouldContain(i => i.Id == interaction3.Id);
    }

    [Fact]
    public async Task Användare_SerEndastSinaEgnaInteraktioner()
    {
        // Given: Två användare med samma kund och egna interaktioner
        var user1 = await CreateUserAsync("user1@example.com");
        var user2 = await CreateUserAsync("user2@example.com");
        var customer = await CreateCustomerAsync(user1.Id, "Shared", "Customer");
        var user1Interaction = await CreateInteractionAsync(customer.Id, user1.Id, InteractionType.Call, notes: "User1 call");
        var user2Interaction = await CreateInteractionAsync(customer.Id, user2.Id, InteractionType.Email, notes: "User2 email");

        // When: user1 hämtar interaktioner
        var user1Interactions = await _interactionService.GetInteractionsByCustomerIdAsync(customer.Id, user1.Id);

        // Then: user1 ska endast se sina egna interaktioner
        user1Interactions.ShouldNotBeNull();
        user1Interactions.Count().ShouldBe(1);
        user1Interactions.ShouldContain(i => i.Id == user1Interaction.Id);
        user1Interactions.ShouldNotContain(i => i.Id == user2Interaction.Id);
    }

    [Fact]
    public async Task Användare_KanInteSeInteraktionerFörAndraAnvändaresKund()
    {
        // Given: Två användare med egna kunder och interaktioner
        var user1 = await CreateUserAsync("user1@example.com");
        var user2 = await CreateUserAsync("user2@example.com");
        var user2Customer = await CreateCustomerAsync(user2.Id, "User2", "Customer");
        var user2Interaction = await CreateInteractionAsync(user2Customer.Id, user2.Id, InteractionType.Call);

        // When: user1 försöker hämta interaktioner för user2:s kund
        var interactions = await _interactionService.GetInteractionsByCustomerIdAsync(user2Customer.Id, user1.Id);

        // Then: Tom lista ska returneras (data-isolering)
        interactions.ShouldNotBeNull();
        interactions.Count().ShouldBe(0);
    }

    [Fact]
    public async Task HämtaInteraktionerFörKundUtanInteraktioner_ReturnerarTomLista()
    {
        // Given: En användare med en kund utan interaktioner
        var user = await CreateUserAsync("user@example.com");
        var customer = await CreateCustomerAsync(user.Id, "New", "Customer");

        // When: Användaren hämtar interaktioner
        var interactions = await _interactionService.GetInteractionsByCustomerIdAsync(customer.Id, user.Id);

        // Then: Tom lista ska returneras
        interactions.ShouldNotBeNull();
        interactions.Count().ShouldBe(0);
    }

    [Fact]
    public async Task Interaktioner_InkluderarAllaFält()
    {
        // Given: En användare med en kund och en interaktion
        var user = await CreateUserAsync("user@example.com");
        var customer = await CreateCustomerAsync(user.Id, "Test", "Customer");
        var interactionDate = DateTime.UtcNow.AddHours(-2);
        var interaction = await CreateInteractionAsync(customer.Id, user.Id, InteractionType.Meeting, interactionDate, "Test notes");

        // When: Användaren hämtar interaktionen
        var foundInteraction = await _interactionService.GetInteractionByIdAsync(interaction.Id, user.Id);

        // Then: Alla fält ska vara korrekt satta
        foundInteraction.ShouldNotBeNull();
        foundInteraction!.Id.ShouldBe(interaction.Id);
        foundInteraction.CustomerId.ShouldBe(customer.Id);
        foundInteraction.InteractionType.ShouldBe(InteractionType.Meeting);
        foundInteraction.InteractionDate.ShouldBe(interactionDate);
        foundInteraction.Notes.ShouldBe("Test notes");
        foundInteraction.UserId.ShouldBe(user.Id);
    }
}

