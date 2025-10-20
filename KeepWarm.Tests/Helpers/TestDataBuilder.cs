using KeepWarm.Data;
using KeepWarm.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.DependencyInjection;

namespace KeepWarm.Tests.Helpers;

public class TestDataBuilder
{
    private readonly IServiceProvider _serviceProvider;

    public TestDataBuilder(IServiceProvider serviceProvider)
    {
        _serviceProvider = serviceProvider;
    }

    public async Task<ApplicationUser> CreateUserAsync(
        string email,
        string password,
        string firstName = "Test",
        string lastName = "User",
        string? role = null)
    {
        using var scope = _serviceProvider.CreateScope();
        var userManager = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();
        var roleManager = scope.ServiceProvider.GetRequiredService<RoleManager<IdentityRole>>();

        var user = new ApplicationUser
        {
            UserName = email,
            Email = email,
            FirstName = firstName,
            LastName = lastName,
            EmailConfirmed = true
        };

        var result = await userManager.CreateAsync(user, password);
        if (!result.Succeeded)
        {
            throw new Exception($"Failed to create user: {string.Join(", ", result.Errors.Select(e => e.Description))}");
        }

        // Tilldela roll om angiven
        if (!string.IsNullOrEmpty(role))
        {
            // Säkerställ att rollen finns
            if (!await roleManager.RoleExistsAsync(role))
            {
                await roleManager.CreateAsync(new IdentityRole(role));
            }

            await userManager.AddToRoleAsync(user, role);
        }

        return user;
    }

    public async Task<Customer> CreateCustomerAsync(
        string userId,
        string firstName = "Test",
        string lastName = "Customer",
        string? email = null)
    {
        using var scope = _serviceProvider.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

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

        context.Customers.Add(customer);
        await context.SaveChangesAsync();

        return customer;
    }

    public async Task<List<Customer>> CreateCustomersAsync(
        string userId,
        int count)
    {
        var customers = new List<Customer>();
        for (int i = 0; i < count; i++)
        {
            var customer = await CreateCustomerAsync(
                userId,
                $"Customer{i}",
                $"Lastname{i}");
            customers.Add(customer);
        }
        return customers;
    }

    public async Task ClearDatabaseAsync()
    {
        using var scope = _serviceProvider.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

        context.Customers.RemoveRange(context.Customers);
        context.Users.RemoveRange(context.Users);
        await context.SaveChangesAsync();
    }
}
