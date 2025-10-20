using KeepWarm.Data;
using KeepWarm.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace KeepWarm.Tests.Helpers;

/// <summary>
/// Basklass för service-level tester med in-memory databas
/// </summary>
public class ServiceTestBase : IDisposable
{
    protected readonly ServiceProvider ServiceProvider;
    protected readonly ApplicationDbContext Context;
    protected readonly UserManager<ApplicationUser> UserManager;
    protected readonly RoleManager<IdentityRole> RoleManager;

    public ServiceTestBase()
    {
        var services = new ServiceCollection();

        // Konfigurera in-memory databas
        services.AddDbContext<ApplicationDbContext>(options =>
        {
            options.UseInMemoryDatabase($"TestDb_{Guid.NewGuid()}");
            options.EnableSensitiveDataLogging();
        });

        // Konfigurera Identity
        services.AddIdentity<ApplicationUser, IdentityRole>(options =>
        {
            options.Password.RequireDigit = true;
            options.Password.RequireLowercase = true;
            options.Password.RequireNonAlphanumeric = false;
            options.Password.RequireUppercase = true;
            options.Password.RequiredLength = 6;
            options.Password.RequiredUniqueChars = 1;
            options.User.RequireUniqueEmail = true;
        })
        .AddEntityFrameworkStores<ApplicationDbContext>()
        .AddDefaultTokenProviders();

        // Registrera services
        services.AddScoped<KeepWarm.Services.ICustomerService, KeepWarm.Services.CustomerService>();
        services.AddScoped<KeepWarm.Services.IIdentityService, KeepWarm.Services.IdentityService>();
        services.AddLogging();

        ServiceProvider = services.BuildServiceProvider();
        Context = ServiceProvider.GetRequiredService<ApplicationDbContext>();
        UserManager = ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();
        RoleManager = ServiceProvider.GetRequiredService<RoleManager<IdentityRole>>();

        // Skapa roller
        InitializeRoles().Wait();
    }

    private async Task InitializeRoles()
    {
        if (!await RoleManager.RoleExistsAsync("Admin"))
        {
            await RoleManager.CreateAsync(new IdentityRole("Admin"));
        }

        if (!await RoleManager.RoleExistsAsync("User"))
        {
            await RoleManager.CreateAsync(new IdentityRole("User"));
        }
    }

    protected async Task<ApplicationUser> CreateUserAsync(
        string email,
        string password = "Test123!",
        string firstName = "Test",
        string lastName = "User",
        string? role = null)
    {
        var user = new ApplicationUser
        {
            UserName = email,
            Email = email,
            FirstName = firstName,
            LastName = lastName,
            EmailConfirmed = true
        };

        var result = await UserManager.CreateAsync(user, password);
        if (!result.Succeeded)
        {
            throw new Exception($"Failed to create user: {string.Join(", ", result.Errors.Select(e => e.Description))}");
        }

        if (!string.IsNullOrEmpty(role))
        {
            await UserManager.AddToRoleAsync(user, role);
        }

        return user;
    }

    protected async Task<Customer> CreateCustomerAsync(
        string userId,
        string firstName = "Test",
        string lastName = "Customer",
        string? email = null)
    {
        var customer = new Customer
        {
            FirstName = firstName,
            LastName = lastName,
            Email = email ?? $"{firstName.ToLower()}.{lastName.ToLower()}@example.com",
            Phone = "+46701234567",
            Address = "Testgatan 1",
            City = "Stockholm",
            PostalCode = "12345",
            Country = "Sverige",
            UserId = userId,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        Context.Customers.Add(customer);
        await Context.SaveChangesAsync();

        return customer;
    }

    public void Dispose()
    {
        Context?.Dispose();
        ServiceProvider?.Dispose();
    }
}
