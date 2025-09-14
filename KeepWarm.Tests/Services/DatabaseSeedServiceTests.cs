using KeepWarm.Data;
using KeepWarm.Models;
using KeepWarm.Services;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace KeepWarm.Tests.Services
{
    public class DatabaseSeedServiceTests : IDisposable
    {
        private readonly ServiceProvider _serviceProvider;
        private readonly ApplicationDbContext _context;
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly RoleManager<IdentityRole> _roleManager;
        private readonly DatabaseSeedService _seedService;

        public DatabaseSeedServiceTests()
        {
            var services = new ServiceCollection();
            
            // Konfigurera logging
            services.AddLogging();
            
            // Konfigurera in-memory databas för tester
            services.AddDbContext<ApplicationDbContext>(options =>
                options.UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString()));

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

            // Registrera DatabaseSeedService
            services.AddScoped<DatabaseSeedService>();

            _serviceProvider = services.BuildServiceProvider();
            _context = _serviceProvider.GetRequiredService<ApplicationDbContext>();
            _userManager = _serviceProvider.GetRequiredService<UserManager<ApplicationUser>>();
            _roleManager = _serviceProvider.GetRequiredService<RoleManager<IdentityRole>>();
            _seedService = _serviceProvider.GetRequiredService<DatabaseSeedService>();

            // Skapa databas
            _context.Database.EnsureCreated();
        }

        [Fact]
        public async Task RecreateDatabaseAsync_ShouldDeleteAndRecreateDatabase()
        {
            // Arrange - Lägg till befintlig data
            var existingUser = new ApplicationUser
            {
                Id = "existing-user",
                UserName = "existing@test.com",
                Email = "existing@test.com"
            };
            await _userManager.CreateAsync(existingUser, "Existing123!");
            await _context.SaveChangesAsync();

            // Act
            var result = await _seedService.RecreateDatabaseAsync();

            // Assert
            Assert.True(result);
            
            // Verifiera att befintlig data är borttagen
            var users = await _userManager.Users.ToListAsync();
            Assert.Empty(users);
            
            // Verifiera att roller är skapade
            var adminRoleExists = await _roleManager.RoleExistsAsync("Admin");
            var userRoleExists = await _roleManager.RoleExistsAsync("User");
            Assert.True(adminRoleExists);
            Assert.True(userRoleExists);
        }

        [Fact]
        public async Task SeedTestDataAsync_ShouldCreateAdminUsers()
        {
            // Arrange
            await _seedService.RecreateDatabaseAsync();

            // Act
            var result = await _seedService.SeedTestDataAsync();

            // Assert
            Assert.True(result);

            // Verifiera att admin-användare är skapade
            var admin1 = await _userManager.FindByEmailAsync("admin1@test.com");
            var admin2 = await _userManager.FindByEmailAsync("admin2@test.com");

            Assert.NotNull(admin1);
            Assert.NotNull(admin2);
            Assert.Equal("Admin1", admin1.FirstName);
            Assert.Equal("Andersson", admin1.LastName);
            Assert.Equal("Admin2", admin2.FirstName);
            Assert.Equal("Andersson", admin2.LastName);

            // Verifiera att de har Admin-roll
            var admin1Roles = await _userManager.GetRolesAsync(admin1);
            var admin2Roles = await _userManager.GetRolesAsync(admin2);
            Assert.Contains("Admin", admin1Roles);
            Assert.Contains("Admin", admin2Roles);
        }

        [Fact]
        public async Task SeedTestDataAsync_ShouldCreateRegularUsers()
        {
            // Arrange
            await _seedService.RecreateDatabaseAsync();

            // Act
            var result = await _seedService.SeedTestDataAsync();

            // Assert
            Assert.True(result);

            // Verifiera att vanliga användare är skapade
            var user1 = await _userManager.FindByEmailAsync("user1@test.com");
            var user2 = await _userManager.FindByEmailAsync("user2@test.com");
            var user3 = await _userManager.FindByEmailAsync("user3@test.com");

            Assert.NotNull(user1);
            Assert.NotNull(user2);
            Assert.NotNull(user3);
            Assert.Equal("User1", user1.FirstName);
            Assert.Equal("Uggla", user1.LastName);
            Assert.Equal("User2", user2.FirstName);
            Assert.Equal("Uggla", user2.LastName);
            Assert.Equal("User3", user3.FirstName);
            Assert.Equal("Uggla", user3.LastName);

            // Verifiera att de har User-roll
            var user1Roles = await _userManager.GetRolesAsync(user1);
            var user2Roles = await _userManager.GetRolesAsync(user2);
            var user3Roles = await _userManager.GetRolesAsync(user3);
            Assert.Contains("User", user1Roles);
            Assert.Contains("User", user2Roles);
            Assert.Contains("User", user3Roles);
        }

        [Fact]
        public async Task SeedTestDataAsync_ShouldCreateTestCustomers()
        {
            // Arrange
            await _seedService.RecreateDatabaseAsync();

            // Act
            var result = await _seedService.SeedTestDataAsync();

            // Assert
            Assert.True(result);

            // Verifiera att testkunder är skapade
            var customers = await _context.Customers.ToListAsync();
            Assert.Equal(6, customers.Count); // 2 kunder per användare

            // Verifiera att kunderna tillhör rätt användare
            var user1 = await _userManager.FindByEmailAsync("user1@test.com");
            var user2 = await _userManager.FindByEmailAsync("user2@test.com");
            var user3 = await _userManager.FindByEmailAsync("user3@test.com");

            Assert.NotNull(user1);
            Assert.NotNull(user2);
            Assert.NotNull(user3);

            var user1Customers = customers.Where(c => c.UserId == user1.Id).ToList();
            var user2Customers = customers.Where(c => c.UserId == user2.Id).ToList();
            var user3Customers = customers.Where(c => c.UserId == user3.Id).ToList();

            Assert.Equal(2, user1Customers.Count);
            Assert.Equal(2, user2Customers.Count);
            Assert.Equal(2, user3Customers.Count);

            // Verifiera att kunderna har korrekt data
            var customer1 = user1Customers.First();
            Assert.Equal("Anna", customer1.FirstName);
            Assert.Equal("Andersson", customer1.LastName);
            Assert.Equal("anna.andersson@example.com", customer1.Email);
            Assert.Equal("070-1234567", customer1.Phone);
            Assert.Equal("Storgatan 15", customer1.Address);
            Assert.Equal("Stockholm", customer1.City);
            Assert.Equal("11122", customer1.PostalCode);
        }

        [Fact]
        public async Task RecreateDatabaseAsync_ShouldReturnTrue_WhenSuccessful()
        {
            // Act
            var result = await _seedService.RecreateDatabaseAsync();

            // Assert
            Assert.True(result);
        }

        [Fact]
        public async Task SeedTestDataAsync_ShouldNotCreateDuplicateUsers()
        {
            // Arrange
            await _seedService.RecreateDatabaseAsync();
            await _seedService.SeedTestDataAsync(); // Första körningen

            // Act - Kör igen
            var result = await _seedService.SeedTestDataAsync();

            // Assert
            Assert.True(result);

            // Verifiera att inga duplicerade användare skapades
            var admin1Count = await _userManager.Users.CountAsync(u => u.Email == "admin1@test.com");
            var user1Count = await _userManager.Users.CountAsync(u => u.Email == "user1@test.com");
            
            Assert.Equal(1, admin1Count);
            Assert.Equal(1, user1Count);
        }

        [Fact]
        public async Task SeedTestDataAsync_ShouldNotCreateDuplicateCustomers()
        {
            // Arrange
            await _seedService.RecreateDatabaseAsync();
            await _seedService.SeedTestDataAsync(); // Första körningen

            // Act - Kör igen
            var result = await _seedService.SeedTestDataAsync();

            // Assert
            Assert.True(result);

            // Verifiera att inga duplicerade kunder skapades
            var customerCount = await _context.Customers.CountAsync();
            Assert.Equal(6, customerCount); // Fortfarande bara 6 kunder totalt
        }

        public void Dispose()
        {
            _context?.Dispose();
            _serviceProvider?.Dispose();
        }
    }
}
