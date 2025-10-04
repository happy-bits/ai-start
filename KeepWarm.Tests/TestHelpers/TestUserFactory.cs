using KeepWarm.Data;
using KeepWarm.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace KeepWarm.Tests.TestHelpers;

/// <summary>
/// Factory för att skapa testanvändare med Identity
/// </summary>
public static class TestUserFactory
{
    /// <summary>
    /// Skapar en UserManager för testning
    /// </summary>
    public static UserManager<ApplicationUser> CreateUserManager(ApplicationDbContext context)
    {
        var services = new ServiceCollection();
        
        services.AddLogging();
        services.AddSingleton<IUserStore<ApplicationUser>>(
            sp => new Microsoft.AspNetCore.Identity.EntityFrameworkCore.UserStore<ApplicationUser>(context));
        
        services.AddIdentityCore<ApplicationUser>()
            .AddRoles<IdentityRole>()
            .AddEntityFrameworkStores<ApplicationDbContext>();

        var serviceProvider = services.BuildServiceProvider();
        return serviceProvider.GetRequiredService<UserManager<ApplicationUser>>();
    }

    /// <summary>
    /// Skapar en RoleManager för testning
    /// </summary>
    public static RoleManager<IdentityRole> CreateRoleManager(ApplicationDbContext context)
    {
        var services = new ServiceCollection();
        
        services.AddLogging();
        services.AddSingleton<IRoleStore<IdentityRole>>(
            sp => new Microsoft.AspNetCore.Identity.EntityFrameworkCore.RoleStore<IdentityRole>(context));
        
        services.AddIdentityCore<ApplicationUser>()
            .AddRoles<IdentityRole>()
            .AddEntityFrameworkStores<ApplicationDbContext>();

        var serviceProvider = services.BuildServiceProvider();
        return serviceProvider.GetRequiredService<RoleManager<IdentityRole>>();
    }

    /// <summary>
    /// Skapar en testanvändare med specificerad roll
    /// </summary>
    public static async Task<ApplicationUser> CreateUserWithRoleAsync(
        ApplicationDbContext context, 
        string email, 
        string firstName, 
        string lastName, 
        string role = "User")
    {
        var userManager = CreateUserManager(context);
        var roleManager = CreateRoleManager(context);

        // Skapa roll om den inte finns
        if (!await roleManager.RoleExistsAsync(role))
        {
            await roleManager.CreateAsync(new IdentityRole(role));
        }

        var user = new ApplicationUser
        {
            UserName = email,
            Email = email,
            FirstName = firstName,
            LastName = lastName,
            EmailConfirmed = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        var result = await userManager.CreateAsync(user, "Test123!");
        
        if (!result.Succeeded)
        {
            throw new InvalidOperationException(
                $"Kunde inte skapa testanvändare: {string.Join(", ", result.Errors.Select(e => e.Description))}");
        }

        await userManager.AddToRoleAsync(user, role);
        
        return user;
    }

    /// <summary>
    /// Skapar en standardanvändare (User-roll)
    /// </summary>
    public static async Task<ApplicationUser> CreateStandardUserAsync(ApplicationDbContext context, string emailPrefix = "user")
    {
        return await CreateUserWithRoleAsync(
            context, 
            $"{emailPrefix}@test.se", 
            "Test", 
            "Användare", 
            "User");
    }

    /// <summary>
    /// Skapar en admin-användare
    /// </summary>
    public static async Task<ApplicationUser> CreateAdminUserAsync(ApplicationDbContext context, string emailPrefix = "admin")
    {
        return await CreateUserWithRoleAsync(
            context, 
            $"{emailPrefix}@test.se", 
            "Test", 
            "Admin", 
            "Admin");
    }
}

