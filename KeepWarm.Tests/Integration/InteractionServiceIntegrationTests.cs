using KeepWarm.Data;
using KeepWarm.Helpers;
using KeepWarm.Models;
using KeepWarm.Services;
using KeepWarm.Tests.TestHelpers;
using Shouldly;

namespace KeepWarm.Tests.Integration;

/// <summary>
/// Integrationstester för InteractionService
/// Fokus på uppföljningsdatum och samspel med Customer-entiteten
/// </summary>
public class InteractionServiceIntegrationTests : IDisposable
{
    private readonly ApplicationDbContext _context;
    private readonly InteractionService _interactionService;
    private readonly CustomerService _customerService;

    public InteractionServiceIntegrationTests()
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
    public async Task CreateInteractionAsync_MedFollowUpDate_UppdaterarCustomerNextFollowUpDate()
    {
        // Given - En kund utan uppföljningsdatum
        var user = await TestUserFactory.CreateStandardUserAsync(_context, "kalle");
        var customer = TestDataSeeder.CreateCustomer(user.Id, "Anna", "Andersson", "anna@test.se");
        await _context.Customers.AddAsync(customer);
        await _context.SaveChangesAsync();

        customer.NextFollowUpDate.ShouldBeNull();

        var followUpDate = DateOnly.FromDateTime(DateTime.Now.AddDays(7));

        // When - Skapar en interaktion med uppföljningsdatum
        var interaction = TestDataSeeder.CreateInteraction(
            customer.Id,
            user.Id,
            "Telefonsamtal",
            "Diskuterade nya affärsmöjligheter",
            followUpDate);

        var result = await _interactionService.CreateInteractionAsync(interaction);

        // Then - Interaktionen ska skapas och kundens NextFollowUpDate ska uppdateras
        result.ShouldBeTrue();

        var updatedCustomer = await _customerService.GetCustomerByIdAsync(customer.Id, user.Id);
        updatedCustomer.ShouldNotBeNull();
        updatedCustomer.NextFollowUpDate.ShouldBe(followUpDate);
    }

    [Fact]
    public async Task CreateInteractionAsync_UtanFollowUpDate_SatterCustomerNextFollowUpDateTillNull()
    {
        // Given - En kund med befintligt uppföljningsdatum
        var user = await TestUserFactory.CreateStandardUserAsync(_context, "kalle");
        var existingFollowUpDate = DateOnly.FromDateTime(DateTime.Now.AddDays(5));
        var customer = TestDataSeeder.CreateCustomer(
            user.Id, 
            "Anna", 
            "Andersson", 
            "anna@test.se", 
            nextFollowUpDate: existingFollowUpDate);
        
        await _context.Customers.AddAsync(customer);
        await _context.SaveChangesAsync();

        // When - Skapar en interaktion UTAN uppföljningsdatum
        var interaction = TestDataSeeder.CreateInteraction(
            customer.Id,
            user.Id,
            "E-post",
            "Skickade offert",
            followUpDate: null);

        var result = await _interactionService.CreateInteractionAsync(interaction);

        // Then - Interaktionen ska skapas och kundens NextFollowUpDate ska sättas till null
        // OBS: Detta är det aktuella beteendet i InteractionService.
        // Man kan argumentera för att NextFollowUpDate borde vara oförändrat istället.
        result.ShouldBeTrue();

        // Ladda om kunden från databasen för att få uppdaterad data
        _context.Entry(customer).Reload();
        customer.NextFollowUpDate.ShouldBeNull();
    }

    [Fact]
    public async Task CreateInteractionAsync_MedNyttFollowUpDate_SkriverOverTidigareVarde()
    {
        // Given - En kund med befintligt uppföljningsdatum
        var user = await TestUserFactory.CreateStandardUserAsync(_context, "kalle");
        var oldFollowUpDate = DateOnly.FromDateTime(DateTime.Now.AddDays(5));
        var customer = TestDataSeeder.CreateCustomer(
            user.Id,
            "Anna",
            "Andersson",
            "anna@test.se",
            nextFollowUpDate: oldFollowUpDate);
        
        await _context.Customers.AddAsync(customer);
        await _context.SaveChangesAsync();

        var newFollowUpDate = DateOnly.FromDateTime(DateTime.Now.AddDays(10));

        // When - Skapar en ny interaktion med nytt uppföljningsdatum
        var interaction = TestDataSeeder.CreateInteraction(
            customer.Id,
            user.Id,
            "Möte",
            "Produktdemo genomförd",
            newFollowUpDate);

        var result = await _interactionService.CreateInteractionAsync(interaction);

        // Then - Kundens NextFollowUpDate ska uppdateras till nya datumet
        result.ShouldBeTrue();

        var updatedCustomer = await _customerService.GetCustomerByIdAsync(customer.Id, user.Id);
        updatedCustomer.ShouldNotBeNull();
        updatedCustomer.NextFollowUpDate.ShouldBe(newFollowUpDate);
        updatedCustomer.NextFollowUpDate.ShouldNotBe(oldFollowUpDate);
    }

    [Fact]
    public async Task CreateInteractionAsync_FormaterarDatumTillMinutprecision()
    {
        // Given - En kund och ett datum med sekunder och millisekunder
        var user = await TestUserFactory.CreateStandardUserAsync(_context, "kalle");
        var customer = TestDataSeeder.CreateCustomer(user.Id);
        await _context.Customers.AddAsync(customer);
        await _context.SaveChangesAsync();

        var dateTimeWithSeconds = new DateTime(2025, 10, 4, 14, 30, 45, 999);

        // When - Skapar en interaktion med exakt tid
        var interaction = TestDataSeeder.CreateInteraction(
            customer.Id,
            user.Id,
            interactionDate: dateTimeWithSeconds);

        await _interactionService.CreateInteractionAsync(interaction);

        // Then - Datumen ska vara formaterade till minutprecision (utan sekunder)
        var saved = await _interactionService.GetInteractionByIdAsync(interaction.Id);
        saved.ShouldNotBeNull();
        saved.InteractionDate.Second.ShouldBe(0);
        saved.InteractionDate.Millisecond.ShouldBe(0);
        saved.InteractionDate.Hour.ShouldBe(14);
        saved.InteractionDate.Minute.ShouldBe(30);
        
        saved.CreatedAt.Second.ShouldBe(0);
        saved.CreatedAt.Millisecond.ShouldBe(0);
    }

    [Fact]
    public async Task GetInteractionsByCustomerIdAsync_MedMultiplaInteraktioner_SortearPaDatum()
    {
        // Given - En kund med tre interaktioner vid olika tidpunkter
        var user = await TestUserFactory.CreateStandardUserAsync(_context, "kalle");
        var customer = TestDataSeeder.CreateCustomer(user.Id);
        await _context.Customers.AddAsync(customer);
        await _context.SaveChangesAsync();

        var interaction1 = TestDataSeeder.CreateInteraction(customer.Id, user.Id, interactionDate: DateTime.UtcNow.AddDays(-5));
        var interaction2 = TestDataSeeder.CreateInteraction(customer.Id, user.Id, interactionDate: DateTime.UtcNow.AddDays(-1));
        var interaction3 = TestDataSeeder.CreateInteraction(customer.Id, user.Id, interactionDate: DateTime.UtcNow.AddDays(-10));

        await _interactionService.CreateInteractionAsync(interaction1);
        await _interactionService.CreateInteractionAsync(interaction2);
        await _interactionService.CreateInteractionAsync(interaction3);

        // When - Hämtar alla interaktioner för kunden
        var interactions = (await _interactionService.GetInteractionsByCustomerIdAsync(customer.Id, user.Id)).ToList();

        // Then - Ska vara sorterade med senaste först
        interactions.Count.ShouldBe(3);
        interactions[0].InteractionDate.ShouldBeGreaterThan(interactions[1].InteractionDate);
        interactions[1].InteractionDate.ShouldBeGreaterThan(interactions[2].InteractionDate);
    }

    [Fact]
    public async Task GetInteractionsByUserIdAsync_ReturnearEndastAnvandarensInteraktioner()
    {
        // Given - Två användare med varsina kunder och interaktioner
        var user1 = await TestUserFactory.CreateStandardUserAsync(_context, "kalle");
        var user2 = await TestUserFactory.CreateStandardUserAsync(_context, "lisa");
        
        var customer1 = TestDataSeeder.CreateCustomer(user1.Id, "Anna", "Andersson", "anna@test.se");
        var customer2 = TestDataSeeder.CreateCustomer(user2.Id, "Bengt", "Bengtsson", "bengt@test.se");
        
        await _context.Customers.AddRangeAsync(customer1, customer2);
        await _context.SaveChangesAsync();

        await _interactionService.CreateInteractionAsync(
            TestDataSeeder.CreateInteraction(customer1.Id, user1.Id, description: "User1 interaction 1"));
        await _interactionService.CreateInteractionAsync(
            TestDataSeeder.CreateInteraction(customer1.Id, user1.Id, description: "User1 interaction 2"));
        await _interactionService.CreateInteractionAsync(
            TestDataSeeder.CreateInteraction(customer2.Id, user2.Id, description: "User2 interaction"));

        // When - Hämtar interaktioner för user1
        var user1Interactions = (await _interactionService.GetInteractionsByUserIdAsync(user1.Id)).ToList();

        // Then - Ska endast returnera user1:s interaktioner
        user1Interactions.Count.ShouldBe(2);
        user1Interactions.ShouldAllBe(i => i.UserId == user1.Id);
        user1Interactions.ShouldContain(i => i.Description.Contains("User1 interaction 1"));
        user1Interactions.ShouldContain(i => i.Description.Contains("User1 interaction 2"));
    }

    [Fact]
    public async Task GetInteractionByIdAsync_InkluderarCustomerOchUser()
    {
        // Given - En interaktion kopplad till kund och användare
        var user = await TestUserFactory.CreateStandardUserAsync(_context, "kalle");
        var customer = TestDataSeeder.CreateCustomer(user.Id, "Anna", "Andersson", "anna@test.se");
        await _context.Customers.AddAsync(customer);
        await _context.SaveChangesAsync();

        var interaction = TestDataSeeder.CreateInteraction(customer.Id, user.Id);
        await _interactionService.CreateInteractionAsync(interaction);

        // When - Hämtar interaktionen
        var result = await _interactionService.GetInteractionByIdAsync(interaction.Id);

        // Then - Ska inkludera Customer och User navigation properties
        result.ShouldNotBeNull();
        result.Customer.ShouldNotBeNull();
        result.Customer.FirstName.ShouldBe("Anna");
        result.User.ShouldNotBeNull();
        result.User.Email.ShouldBe(user.Email);
    }

    [Fact]
    public async Task UpdateInteractionAsync_UppdaterarDataOchTimestamp()
    {
        // Given - En sparad interaktion med ett specifikt äldre datum
        var user = await TestUserFactory.CreateStandardUserAsync(_context, "kalle");
        var customer = TestDataSeeder.CreateCustomer(user.Id);
        await _context.Customers.AddAsync(customer);
        await _context.SaveChangesAsync();

        var oldInteractionDate = DateTime.UtcNow.AddDays(-1);
        var interaction = TestDataSeeder.CreateInteraction(
            customer.Id, 
            user.Id, 
            description: "Ursprunglig beskrivning",
            interactionDate: oldInteractionDate);
        
        await _interactionService.CreateInteractionAsync(interaction);
        
        var originalUpdatedAt = interaction.UpdatedAt;
        await Task.Delay(100); // Säkerställ tidsskillnad (behöver vara längre för minutprecision)

        // When - Uppdaterar interaktionen med nytt datum
        var savedInteraction = await _interactionService.GetInteractionByIdAsync(interaction.Id);
        savedInteraction!.Description = "Uppdaterad beskrivning";
        savedInteraction!.InteractionType = "Möte";
        savedInteraction.InteractionDate = DateTime.UtcNow; // Nytt datum som garanterat är senare
        
        var result = await _interactionService.UpdateInteractionAsync(savedInteraction, user.Id);

        // Then - Ska uppdatera data och timestamp
        result.ShouldBeTrue();
        
        var updated = await _interactionService.GetInteractionByIdAsync(interaction.Id);
        updated!.Description.ShouldBe("Uppdaterad beskrivning");
        updated.InteractionType.ShouldBe("Möte");
        updated.UpdatedAt.ShouldBeGreaterThanOrEqualTo(originalUpdatedAt); // >= eftersom minutprecision kan göra dem lika
    }

    [Fact]
    public async Task DeleteInteractionAsync_TarBortInteraktion()
    {
        // Given - En sparad interaktion
        var user = await TestUserFactory.CreateStandardUserAsync(_context, "kalle");
        var customer = TestDataSeeder.CreateCustomer(user.Id);
        await _context.Customers.AddAsync(customer);
        await _context.SaveChangesAsync();

        var interaction = TestDataSeeder.CreateInteraction(customer.Id, user.Id);
        await _interactionService.CreateInteractionAsync(interaction);

        // When - Tar bort interaktionen
        var result = await _interactionService.DeleteInteractionAsync(interaction.Id, user.Id);

        // Then - Ska returnera true och interaktionen ska vara borttagen
        result.ShouldBeTrue();
        
        var deleted = await _interactionService.GetInteractionByIdAsync(interaction.Id, user.Id);
        deleted.ShouldBeNull();
    }

    [Fact]
    public async Task DeleteInteractionAsync_MedIckeExisterandeId_ReturnearFalse()
    {
        // Given - En användare men ingen interaktion
        var user = await TestUserFactory.CreateStandardUserAsync(_context, "kalle");

        // When - Försöker ta bort icke-existerande interaktion
        var result = await _interactionService.DeleteInteractionAsync(99999, user.Id);

        // Then - Ska returnera false
        result.ShouldBeFalse();
    }

    [Fact]
    public async Task GetAllInteractionsForAdminAsync_ReturnearAllaInteraktioner()
    {
        // Given - Två användare med interaktioner
        var user1 = await TestUserFactory.CreateStandardUserAsync(_context, "kalle");
        var user2 = await TestUserFactory.CreateStandardUserAsync(_context, "lisa");
        
        var customer1 = TestDataSeeder.CreateCustomer(user1.Id);
        var customer2 = TestDataSeeder.CreateCustomer(user2.Id);
        
        await _context.Customers.AddRangeAsync(customer1, customer2);
        await _context.SaveChangesAsync();

        await _interactionService.CreateInteractionAsync(TestDataSeeder.CreateInteraction(customer1.Id, user1.Id));
        await _interactionService.CreateInteractionAsync(TestDataSeeder.CreateInteraction(customer2.Id, user2.Id));

        // When - Admin hämtar alla interaktioner
        var allInteractions = (await _interactionService.GetAllInteractionsForAdminAsync()).ToList();

        // Then - Ska returnera alla interaktioner med Customer och User inkluderat
        allInteractions.Count.ShouldBeGreaterThanOrEqualTo(2);
        allInteractions.ShouldAllBe(i => i.Customer != null);
        allInteractions.ShouldAllBe(i => i.User != null);
    }

    [Fact]
    public async Task UpdateInteractionAsync_MedNyttFollowUpDate_UppdaterarCustomerNextFollowUpDate()
    {
        // Given - En kund med en interaktion och ursprungligt uppföljningsdatum
        var user = await TestUserFactory.CreateStandardUserAsync(_context, "kalle");
        var customer = TestDataSeeder.CreateCustomer(user.Id);
        await _context.Customers.AddAsync(customer);
        await _context.SaveChangesAsync();

        var oldFollowUpDate = DateOnly.FromDateTime(DateTime.Now.AddDays(5));
        var interaction = TestDataSeeder.CreateInteraction(
            customer.Id,
            user.Id,
            followUpDate: oldFollowUpDate);

        await _interactionService.CreateInteractionAsync(interaction);

        // Verifiera att customer har gammalt datum
        _context.Entry(customer).Reload();
        customer.NextFollowUpDate.ShouldBe(oldFollowUpDate);

        // When - Uppdaterar interaktionen med nytt uppföljningsdatum
        var savedInteraction = await _interactionService.GetInteractionByIdAsync(interaction.Id);
        var newFollowUpDate = DateOnly.FromDateTime(DateTime.Now.AddDays(10));
        savedInteraction!.FollowUpDate = newFollowUpDate;
        
        var result = await _interactionService.UpdateInteractionAsync(savedInteraction, user.Id);

        // Then - Kundens NextFollowUpDate ska uppdateras till nya datumet
        result.ShouldBeTrue();
        
        _context.Entry(customer).Reload();
        customer.NextFollowUpDate.ShouldBe(newFollowUpDate);
    }

    [Fact]
    public async Task UpdateInteractionAsync_TarBortFollowUpDate_SatterCustomerNextFollowUpDateTillNull()
    {
        // Given - En kund med en interaktion och uppföljningsdatum
        var user = await TestUserFactory.CreateStandardUserAsync(_context, "kalle");
        var customer = TestDataSeeder.CreateCustomer(user.Id);
        await _context.Customers.AddAsync(customer);
        await _context.SaveChangesAsync();

        var followUpDate = DateOnly.FromDateTime(DateTime.Now.AddDays(5));
        var interaction = TestDataSeeder.CreateInteraction(
            customer.Id,
            user.Id,
            followUpDate: followUpDate);

        await _interactionService.CreateInteractionAsync(interaction);

        // Verifiera att customer har uppföljningsdatum
        _context.Entry(customer).Reload();
        customer.NextFollowUpDate.ShouldBe(followUpDate);

        // When - Uppdaterar interaktionen utan uppföljningsdatum
        var savedInteraction = await _interactionService.GetInteractionByIdAsync(interaction.Id);
        savedInteraction!.FollowUpDate = null;
        
        var result = await _interactionService.UpdateInteractionAsync(savedInteraction, user.Id);

        // Then - Kundens NextFollowUpDate ska sättas till null
        result.ShouldBeTrue();
        
        _context.Entry(customer).Reload();
        customer.NextFollowUpDate.ShouldBeNull();
    }

    [Fact]
    public async Task DeleteInteractionAsync_MedFollowUpDate_SatterCustomerNextFollowUpDateTillNull()
    {
        // Given - En kund med en interaktion och uppföljningsdatum
        var user = await TestUserFactory.CreateStandardUserAsync(_context, "kalle");
        var customer = TestDataSeeder.CreateCustomer(user.Id);
        await _context.Customers.AddAsync(customer);
        await _context.SaveChangesAsync();

        var followUpDate = DateOnly.FromDateTime(DateTime.Now.AddDays(5));
        var interaction = TestDataSeeder.CreateInteraction(
            customer.Id,
            user.Id,
            followUpDate: followUpDate);

        await _interactionService.CreateInteractionAsync(interaction);

        // Verifiera att customer har uppföljningsdatum
        _context.Entry(customer).Reload();
        customer.NextFollowUpDate.ShouldBe(followUpDate);

        // When - Tar bort interaktionen
        var result = await _interactionService.DeleteInteractionAsync(interaction.Id, user.Id);

        // Then - Kundens NextFollowUpDate ska sättas till null
        result.ShouldBeTrue();
        
        _context.Entry(customer).Reload();
        customer.NextFollowUpDate.ShouldBeNull();
    }

    [Fact]
    public async Task DeleteInteractionAsync_MedMultiplaInteraktioner_BehållerNastaPlanmadeFollowUpDate()
    {
        // Given - En kund med två interaktioner med olika uppföljningsdatum
        var user = await TestUserFactory.CreateStandardUserAsync(_context, "kalle");
        var customer = TestDataSeeder.CreateCustomer(user.Id);
        await _context.Customers.AddAsync(customer);
        await _context.SaveChangesAsync();

        var followUpDate1 = DateOnly.FromDateTime(DateTime.Now.AddDays(5));
        var followUpDate2 = DateOnly.FromDateTime(DateTime.Now.AddDays(10)); // Senare datum
        
        var interaction1 = TestDataSeeder.CreateInteraction(customer.Id, user.Id, followUpDate: followUpDate1);
        var interaction2 = TestDataSeeder.CreateInteraction(customer.Id, user.Id, followUpDate: followUpDate2);

        await _interactionService.CreateInteractionAsync(interaction1);
        await _interactionService.CreateInteractionAsync(interaction2);

        // Verifiera att customer har det senare datumet (senast skapade)
        _context.Entry(customer).Reload();
        customer.NextFollowUpDate.ShouldBe(followUpDate2);

        // When - Tar bort den senaste interaktionen
        var result = await _interactionService.DeleteInteractionAsync(interaction2.Id, user.Id);

        // Then - Kundens NextFollowUpDate ska beräknas om till tidigaste kvarvarande datum
        result.ShouldBeTrue();
        
        _context.Entry(customer).Reload();
        customer.NextFollowUpDate.ShouldBe(followUpDate1);
    }
}


