using KeepWarm.Models;
using KeepWarm.Services;
using KeepWarm.Tests.Helpers;
using Microsoft.Extensions.DependencyInjection;
using Shouldly;
using Xunit;

namespace KeepWarm.Tests.ServiceTests.InteractionManagement;

/// <summary>
/// User Story: Som användare vill jag redigera mina interaktioner för att uppdatera interaktionsdetaljer.
/// </summary>
public class US_User_EditInteraction_Service : ServiceTestBase
{
    private readonly IInteractionService _interactionService;

    public US_User_EditInteraction_Service()
    {
        _interactionService = ServiceProvider.GetRequiredService<IInteractionService>();
    }

    [Fact]
    public async Task Användare_KanUppdateraSinEgenInteraktion()
    {
        // Given: En användare med en kund och en interaktion
        var user = await CreateUserAsync("user@example.com");
        var customer = await CreateCustomerAsync(user.Id, "Test", "Customer");
        var interaction = await CreateInteractionAsync(customer.Id, user.Id, InteractionType.Call, DateTime.UtcNow.AddDays(-1), "Old notes");

        // When: Användaren uppdaterar interaktionen
        interaction.InteractionType = InteractionType.Meeting;
        interaction.InteractionDate = DateTime.UtcNow;
        interaction.Notes = "Updated notes";

        var updated = await _interactionService.UpdateInteractionAsync(interaction, user.Id);

        // Then: Uppdateringen ska lyckas och värden ska vara uppdaterade
        updated.ShouldNotBeNull();
        updated!.InteractionType.ShouldBe(InteractionType.Meeting);
        updated.Notes.ShouldBe("Updated notes");
        updated.UserId.ShouldBe(user.Id);
        updated.UpdatedAt.ShouldBeGreaterThanOrEqualTo(updated.CreatedAt);
    }

    [Fact]
    public async Task Användare_KanInteUppdateraAndraAnvändaresInteraktion()
    {
        // Given: Två användare med samma kund och egna interaktioner
        var user1 = await CreateUserAsync("user1@example.com");
        var user2 = await CreateUserAsync("user2@example.com");
        var customer = await CreateCustomerAsync(user1.Id, "Shared", "Customer");
        var user2Interaction = await CreateInteractionAsync(customer.Id, user2.Id, InteractionType.Call, notes: "User2 notes");

        // When: user1 försöker uppdatera user2:s interaktion
        user2Interaction.Notes = "Hacked notes";
        var updated = await _interactionService.UpdateInteractionAsync(user2Interaction, user1.Id);

        // Then: Uppdateringen ska misslyckas (null)
        updated.ShouldBeNull();
    }

    [Fact]
    public async Task UppdateringAvIckeExisterandeInteraktion_ReturnerarNull()
    {
        // Given: En användare med en kund
        var user = await CreateUserAsync("user@example.com");
        var customer = await CreateCustomerAsync(user.Id, "Test", "Customer");
        var ghost = new Interaction
        {
            Id = 99999,
            CustomerId = customer.Id,
            UserId = user.Id,
            InteractionType = InteractionType.Call,
            InteractionDate = DateTime.UtcNow,
            Notes = "Ghost interaction"
        };

        // When: Användaren försöker uppdatera icke-existerande interaktion
        var updated = await _interactionService.UpdateInteractionAsync(ghost, user.Id);

        // Then: Null ska returneras
        updated.ShouldBeNull();
    }

    [Fact]
    public async Task Uppdatering_SkaÄndraUpdatedAt()
    {
        // Given: En användare med en kund och en interaktion
        var user = await CreateUserAsync("user@example.com");
        var customer = await CreateCustomerAsync(user.Id, "Test", "Customer");
        var interaction = await CreateInteractionAsync(customer.Id, user.Id, InteractionType.Call, notes: "Before update");
        var originalUpdatedAt = interaction.UpdatedAt;

        // When: Interaktionen uppdateras
        await Task.Delay(5);
        interaction.Notes = "After update";
        var updated = await _interactionService.UpdateInteractionAsync(interaction, user.Id);

        // Then: UpdatedAt ska vara senare
        updated.ShouldNotBeNull();
        updated!.UpdatedAt.ShouldBeGreaterThan(originalUpdatedAt);
    }

    [Fact]
    public async Task Användare_KanUppdateraAllaFält()
    {
        // Given: En användare med en kund och en interaktion
        var user = await CreateUserAsync("user@example.com");
        var customer = await CreateCustomerAsync(user.Id, "Test", "Customer");
        var interaction = await CreateInteractionAsync(customer.Id, user.Id, InteractionType.Call, DateTime.UtcNow.AddDays(-5), "Old notes");
        var newDate = DateTime.UtcNow.AddDays(-2);

        // When: Användaren uppdaterar alla fält
        interaction.InteractionType = InteractionType.Email;
        interaction.InteractionDate = newDate;
        interaction.Notes = "New notes";

        var updated = await _interactionService.UpdateInteractionAsync(interaction, user.Id);

        // Then: Alla fält ska vara uppdaterade
        updated.ShouldNotBeNull();
        updated!.InteractionType.ShouldBe(InteractionType.Email);
        updated.InteractionDate.ShouldBe(newDate);
        updated.Notes.ShouldBe("New notes");
    }
}

