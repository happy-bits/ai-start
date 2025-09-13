using CustomerManagement.Data;
using CustomerManagement.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace CustomerManagement.Tests.Services
{
    public class IdentityServiceTests : IDisposable
    {
        private readonly ServiceProvider _serviceProvider;
        private readonly ApplicationDbContext _context;
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly RoleManager<IdentityRole> _roleManager;

        public IdentityServiceTests()
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

            _serviceProvider = services.BuildServiceProvider();
            _context = _serviceProvider.GetRequiredService<ApplicationDbContext>();
            _userManager = _serviceProvider.GetRequiredService<UserManager<ApplicationUser>>();
            _roleManager = _serviceProvider.GetRequiredService<RoleManager<IdentityRole>>();

            // Skapa databas
            _context.Database.EnsureCreated();
        }

        [Fact]
        public async Task UserManager_ShouldCreateUserSuccessfully()
        {
            // Arrange
            var user = new ApplicationUser
            {
                UserName = "test@example.com",
                Email = "test@example.com",
                FirstName = "Test",
                LastName = "User"
            };

            // Act
            var result = await _userManager.CreateAsync(user, "Password123!");

            // Assert
            Assert.True(result.Succeeded);
            Assert.NotNull(user.Id);
            Assert.True(user.CreatedAt > DateTime.MinValue);
            Assert.True(user.UpdatedAt > DateTime.MinValue);
        }

        [Fact]
        public async Task UserManager_ShouldValidatePasswordRequirements()
        {
            // Arrange
            var user = new ApplicationUser
            {
                UserName = "test@example.com",
                Email = "test@example.com"
            };

            // Act & Assert - För svagt lösenord
            var weakPasswordResult = await _userManager.CreateAsync(user, "weak");
            Assert.False(weakPasswordResult.Succeeded);
            Assert.Contains(weakPasswordResult.Errors, e => e.Code == "PasswordTooShort");

            // Act & Assert - För starkt lösenord
            var strongPasswordResult = await _userManager.CreateAsync(user, "StrongPass123!");
            Assert.True(strongPasswordResult.Succeeded);
        }

        [Fact]
        public async Task UserManager_ShouldRequireUniqueEmail()
        {
            // Arrange
            var user1 = new ApplicationUser
            {
                UserName = "test1@example.com",
                Email = "test1@example.com"
            };

            var user2 = new ApplicationUser
            {
                UserName = "test2@example.com",
                Email = "test1@example.com" // Samma e-post som user1
            };

            // Act
            var result1 = await _userManager.CreateAsync(user1, "Password123!");
            var result2 = await _userManager.CreateAsync(user2, "Password123!");

            // Assert
            Assert.True(result1.Succeeded);
            Assert.False(result2.Succeeded);
            Assert.Contains(result2.Errors, e => e.Code == "DuplicateEmail");
        }

        [Fact]
        public async Task RoleManager_ShouldCreateRolesSuccessfully()
        {
            // Act
            var adminRoleResult = await _roleManager.CreateAsync(new IdentityRole("Admin"));
            var userRoleResult = await _roleManager.CreateAsync(new IdentityRole("User"));

            // Assert
            Assert.True(adminRoleResult.Succeeded);
            Assert.True(userRoleResult.Succeeded);
        }

        [Fact]
        public async Task UserManager_ShouldAssignRolesToUsers()
        {
            // Arrange
            var user = new ApplicationUser
            {
                UserName = "admin@example.com",
                Email = "admin@example.com"
            };

            await _userManager.CreateAsync(user, "Password123!");
            await _roleManager.CreateAsync(new IdentityRole("Admin"));

            // Act
            var result = await _userManager.AddToRoleAsync(user, "Admin");

            // Assert
            Assert.True(result.Succeeded);
            var roles = await _userManager.GetRolesAsync(user);
            Assert.Contains("Admin", roles);
        }

        [Fact]
        public async Task UserManager_ShouldAuthenticateUserWithCorrectPassword()
        {
            // Arrange
            var user = new ApplicationUser
            {
                UserName = "test@example.com",
                Email = "test@example.com"
            };

            await _userManager.CreateAsync(user, "Password123!");

            // Act
            var result = await _userManager.CheckPasswordAsync(user, "Password123!");

            // Assert
            Assert.True(result);
        }

        [Fact]
        public async Task UserManager_ShouldRejectUserWithIncorrectPassword()
        {
            // Arrange
            var user = new ApplicationUser
            {
                UserName = "test@example.com",
                Email = "test@example.com"
            };

            await _userManager.CreateAsync(user, "Password123!");

            // Act
            var result = await _userManager.CheckPasswordAsync(user, "WrongPassword");

            // Assert
            Assert.False(result);
        }

        [Fact]
        public async Task UserManager_ShouldFindUserByEmail()
        {
            // Arrange
            var user = new ApplicationUser
            {
                UserName = "test@example.com",
                Email = "test@example.com"
            };

            await _userManager.CreateAsync(user, "Password123!");

            // Act
            var foundUser = await _userManager.FindByEmailAsync("test@example.com");

            // Assert
            Assert.NotNull(foundUser);
            Assert.Equal(user.Id, foundUser.Id);
            Assert.Equal("test@example.com", foundUser.Email);
        }

        [Fact]
        public async Task UserManager_ShouldUpdateUserInformation()
        {
            // Arrange
            var user = new ApplicationUser
            {
                UserName = "test@example.com",
                Email = "test@example.com",
                FirstName = "Original",
                LastName = "Name"
            };

            await _userManager.CreateAsync(user, "Password123!");

            // Act
            user.FirstName = "Updated";
            user.LastName = "Name";
            user.UpdatedAt = DateTime.UtcNow;
            var result = await _userManager.UpdateAsync(user);

            // Assert
            Assert.True(result.Succeeded);
            var updatedUser = await _userManager.FindByIdAsync(user.Id);
            Assert.NotNull(updatedUser);
            Assert.Equal("Updated", updatedUser.FirstName);
        }

        [Fact]
        public async Task RoleManager_ShouldPreventDuplicateRoles()
        {
            // Arrange
            var role = new IdentityRole("Admin");

            // Act
            var result1 = await _roleManager.CreateAsync(role);
            var result2 = await _roleManager.CreateAsync(new IdentityRole("Admin"));

            // Assert
            Assert.True(result1.Succeeded);
            Assert.False(result2.Succeeded);
            Assert.Contains(result2.Errors, e => e.Code == "DuplicateRoleName");
        }

        public void Dispose()
        {
            _context?.Dispose();
            _serviceProvider?.Dispose();
        }
    }
}
