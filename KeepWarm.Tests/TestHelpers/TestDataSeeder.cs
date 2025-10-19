using KeepWarm.Data;
using KeepWarm.Models;

namespace KeepWarm.Tests.TestHelpers;

/// <summary>
/// Hjälpklass för att seeda realistisk testdata
/// </summary>
public static class TestDataSeeder
{
    /// <summary>
    /// Skapar en testkund med realistiska värden
    /// </summary>
    public static Customer CreateCustomer(
        string userId,
        string firstName = "Anna",
        string lastName = "Andersson",
        string email = "anna.andersson@foretagab.se",
        string? phone = "070-123 45 67",
        DateOnly? nextFollowUpDate = null)
    {
        return new Customer
        {
            FirstName = firstName,
            LastName = lastName,
            Email = email,
            Phone = phone,
            Address = "Storgatan 123",
            City = "Stockholm",
            PostalCode = "11122",
            Country = "Sverige",
            UserId = userId,
            NextFollowUpDate = nextFollowUpDate,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
    }

    /// <summary>
    /// Skapar flera testkunder med varierande data
    /// </summary>
    public static List<Customer> CreateMultipleCustomers(string userId, int count = 3)
    {
        var customers = new List<Customer>();
        var firstNames = new[] { "Anna", "Erik", "Maria", "Johan", "Karin" };
        var lastNames = new[] { "Andersson", "Eriksson", "Johansson", "Karlsson", "Nilsson" };
        var cities = new[] { "Stockholm", "Göteborg", "Malmö", "Uppsala", "Västerås" };

        for (int i = 0; i < count; i++)
        {
            var firstName = firstNames[i % firstNames.Length];
            var lastName = lastNames[i % lastNames.Length];
            
            customers.Add(new Customer
            {
                FirstName = firstName,
                LastName = lastName,
                Email = $"{firstName.ToLower()}.{lastName.ToLower()}@foretag{i}.se",
                Phone = $"070-{Random.Shared.Next(100, 999)} {Random.Shared.Next(10, 99)} {Random.Shared.Next(10, 99)}",
                Address = $"Testgatan {i + 1}",
                City = cities[i % cities.Length],
                PostalCode = $"{Random.Shared.Next(100, 999)}{Random.Shared.Next(10, 99)}",
                Country = "Sverige",
                UserId = userId,
                CreatedAt = DateTime.UtcNow.AddDays(-i),
                UpdatedAt = DateTime.UtcNow.AddDays(-i)
            });
        }

        return customers;
    }

    /// <summary>
    /// Skapar en testinteraktion
    /// </summary>
    public static Interaction CreateInteraction(
        int customerId,
        string userId,
        string interactionType = "Telefonsamtal",
        string description = "Diskuterade nya affärsmöjligheter",
        DateOnly? followUpDate = null,
        DateTime? interactionDate = null)
    {
        return new Interaction
        {
            CustomerId = customerId,
            UserId = userId,
            InteractionType = interactionType,
            Description = description,
            FollowUpDate = followUpDate,
            InteractionDate = interactionDate ?? DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
    }

    /// <summary>
    /// Seedar en komplett testmiljö med användare, kunder och interaktioner
    /// </summary>
    public static async Task<(ApplicationUser user, List<Customer> customers, List<Interaction> interactions)> 
        SeedCompleteEnvironment(ApplicationDbContext context)
    {
        // Skapa användare
        var user = await TestUserFactory.CreateStandardUserAsync(context, "seeduser");
        
        // Skapa kunder
        var customers = CreateMultipleCustomers(user.Id, 3);
        await context.Customers.AddRangeAsync(customers);
        await context.SaveChangesAsync();

        // Skapa interaktioner
        var interactions = new List<Interaction>();
        foreach (var customer in customers)
        {
            var interaction = CreateInteraction(
                customer.Id,
                user.Id,
                "E-post",
                $"Uppföljning med {customer.FirstName}");
            
            interactions.Add(interaction);
        }
        
        await context.Interactions.AddRangeAsync(interactions);
        await context.SaveChangesAsync();

        return (user, customers, interactions);
    }
}

