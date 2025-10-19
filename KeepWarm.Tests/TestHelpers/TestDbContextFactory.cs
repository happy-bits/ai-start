using KeepWarm.Data;
using Microsoft.EntityFrameworkCore;

namespace KeepWarm.Tests.TestHelpers;

/// <summary>
/// Factory för att skapa in-memory databaser för tester
/// </summary>
public static class TestDbContextFactory
{
    /// <summary>
    /// Skapar en ny in-memory ApplicationDbContext
    /// Varje test får sin egen unika databas för att undvika konflikter
    /// </summary>
    public static ApplicationDbContext CreateInMemoryDbContext()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .EnableSensitiveDataLogging()
            .Options;

        var context = new ApplicationDbContext(options);
        
        // Säkerställ att databasen är skapad
        context.Database.EnsureCreated();
        
        return context;
    }

    /// <summary>
    /// Skapar en ApplicationDbContext med specifikt databasnamn
    /// Användbart när man vill dela databas mellan flera operationer i samma test
    /// </summary>
    public static ApplicationDbContext CreateInMemoryDbContext(string databaseName)
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: databaseName)
            .EnableSensitiveDataLogging()
            .Options;

        var context = new ApplicationDbContext(options);
        context.Database.EnsureCreated();
        
        return context;
    }
}

