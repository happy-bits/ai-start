using KeepWarm.Data;
using Microsoft.EntityFrameworkCore;

namespace KeepWarm.Tests.TestHelpers
{
    /// <summary>
    /// Basklass för service-tester som behöver databas-kontext
    /// Eliminerar duplicerad DbContext-setup och dispose-logik
    /// </summary>
    public abstract class DbContextTestBase : IDisposable
    {
        protected readonly ApplicationDbContext Context;

        protected DbContextTestBase()
        {
            var options = new DbContextOptionsBuilder<ApplicationDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;
            
            Context = new ApplicationDbContext(options);
        }

        /// <summary>
        /// Hjälpmetod för att seeda databasen med testdata
        /// </summary>
        protected async Task SeedDatabaseAsync(params object[] entities)
        {
            Context.AddRange(entities);
            await Context.SaveChangesAsync();
        }

        /// <summary>
        /// Hjälpmetod för att rensa och seeda databasen med nya testdata
        /// </summary>
        protected async Task ResetAndSeedDatabaseAsync(params object[] entities)
        {
            // Rensa befintlig data
            Context.Customers.RemoveRange(Context.Customers);
            Context.Interactions.RemoveRange(Context.Interactions);
            Context.Users.RemoveRange(Context.Users);
            await Context.SaveChangesAsync();

            // Lägg till ny testdata
            if (entities.Length > 0)
            {
                await SeedDatabaseAsync(entities);
            }
        }

        /// <summary>
        /// Hjälpmetod för att få antal entiteter av viss typ
        /// </summary>
        protected async Task<int> GetEntityCountAsync<T>() where T : class
        {
            return await Context.Set<T>().CountAsync();
        }

        /// <summary>
        /// Hjälpmetod för att kontrollera om entitet existerar
        /// </summary>
        protected async Task<bool> EntityExistsAsync<T>(object id) where T : class
        {
            return await Context.Set<T>().FindAsync(id) != null;
        }

        public void Dispose()
        {
            Context.Dispose();
            GC.SuppressFinalize(this);
        }
    }
}
