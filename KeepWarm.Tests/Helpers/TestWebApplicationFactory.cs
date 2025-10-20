using KeepWarm.Data;
using KeepWarm.Models;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;

namespace KeepWarm.Tests.Helpers;

public class TestWebApplicationFactory : WebApplicationFactory<Program>
{
    private readonly string _databaseName = $"InMemoryTestDb_{Guid.NewGuid()}";

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        // Sätt Testing-environment FÖRE services konfigureras
        builder.UseEnvironment("Testing");

        builder.ConfigureServices(services =>
        {
            // Registrera in-memory databas för tester
            services.AddDbContext<ApplicationDbContext>(options =>
            {
                options.UseInMemoryDatabase(_databaseName);
                options.EnableSensitiveDataLogging();
            });

            // Ta bort och ersätt Identity EF stores
            var identityStoreDescriptors = services
                .Where(d => d.ServiceType.IsGenericType &&
                           (d.ServiceType.GetGenericTypeDefinition() == typeof(IUserStore<>) ||
                            d.ServiceType.GetGenericTypeDefinition() == typeof(IRoleStore<>)))
                .ToList();

            foreach (var descriptor in identityStoreDescriptors)
            {
                services.Remove(descriptor);
            }

            // Registrera om Identity stores med InMemory databas
            services.AddScoped<IUserStore<ApplicationUser>>(sp =>
            {
                var context = sp.GetRequiredService<ApplicationDbContext>();
                return new Microsoft.AspNetCore.Identity.EntityFrameworkCore.UserStore<ApplicationUser, IdentityRole, ApplicationDbContext>(context);
            });

            services.AddScoped<IRoleStore<IdentityRole>>(sp =>
            {
                var context = sp.GetRequiredService<ApplicationDbContext>();
                return new Microsoft.AspNetCore.Identity.EntityFrameworkCore.RoleStore<IdentityRole, ApplicationDbContext>(context);
            });
        });
    }
}
