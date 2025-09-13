using CustomerManagement.Data;
using CustomerManagement.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace CustomerManagement.Services
{
    public class DatabaseSeedService : IDatabaseSeedService
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
                new { Email = "admin1@test.com", FirstName = "Admin1", LastName = "Andersson", Password = "Admin123!" },
                new { Email = "admin2@test.com", FirstName = "Admin2", LastName = "Andersson", Password = "Admin123!" }
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
                new { Email = "user1@test.com", FirstName = "User1", LastName = "Uggla", Password = "User123!" },
                new { Email = "user2@test.com", FirstName = "User2", LastName = "Uggla", Password = "User123!" },
                new { Email = "user3@test.com", FirstName = "User3", LastName = "Uggla", Password = "User123!" }
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
            
            // Olika namn och adresser baserat på användarnummer
            var customerData = userNumber switch
            {
                '1' => new[]
                {
                    new { FirstName = "Anna", LastName = "Andersson", Email = "anna.andersson@example.com", Phone = "070-1234567", Address = "Storgatan 15", City = "Stockholm", PostalCode = "11122" },
                    new { FirstName = "Erik", LastName = "Eriksson", Email = "erik.eriksson@example.com", Phone = "070-2345678", Address = "Vasagatan 8", City = "Stockholm", PostalCode = "11123" }
                },
                '2' => new[]
                {
                    new { FirstName = "Maria", LastName = "Gustavsson", Email = "maria.gustavsson@example.com", Phone = "070-3456789", Address = "Kungsgatan 42", City = "Göteborg", PostalCode = "41119" },
                    new { FirstName = "Lars", LastName = "Larsson", Email = "lars.larsson@example.com", Phone = "070-4567890", Address = "Avenyn 12", City = "Göteborg", PostalCode = "41120" }
                },
                '3' => new[]
                {
                    new { FirstName = "Sofia", LastName = "Johansson", Email = "sofia.johansson@example.com", Phone = "070-5678901", Address = "Stortorget 3", City = "Malmö", PostalCode = "21122" },
                    new { FirstName = "Johan", LastName = "Nilsson", Email = "johan.nilsson@example.com", Phone = "070-6789012", Address = "Lilla Torg 7", City = "Malmö", PostalCode = "21123" }
                },
                _ => new[]
                {
                    new { FirstName = "Test", LastName = "Testsson", Email = "test@example.com", Phone = "070-0000000", Address = "Testgatan 1", City = "Teststad", PostalCode = "00000" },
                    new { FirstName = "Demo", LastName = "Demoss", Email = "demo@example.com", Phone = "070-1111111", Address = "Demogatan 1", City = "Demostad", PostalCode = "11111" }
                }
            };

            var customers = customerData.Select(data => new Customer
            {
                FirstName = data.FirstName,
                LastName = data.LastName,
                Email = data.Email,
                Phone = data.Phone,
                Address = data.Address,
                City = data.City,
                PostalCode = data.PostalCode,
                Country = "Sverige",
                UserId = userId,
                CreatedAt = DateTime.UtcNow.AddDays(-10),
                UpdatedAt = DateTime.UtcNow.AddDays(-10)
            }).ToArray();

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
