using KeepWarm.Data;
using KeepWarm.Services;
using KeepWarm.Tests.TestHelpers;
using Microsoft.EntityFrameworkCore;
using Shouldly;

namespace KeepWarm.Tests.Integration;

/// <summary>
/// Integrationstester för användarborttag
/// Testar att kunder behålls men kopplas bort när användare tas bort
/// </summary>
public class UserDeletionIntegrationTests : IDisposable
{
    private readonly ApplicationDbContext _context;
    private readonly CustomerService _customerService;
    private readonly IdentityService _identityService;

    public UserDeletionIntegrationTests()
    {
        _context = TestDbContextFactory.CreateInMemoryDbContext();
        _customerService = new CustomerService(_context);
        
        var userManager = TestUserFactory.CreateUserManager(_context);
        var roleManager = TestUserFactory.CreateRoleManager(_context);
        _identityService = new IdentityService(userManager, roleManager, _customerService);
    }

    public void Dispose()
    {
        _context.Dispose();
    }

    [Fact]
    public async Task DeleteUserAsync_MedKunder_SatterCustomerUserIdTillNull()
    {
        // Given - En användare med två kunder
        var user = await TestUserFactory.CreateStandardUserAsync(_context, "kalle");
        
        var customer1 = TestDataSeeder.CreateCustomer(user.Id, "Anna", "Andersson", "anna@test.se");
        var customer2 = TestDataSeeder.CreateCustomer(user.Id, "Bengt", "Bengtsson", "bengt@test.se");
        
        await _context.Customers.AddRangeAsync(customer1, customer2);
        await _context.SaveChangesAsync();

        // Verifiera att kunderna tillhör användaren
        customer1.UserId.ShouldBe(user.Id);
        customer2.UserId.ShouldBe(user.Id);

        // When - Tar bort användaren
        var result = await _identityService.DeleteUserAsync(user.Id);

        // Then - Användaren ska tas bort men kunderna ska finnas kvar med UserId = null
        result.ShouldBeTrue();
        
        // Verifiera att användaren är borttagen
        var deletedUser = await _identityService.FindUserByIdAsync(user.Id);
        deletedUser.ShouldBeNull();
        
        // Verifiera att kunderna finns kvar men med UserId = null
        var orphanedCustomers = await _context.Customers
            .Where(c => c.Id == customer1.Id || c.Id == customer2.Id)
            .ToListAsync();
        
        orphanedCustomers.Count.ShouldBe(2);
        orphanedCustomers.ShouldAllBe(c => c.UserId == null);
    }

    [Fact]
    public async Task SetCustomersUserIdToNullAsync_UpdaterarCustomerUpdatedAt()
    {
        // Given - En användare med en kund skapad tidigare
        var user = await TestUserFactory.CreateStandardUserAsync(_context, "kalle");
        var customer = TestDataSeeder.CreateCustomer(user.Id);
        customer.UpdatedAt = DateTime.UtcNow.AddMinutes(-5); // Satt till 5 minuter sedan
        await _context.Customers.AddAsync(customer);
        await _context.SaveChangesAsync();

        var originalUpdatedAt = customer.UpdatedAt;

        // When - Sätter kundens UserId till null via CustomerService
        await _customerService.SetCustomersUserIdToNullAsync(user.Id);

        // Then - Kundens UpdatedAt ska uppdateras
        var updatedCustomer = await _context.Customers.FindAsync(customer.Id);
        updatedCustomer.ShouldNotBeNull();
        updatedCustomer.UpdatedAt.ShouldBeGreaterThan(originalUpdatedAt);
    }

    [Fact]
    public async Task SetCustomersUserIdToNullAsync_MedMultiplaKunder_SatterAllaUserIdTillNull()
    {
        // Given - En användare med tre kunder
        var user = await TestUserFactory.CreateStandardUserAsync(_context, "kalle");
        var customers = TestDataSeeder.CreateMultipleCustomers(user.Id, 3);
        await _context.Customers.AddRangeAsync(customers);
        await _context.SaveChangesAsync();

        // When - Sätter alla kunders UserId till null
        await _customerService.SetCustomersUserIdToNullAsync(user.Id);

        // Then - Alla användares kunder ska ha UserId = null
        var orphanedCustomers = await _context.Customers
            .Where(c => customers.Select(cust => cust.Id).Contains(c.Id))
            .ToListAsync();
        
        orphanedCustomers.Count.ShouldBe(3);
        orphanedCustomers.ShouldAllBe(c => c.UserId == null);
    }

    [Fact]
    public async Task SetCustomersUserIdToNullAsync_PaverkarInteAndraAnvandaresKunder()
    {
        // Given - Två användare med varsina kunder
        var user1 = await TestUserFactory.CreateStandardUserAsync(_context, "kalle");
        var user2 = await TestUserFactory.CreateStandardUserAsync(_context, "lisa");
        
        var user1Customer = TestDataSeeder.CreateCustomer(user1.Id, "Anna", "Andersson", "anna@test.se");
        var user2Customer = TestDataSeeder.CreateCustomer(user2.Id, "Bengt", "Bengtsson", "bengt@test.se");
        
        await _context.Customers.AddRangeAsync(user1Customer, user2Customer);
        await _context.SaveChangesAsync();

        // When - Sätter user1:s kunders UserId till null
        await _customerService.SetCustomersUserIdToNullAsync(user1.Id);

        // Then - User1:s kund ska ha UserId = null, men User2:s kund ska vara oförändrad
        _context.Entry(user1Customer).Reload();
        _context.Entry(user2Customer).Reload();
        
        user1Customer.UserId.ShouldBeNull();
        user2Customer.UserId.ShouldBe(user2.Id);
    }

    [Fact]
    public async Task DeleteUserAsync_MedIngaKunder_FungearKorrekt()
    {
        // Given - En användare utan kunder
        var user = await TestUserFactory.CreateStandardUserAsync(_context, "kalle");

        // When - Tar bort användaren
        var result = await _identityService.DeleteUserAsync(user.Id);

        // Then - Ska lyckas utan problem
        result.ShouldBeTrue();
        
        var deletedUser = await _identityService.FindUserByIdAsync(user.Id);
        deletedUser.ShouldBeNull();
    }

    [Fact]
    public async Task AdminGetAllCustomers_EfterUserDeletion_InkludererForaldralosaKunder()
    {
        // Given - Två användare med varsina kunder
        var user1 = await TestUserFactory.CreateStandardUserAsync(_context, "kalle");
        var user2 = await TestUserFactory.CreateStandardUserAsync(_context, "lisa");
        
        await _context.Customers.AddAsync(TestDataSeeder.CreateCustomer(user1.Id, "Anna", "Andersson", "anna@test.se"));
        await _context.Customers.AddAsync(TestDataSeeder.CreateCustomer(user2.Id, "Bengt", "Bengtsson", "bengt@test.se"));
        await _context.SaveChangesAsync();

        // When - User1 tas bort
        await _identityService.DeleteUserAsync(user1.Id);

        // Then - Admin ska fortfarande se alla kunder, inklusive föräldralösa
        var allCustomers = (await _customerService.GetAllCustomersForAdminAsync()).ToList();
        
        allCustomers.Count.ShouldBeGreaterThanOrEqualTo(2);
        allCustomers.ShouldContain(c => c.FirstName == "Anna" && c.UserId == null);
        allCustomers.ShouldContain(c => c.FirstName == "Bengt" && c.UserId == user2.Id);
    }

    [Fact]
    public async Task DatabaseRelation_OnDeleteSetNull_FungearKorrekt()
    {
        // Given - En användare med en kund
        var user = await TestUserFactory.CreateStandardUserAsync(_context, "kalle");
        var customer = TestDataSeeder.CreateCustomer(user.Id);
        await _context.Customers.AddAsync(customer);
        await _context.SaveChangesAsync();

        // When - Användaren tas bort direkt från databasen (simulerar cascade behavior)
        var userToDelete = await _context.Users.FindAsync(user.Id);
        _context.Users.Remove(userToDelete!);
        await _context.SaveChangesAsync();

        // Then - Kundens UserId ska sättas till null av databasen (OnDelete SetNull)
        _context.Entry(customer).Reload();
        customer.UserId.ShouldBeNull();
    }

    [Fact]
    public async Task ComplettAnvandarborttagningsflode_FungearEndToEnd()
    {
        // Given - Två användare med kunder och interaktioner
        var user1 = await TestUserFactory.CreateStandardUserAsync(_context, "kalle");
        var user2 = await TestUserFactory.CreateStandardUserAsync(_context, "lisa");
        
        var user1Customer = TestDataSeeder.CreateCustomer(user1.Id, "Anna", "Andersson", "anna@test.se");
        var user2Customer = TestDataSeeder.CreateCustomer(user2.Id, "Bengt", "Bengtsson", "bengt@test.se");
        
        await _context.Customers.AddRangeAsync(user1Customer, user2Customer);
        await _context.SaveChangesAsync();

        // Lägg till interaktioner (kommer tas bort cascade eftersom Interaction har OnDelete.Cascade)
        var user1Interaction = TestDataSeeder.CreateInteraction(user1Customer.Id, user1.Id);
        await _context.Interactions.AddAsync(user1Interaction);
        await _context.SaveChangesAsync();

        var initialCustomerCount = await _context.Customers.CountAsync();
        var initialInteractionCount = await _context.Interactions.CountAsync();

        // When - User1 tas bort via IdentityService
        var result = await _identityService.DeleteUserAsync(user1.Id);

        // Then - Resultatet ska vara framgångsrikt
        result.ShouldBeTrue();

        // User1 ska vara borttagen
        var deletedUser = await _identityService.FindUserByIdAsync(user1.Id);
        deletedUser.ShouldBeNull();

        // User1:s kund ska finnas kvar men vara föräldralös
        var orphanedCustomer = await _context.Customers.FindAsync(user1Customer.Id);
        orphanedCustomer.ShouldNotBeNull();
        orphanedCustomer.UserId.ShouldBeNull();

        // Antalet kunder ska vara oförändrat
        var finalCustomerCount = await _context.Customers.CountAsync();
        finalCustomerCount.ShouldBe(initialCustomerCount);

        // User1:s interaktioner ska ha tagits bort (cascade)
        var finalInteractionCount = await _context.Interactions.CountAsync();
        finalInteractionCount.ShouldBeLessThan(initialInteractionCount);

        // User2 och deras kund ska vara opåverkad
        var user2Still = await _identityService.FindUserByIdAsync(user2.Id);
        user2Still.ShouldNotBeNull();
        
        _context.Entry(user2Customer).Reload();
        user2Customer.UserId.ShouldBe(user2.Id);
    }
}

