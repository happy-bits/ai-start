using KeepWarm.Models;
using KeepWarm.Services;
using KeepWarm.Tests.Helpers;
using Microsoft.Extensions.DependencyInjection;
using Shouldly;
using Xunit;

namespace KeepWarm.Tests.ServiceTests.InteractionManagement;

/// <summary>
/// User Story: Som användare vill jag ta bort mina interaktioner för att ta bort felaktiga poster.
/// </summary>
public class US_User_DeleteInteraction_Service : ServiceTestBase
{
    private readonly IInteractionService _interactionService;

    public US_User_DeleteInteraction_Service()
    {
        _interactionService = ServiceProvider.GetRequiredService<IInteractionService>();
    }

    [Fact]
    public async Task Användare_KanTaBortSinEgenInteraktion()
    {
        // Given: En användare med en kund och en interaktion
        var user = await CreateUserAsync("user@example.com");
        var customer = await CreateCustomerAsync(user.Id, "Test", "Customer");
        var interaction = await CreateInteractionAsync(customer.Id, user.Id, InteractionType.Call, notes: "To be deleted");

        // When: Användaren tar bort interaktionen
        var result = await _interactionService.DeleteInteractionAsync(interaction.Id, user.Id);

        // Then: Borttagningen ska lyckas
        result.ShouldBeTrue();

        // Verify: Interaktionen finns inte längre
        var deletedInteraction = await _interactionService.GetInteractionByIdAsync(interaction.Id, user.Id);
        deletedInteraction.ShouldBeNull();
    }

    [Fact]
    public async Task Användare_KanInteTaBortAndraAnvändaresInteraktion()
    {
        // Given: Två användare med samma kund och egna interaktioner
        var user1 = await CreateUserAsync("user1@example.com");
        var user2 = await CreateUserAsync("user2@example.com");
        var customer = await CreateCustomerAsync(user1.Id, "Shared", "Customer");
        var user2Interaction = await CreateInteractionAsync(customer.Id, user2.Id, InteractionType.Call, notes: "User2 interaction");

        // When: user1 försöker ta bort user2:s interaktion
        var result = await _interactionService.DeleteInteractionAsync(user2Interaction.Id, user1.Id);

        // Then: Borttagningen ska misslyckas
        result.ShouldBeFalse();

        // Verify: Interaktionen finns fortfarande
        var stillExists = await _interactionService.GetInteractionByIdAsync(user2Interaction.Id, user2.Id);
        stillExists.ShouldNotBeNull();
    }

    [Fact]
    public async Task TaBortIckeExisterandeInteraktion_ReturnerarFalse()
    {
        // Given: En användare
        var user = await CreateUserAsync("user@example.com");

        // When: Användaren försöker ta bort icke-existerande interaktion
        var result = await _interactionService.DeleteInteractionAsync(99999, user.Id);

        // Then: False ska returneras
        result.ShouldBeFalse();
    }

    [Fact]
    public async Task TaBortInteraktion_TarBortFrånDatabasen()
    {
        // Given: En användare med en kund och en interaktion
        var user = await CreateUserAsync("user@example.com");
        var customer = await CreateCustomerAsync(user.Id, "Test", "Customer");
        var interaction = await CreateInteractionAsync(customer.Id, user.Id, InteractionType.Meeting, notes: "Database test");

        // When: Interaktionen tas bort
        var result = await _interactionService.DeleteInteractionAsync(interaction.Id, user.Id);

        // Then: Borttagningen lyckas
        result.ShouldBeTrue();

        // Verify: Interaktionen finns inte i databasen
        var dbInteraction = Context.Interactions.Find(interaction.Id);
        dbInteraction.ShouldBeNull();
    }

    [Fact]
    public async Task TaBortInteraktion_PåverkarInteAndraInteraktioner()
    {
        // Given: En användare med en kund och flera interaktioner
        var user = await CreateUserAsync("user@example.com");
        var customer = await CreateCustomerAsync(user.Id, "Test", "Customer");
        var interaction1 = await CreateInteractionAsync(customer.Id, user.Id, InteractionType.Call, notes: "Keep this");
        var interaction2 = await CreateInteractionAsync(customer.Id, user.Id, InteractionType.Email, notes: "Delete this");
        var interaction3 = await CreateInteractionAsync(customer.Id, user.Id, InteractionType.Meeting, notes: "Keep this too");

        // When: En interaktion tas bort
        var result = await _interactionService.DeleteInteractionAsync(interaction2.Id, user.Id);

        // Then: Borttagningen lyckas
        result.ShouldBeTrue();

        // Verify: De andra interaktionerna finns fortfarande
        var remainingInteractions = await _interactionService.GetInteractionsByCustomerIdAsync(customer.Id, user.Id);
        remainingInteractions.Count().ShouldBe(2);
        remainingInteractions.ShouldContain(i => i.Id == interaction1.Id);
        remainingInteractions.ShouldContain(i => i.Id == interaction3.Id);
        remainingInteractions.ShouldNotContain(i => i.Id == interaction2.Id);
    }
}

