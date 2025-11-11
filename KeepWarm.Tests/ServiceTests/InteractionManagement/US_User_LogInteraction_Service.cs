using KeepWarm.Models;
using KeepWarm.Services;
using KeepWarm.Tests.Helpers;
using Microsoft.Extensions.DependencyInjection;
using Shouldly;
using Xunit;

namespace KeepWarm.Tests.ServiceTests.InteractionManagement;

/// <summary>
/// User Story: Som användare vill jag logga en ny interaktion (samtal, möte eller e-post) med datum, tid och anteckningar direkt på kunddetaljsidan.
/// </summary>
public class US_User_LogInteraction_Service : ServiceTestBase
{
    private readonly IInteractionService _interactionService;

    public US_User_LogInteraction_Service()
    {
        _interactionService = ServiceProvider.GetRequiredService<IInteractionService>();
    }

    [Fact]
    public async Task Användare_KanSkapaNyInteraktion()
    {
        // Given: En användare med en kund
        var user = await CreateUserAsync("user@example.com");
        var customer = await CreateCustomerAsync(user.Id, "Test", "Customer");

        // When: Användaren skapar en ny interaktion
        var interaction = new Interaction
        {
            CustomerId = customer.Id,
            UserId = user.Id,
            InteractionType = InteractionType.Call,
            InteractionDate = DateTime.UtcNow,
            Notes = "Discussed project requirements"
        };

        var createdInteraction = await _interactionService.CreateInteractionAsync(interaction);

        // Then: Interaktionen ska skapas och tillhöra användaren
        createdInteraction.ShouldNotBeNull();
        createdInteraction.Id.ShouldBeGreaterThan(0);
        createdInteraction.CustomerId.ShouldBe(customer.Id);
        createdInteraction.UserId.ShouldBe(user.Id);
        createdInteraction.InteractionType.ShouldBe(InteractionType.Call);
        createdInteraction.Notes.ShouldBe("Discussed project requirements");

        // Verify: Interaktionen finns i databasen
        var foundInteraction = await _interactionService.GetInteractionByIdAsync(createdInteraction.Id, user.Id);
        foundInteraction.ShouldNotBeNull();
        foundInteraction!.Notes.ShouldBe("Discussed project requirements");
    }

    [Fact]
    public async Task SkapaNyInteraktion_SätterCreatedAtOchUpdatedAt()
    {
        // Given: En användare med en kund och en ny interaktion
        var user = await CreateUserAsync("user@example.com");
        var customer = await CreateCustomerAsync(user.Id, "Test", "Customer");
        var beforeCreate = DateTime.UtcNow;

        var interaction = new Interaction
        {
            CustomerId = customer.Id,
            UserId = user.Id,
            InteractionType = InteractionType.Email,
            InteractionDate = DateTime.UtcNow,
            Notes = "Sent proposal"
        };

        // When: Interaktionen skapas
        var createdInteraction = await _interactionService.CreateInteractionAsync(interaction);

        // Then: Tidsstämplar ska sättas
        createdInteraction.CreatedAt.ShouldBeGreaterThanOrEqualTo(beforeCreate);
        createdInteraction.UpdatedAt.ShouldBeGreaterThanOrEqualTo(beforeCreate);
    }

    [Fact]
    public async Task Användare_KanSkapaInteraktionMedOlikaTyper()
    {
        // Given: En användare med en kund
        var user = await CreateUserAsync("user@example.com");
        var customer = await CreateCustomerAsync(user.Id, "Test", "Customer");

        // When: Användaren skapar interaktioner av olika typer
        var call = new Interaction
        {
            CustomerId = customer.Id,
            UserId = user.Id,
            InteractionType = InteractionType.Call,
            InteractionDate = DateTime.UtcNow,
            Notes = "Phone call"
        };

        var meeting = new Interaction
        {
            CustomerId = customer.Id,
            UserId = user.Id,
            InteractionType = InteractionType.Meeting,
            InteractionDate = DateTime.UtcNow,
            Notes = "In-person meeting"
        };

        var email = new Interaction
        {
            CustomerId = customer.Id,
            UserId = user.Id,
            InteractionType = InteractionType.Email,
            InteractionDate = DateTime.UtcNow,
            Notes = "Email sent"
        };

        var createdCall = await _interactionService.CreateInteractionAsync(call);
        var createdMeeting = await _interactionService.CreateInteractionAsync(meeting);
        var createdEmail = await _interactionService.CreateInteractionAsync(email);

        // Then: Alla interaktionstyper ska skapas korrekt
        createdCall.InteractionType.ShouldBe(InteractionType.Call);
        createdMeeting.InteractionType.ShouldBe(InteractionType.Meeting);
        createdEmail.InteractionType.ShouldBe(InteractionType.Email);
    }

    [Fact]
    public async Task Användare_KanSkapaInteraktionUtanAnteckningar()
    {
        // Given: En användare med en kund
        var user = await CreateUserAsync("user@example.com");
        var customer = await CreateCustomerAsync(user.Id, "Test", "Customer");

        // When: Användaren skapar en interaktion utan anteckningar
        var interaction = new Interaction
        {
            CustomerId = customer.Id,
            UserId = user.Id,
            InteractionType = InteractionType.Call,
            InteractionDate = DateTime.UtcNow,
            Notes = null
        };

        var createdInteraction = await _interactionService.CreateInteractionAsync(interaction);

        // Then: Interaktionen ska skapas med null anteckningar
        createdInteraction.ShouldNotBeNull();
        createdInteraction.Notes.ShouldBeNull();
    }

    [Fact]
    public async Task NySkapadInteraktion_SynsIDatabasen()
    {
        // Given: En användare med en kund
        var user = await CreateUserAsync("user@example.com");
        var customer = await CreateCustomerAsync(user.Id, "Test", "Customer");

        // When: En interaktion skapas
        var interaction = new Interaction
        {
            CustomerId = customer.Id,
            UserId = user.Id,
            InteractionType = InteractionType.Meeting,
            InteractionDate = DateTime.UtcNow,
            Notes = "Database test"
        };

        var createdInteraction = await _interactionService.CreateInteractionAsync(interaction);

        // Then: Interaktionen ska finnas i databasen
        var dbInteraction = Context.Interactions.Find(createdInteraction.Id);
        dbInteraction.ShouldNotBeNull();
        dbInteraction!.InteractionType.ShouldBe(InteractionType.Meeting);
        dbInteraction.Notes.ShouldBe("Database test");
        dbInteraction.UserId.ShouldBe(user.Id);
    }
}

