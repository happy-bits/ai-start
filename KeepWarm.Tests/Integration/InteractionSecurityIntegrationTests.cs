using KeepWarm.Data;
using KeepWarm.Services;
using KeepWarm.Tests.TestHelpers;
using Shouldly;

namespace KeepWarm.Tests.Integration;

/// <summary>
/// Säkerhetsintegrationstester för InteractionService
/// Testar att användare endast kan se och manipulera sina egna interaktioner
/// </summary>
public class InteractionSecurityIntegrationTests : IDisposable
{
    private readonly ApplicationDbContext _context;
    private readonly InteractionService _interactionService;
    private readonly CustomerService _customerService;

    public InteractionSecurityIntegrationTests()
    {
        _context = TestDbContextFactory.CreateInMemoryDbContext();
        _interactionService = new InteractionService(_context);
        _customerService = new CustomerService(_context);
    }

    public void Dispose()
    {
        _context.Dispose();
    }

    [Fact]
    public async Task GetInteractionByIdAsync_SomAgare_ReturnearInteraktion()
    {
        // Given - En användare med en kund och interaktion
        var user = await TestUserFactory.CreateStandardUserAsync(_context, "kalle");
        var customer = TestDataSeeder.CreateCustomer(user.Id, "Anna", "Andersson", "anna@test.se");
        await _context.Customers.AddAsync(customer);
        await _context.SaveChangesAsync();

        var interaction = TestDataSeeder.CreateInteraction(customer.Id, user.Id, "Telefonsamtal", "Diskussion om offert");
        await _interactionService.CreateInteractionAsync(interaction);

        // When - Användaren hämtar sin egen interaktion
        var result = await _interactionService.GetInteractionByIdAsync(interaction.Id, user.Id);

        // Then - Ska returnera interaktionen
        result.ShouldNotBeNull();
        result.Id.ShouldBe(interaction.Id);
        result.Description.ShouldBe("Diskussion om offert");
    }

    [Fact]
    public async Task GetInteractionByIdAsync_SomIckeAgare_ReturnearNull()
    {
        // Given - Två användare, user1 har en interaktion
        var user1 = await TestUserFactory.CreateStandardUserAsync(_context, "kalle");
        var user2 = await TestUserFactory.CreateStandardUserAsync(_context, "lisa");
        
        var customer = TestDataSeeder.CreateCustomer(user1.Id, "Anna", "Andersson", "anna@test.se");
        await _context.Customers.AddAsync(customer);
        await _context.SaveChangesAsync();

        var interaction = TestDataSeeder.CreateInteraction(customer.Id, user1.Id, "Telefonsamtal", "Känslig information");
        await _interactionService.CreateInteractionAsync(interaction);

        // When - User2 försöker hämta user1:s interaktion
        var result = await _interactionService.GetInteractionByIdAsync(interaction.Id, user2.Id);

        // Then - Ska returnera null (säkerhetsskydd)
        result.ShouldBeNull();
    }

    [Fact]
    public async Task UpdateInteractionAsync_SomAgare_UppdaterarInteraktion()
    {
        // Given - En användare med en interaktion
        var user = await TestUserFactory.CreateStandardUserAsync(_context, "kalle");
        var customer = TestDataSeeder.CreateCustomer(user.Id);
        await _context.Customers.AddAsync(customer);
        await _context.SaveChangesAsync();

        var interaction = TestDataSeeder.CreateInteraction(customer.Id, user.Id, description: "Ursprunglig beskrivning");
        await _interactionService.CreateInteractionAsync(interaction);

        // When - Användaren uppdaterar sin egen interaktion
        interaction.Description = "Uppdaterad beskrivning";
        interaction.InteractionType = "E-post";
        var result = await _interactionService.UpdateInteractionAsync(interaction, user.Id);

        // Then - Uppdateringen ska lyckas
        result.ShouldBeTrue();
        
        var updated = await _interactionService.GetInteractionByIdAsync(interaction.Id, user.Id);
        updated!.Description.ShouldBe("Uppdaterad beskrivning");
        updated.InteractionType.ShouldBe("E-post");
    }

    [Fact]
    public async Task UpdateInteractionAsync_SomIckeAgare_KanInteUppdatera()
    {
        // Given - Två användare, user1 har en interaktion
        var user1 = await TestUserFactory.CreateStandardUserAsync(_context, "kalle");
        var user2 = await TestUserFactory.CreateStandardUserAsync(_context, "lisa");
        
        var customer = TestDataSeeder.CreateCustomer(user1.Id);
        await _context.Customers.AddAsync(customer);
        await _context.SaveChangesAsync();

        var interaction = TestDataSeeder.CreateInteraction(customer.Id, user1.Id, description: "Original");
        await _interactionService.CreateInteractionAsync(interaction);

        // Detach för att kunna göra ändringar
        _context.Entry(interaction).State = Microsoft.EntityFrameworkCore.EntityState.Detached;

        // When - User2 försöker uppdatera user1:s interaktion
        interaction.Description = "Hackat innehåll";
        var result = await _interactionService.UpdateInteractionAsync(interaction, user2.Id);

        // Then - Uppdateringen ska misslyckas
        result.ShouldBeFalse();
        
        // Verifiera att originalet är oförändrat
        var unchanged = await _interactionService.GetInteractionByIdAsync(interaction.Id, user1.Id);
        unchanged!.Description.ShouldBe("Original");
    }

    [Fact]
    public async Task DeleteInteractionAsync_SomAgare_TarBortInteraktion()
    {
        // Given - En användare med en interaktion
        var user = await TestUserFactory.CreateStandardUserAsync(_context, "kalle");
        var customer = TestDataSeeder.CreateCustomer(user.Id);
        await _context.Customers.AddAsync(customer);
        await _context.SaveChangesAsync();

        var interaction = TestDataSeeder.CreateInteraction(customer.Id, user.Id);
        await _interactionService.CreateInteractionAsync(interaction);

        // When - Användaren tar bort sin egen interaktion
        var result = await _interactionService.DeleteInteractionAsync(interaction.Id, user.Id);

        // Then - Borttagningen ska lyckas
        result.ShouldBeTrue();
        
        var deleted = await _interactionService.GetInteractionByIdAsync(interaction.Id, user.Id);
        deleted.ShouldBeNull();
    }

    [Fact]
    public async Task DeleteInteractionAsync_SomIckeAgare_KanInteTaBort()
    {
        // Given - Två användare, user1 har en interaktion
        var user1 = await TestUserFactory.CreateStandardUserAsync(_context, "kalle");
        var user2 = await TestUserFactory.CreateStandardUserAsync(_context, "lisa");
        
        var customer = TestDataSeeder.CreateCustomer(user1.Id);
        await _context.Customers.AddAsync(customer);
        await _context.SaveChangesAsync();

        var interaction = TestDataSeeder.CreateInteraction(customer.Id, user1.Id);
        await _interactionService.CreateInteractionAsync(interaction);

        // When - User2 försöker ta bort user1:s interaktion
        var result = await _interactionService.DeleteInteractionAsync(interaction.Id, user2.Id);

        // Then - Borttagningen ska misslyckas
        result.ShouldBeFalse();
        
        // Verifiera att interaktionen fortfarande finns
        var stillExists = await _interactionService.GetInteractionByIdAsync(interaction.Id, user1.Id);
        stillExists.ShouldNotBeNull();
    }

    [Fact]
    public async Task GetInteractionsByCustomerIdAsync_SomAgare_ReturnearInteraktioner()
    {
        // Given - En användare med en kund och två interaktioner
        var user = await TestUserFactory.CreateStandardUserAsync(_context, "kalle");
        var customer = TestDataSeeder.CreateCustomer(user.Id);
        await _context.Customers.AddAsync(customer);
        await _context.SaveChangesAsync();

        await _interactionService.CreateInteractionAsync(TestDataSeeder.CreateInteraction(customer.Id, user.Id, description: "Interaktion 1"));
        await _interactionService.CreateInteractionAsync(TestDataSeeder.CreateInteraction(customer.Id, user.Id, description: "Interaktion 2"));

        // When - Användaren hämtar interaktioner för sin kund
        var result = (await _interactionService.GetInteractionsByCustomerIdAsync(customer.Id, user.Id)).ToList();

        // Then - Ska returnera båda interaktionerna
        result.Count.ShouldBe(2);
        result.ShouldAllBe(i => i.UserId == user.Id);
    }

    [Fact]
    public async Task GetInteractionsByCustomerIdAsync_SomIckeAgare_ReturnearIngenting()
    {
        // Given - Två användare, user1 har en kund och interaktion
        var user1 = await TestUserFactory.CreateStandardUserAsync(_context, "kalle");
        var user2 = await TestUserFactory.CreateStandardUserAsync(_context, "lisa");
        
        var customer = TestDataSeeder.CreateCustomer(user1.Id);
        await _context.Customers.AddAsync(customer);
        await _context.SaveChangesAsync();

        await _interactionService.CreateInteractionAsync(TestDataSeeder.CreateInteraction(customer.Id, user1.Id));

        // When - User2 försöker hämta interaktioner för user1:s kund
        var result = (await _interactionService.GetInteractionsByCustomerIdAsync(customer.Id, user2.Id)).ToList();

        // Then - Ska returnera tom lista (kunden tillhör inte user2)
        result.Count.ShouldBe(0);
    }

    [Fact]
    public async Task ComplettSakerhetsflode_MultiplaAnvandare_FungearKorrekt()
    {
        // Given - Två användare med varsina kunder och interaktioner
        var user1 = await TestUserFactory.CreateStandardUserAsync(_context, "kalle");
        var user2 = await TestUserFactory.CreateStandardUserAsync(_context, "lisa");
        
        var customer1 = TestDataSeeder.CreateCustomer(user1.Id, "Anna", "Andersson", "anna@test.se");
        var customer2 = TestDataSeeder.CreateCustomer(user2.Id, "Bengt", "Bengtsson", "bengt@test.se");
        
        await _context.Customers.AddRangeAsync(customer1, customer2);
        await _context.SaveChangesAsync();

        var user1Interaction1 = TestDataSeeder.CreateInteraction(customer1.Id, user1.Id, description: "User1 interaction 1");
        var user1Interaction2 = TestDataSeeder.CreateInteraction(customer1.Id, user1.Id, description: "User1 interaction 2");
        var user2Interaction = TestDataSeeder.CreateInteraction(customer2.Id, user2.Id, description: "User2 interaction");
        
        await _interactionService.CreateInteractionAsync(user1Interaction1);
        await _interactionService.CreateInteractionAsync(user1Interaction2);
        await _interactionService.CreateInteractionAsync(user2Interaction);

        // When/Then - User1 kan endast se sina egna interaktioner
        var user1Interactions = (await _interactionService.GetInteractionsByUserIdAsync(user1.Id)).ToList();
        user1Interactions.Count.ShouldBe(2);
        user1Interactions.ShouldAllBe(i => i.UserId == user1.Id);

        // When/Then - User2 kan endast se sin egen interaktion
        var user2Interactions = (await _interactionService.GetInteractionsByUserIdAsync(user2.Id)).ToList();
        user2Interactions.Count.ShouldBe(1);
        user2Interactions.ShouldAllBe(i => i.UserId == user2.Id);

        // When/Then - User1 kan inte se user2:s interaktion
        var unauthorized = await _interactionService.GetInteractionByIdAsync(user2Interaction.Id, user1.Id);
        unauthorized.ShouldBeNull();

        // When/Then - User1 kan inte uppdatera user2:s interaktion
        _context.Entry(user2Interaction).State = Microsoft.EntityFrameworkCore.EntityState.Detached;
        user2Interaction.Description = "Hackat";
        var updateFailed = await _interactionService.UpdateInteractionAsync(user2Interaction, user1.Id);
        updateFailed.ShouldBeFalse();

        // When/Then - User1 kan inte ta bort user2:s interaktion
        var deleteFailed = await _interactionService.DeleteInteractionAsync(user2Interaction.Id, user1.Id);
        deleteFailed.ShouldBeFalse();
    }
}

