using CustomerManagement.Data;
using CustomerManagement.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace CustomerManagement.Services
{
    public class DatabaseSeedService
    {
        private readonly ApplicationDbContext _context;
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly RoleManager<IdentityRole> _roleManager;

        public DatabaseSeedService(
            ApplicationDbContext context,
            UserManager<ApplicationUser> userManager,
            RoleManager<IdentityRole> roleManager)
        {
            _context = context;
            _userManager = userManager;
            _roleManager = roleManager;
        }

        public async Task<bool> RecreateDatabaseAsync()
        {
            try
            {
                // Ta bort befintlig databas
                await _context.Database.EnsureDeletedAsync();

                // Skapa ny databas från migrations
                await _context.Database.EnsureCreatedAsync();

                // Skapa roller
                await CreateRolesAsync();

                return true;
            }
            catch
            {
                return false;
            }
        }

        public async Task<bool> SeedTestDataAsync()
        {
            try
            {
                // Skapa admin-användare
                await CreateAdminUsersAsync();

                // Skapa vanliga användare
                await CreateRegularUsersAsync();

                // Skapa testkunder
                await CreateTestCustomersAsync();

                return true;
            }
            catch
            {
                return false;
            }
        }

        private async Task CreateRolesAsync()
        {
            if (!await _roleManager.RoleExistsAsync("Admin"))
            {
                await _roleManager.CreateAsync(new IdentityRole("Admin"));
            }

            if (!await _roleManager.RoleExistsAsync("User"))
            {
                await _roleManager.CreateAsync(new IdentityRole("User"));
            }
        }

        private async Task CreateAdminUsersAsync()
        {
            var adminUsers = new[]
            {
                new { Email = "admin1@test.com", FirstName = "Admin1", LastName = "Admin", Password = "Admin123!" },
                new { Email = "admin2@test.com", FirstName = "Admin2", LastName = "Admin", Password = "Admin123!" }
            };

            foreach (var admin in adminUsers)
            {
                var existingUser = await _userManager.FindByEmailAsync(admin.Email);
                if (existingUser == null)
                {
                    var user = new ApplicationUser
                    {
                        UserName = admin.Email,
                        Email = admin.Email,
                        FirstName = admin.FirstName,
                        LastName = admin.LastName
                    };

                    var result = await _userManager.CreateAsync(user, admin.Password);
                    if (result.Succeeded)
                    {
                        await _userManager.AddToRoleAsync(user, "Admin");
                    }
                }
            }
        }

        private async Task CreateRegularUsersAsync()
        {
            var regularUsers = new[]
            {
                new { Email = "user1@test.com", FirstName = "User1", LastName = "User", Password = "User123!" },
                new { Email = "user2@test.com", FirstName = "User2", LastName = "User", Password = "User123!" },
                new { Email = "user3@test.com", FirstName = "User3", LastName = "User", Password = "User123!" }
            };

            foreach (var regular in regularUsers)
            {
                var existingUser = await _userManager.FindByEmailAsync(regular.Email);
                if (existingUser == null)
                {
                    var user = new ApplicationUser
                    {
                        UserName = regular.Email,
                        Email = regular.Email,
                        FirstName = regular.FirstName,
                        LastName = regular.LastName
                    };

                    var result = await _userManager.CreateAsync(user, regular.Password);
                    if (result.Succeeded)
                    {
                        await _userManager.AddToRoleAsync(user, "User");
                    }
                }
            }
        }

        private async Task CreateTestCustomersAsync()
        {
            var user1 = await _userManager.FindByEmailAsync("user1@test.com");
            var user2 = await _userManager.FindByEmailAsync("user2@test.com");
            var user3 = await _userManager.FindByEmailAsync("user3@test.com");

            if (user1 != null)
            {
                await CreateCustomersForUser(user1.Id, "user1");
            }

            if (user2 != null)
            {
                await CreateCustomersForUser(user2.Id, "user2");
            }

            if (user3 != null)
            {
                await CreateCustomersForUser(user3.Id, "user3");
            }
        }

        private async Task CreateCustomersForUser(string userId, string userPrefix)
        {
            var userNumber = userPrefix[^1]; // Tar sista karaktären (1, 2, eller 3)
            var customers = new[]
            {
                new Customer
                {
                    FirstName = "Test",
                    LastName = $"Customer{userNumber}1",
                    Email = $"customer{userNumber}1@test.com",
                    Phone = $"070-{userNumber}111111",
                    Address = $"Testgatan {userNumber}1",
                    City = "Teststad",
                    PostalCode = $"{userNumber}2345",
                    Country = "Sverige",
                    UserId = userId,
                    CreatedAt = DateTime.UtcNow.AddDays(-10),
                    UpdatedAt = DateTime.UtcNow.AddDays(-10)
                },
                new Customer
                {
                    FirstName = "Demo",
                    LastName = $"Customer{userNumber}2",
                    Email = $"demo{userNumber}2@test.com",
                    Phone = $"070-{userNumber}222222",
                    Address = $"Demogatan {userNumber}2",
                    City = "Demostad",
                    PostalCode = $"{userNumber}5432",
                    Country = "Sverige",
                    UserId = userId,
                    CreatedAt = DateTime.UtcNow.AddDays(-5),
                    UpdatedAt = DateTime.UtcNow.AddDays(-5)
                }
            };

            foreach (var customer in customers)
            {
                var existingCustomer = await _context.Customers
                    .FirstOrDefaultAsync(c => c.Email == customer.Email);
                
                if (existingCustomer == null)
                {
                    _context.Customers.Add(customer);
                }
            }

            await _context.SaveChangesAsync();
        }
    }
}
