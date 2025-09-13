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

            // Registrera IdentityService och CustomerService
            services.AddScoped<CustomerManagement.Services.IdentityService>();
            services.AddScoped<CustomerManagement.Services.ICustomerService, CustomerManagement.Services.CustomerService>();

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

        [Fact]
        public async Task AdminCreateUserAndLogin_EndToEndTest()
        {
            // Arrange - Skapa Admin-rollen
            await _roleManager.CreateAsync(new IdentityRole("Admin"));
            await _roleManager.CreateAsync(new IdentityRole("User"));

            // Skapa admin-användare
            var admin = new ApplicationUser
            {
                UserName = "admin@example.com",
                Email = "admin@example.com",
                FirstName = "Admin",
                LastName = "User"
            };
            await _userManager.CreateAsync(admin, "AdminPassword123!");
            await _userManager.AddToRoleAsync(admin, "Admin");

            // Act - Admin skapar en ny användare
            var newUser = new ApplicationUser
            {
                UserName = "newuser@example.com",
                Email = "newuser@example.com",
                FirstName = "New",
                LastName = "User"
            };
            var createResult = await _userManager.CreateAsync(newUser, "NewUserPassword123!");
            await _userManager.AddToRoleAsync(newUser, "User");

            // Assert - Verifiera att användaren skapades korrekt
            Assert.True(createResult.Succeeded);
            Assert.NotNull(newUser.Id);
            
            // Verifiera att användaren finns i databasen
            var foundUser = await _userManager.FindByEmailAsync("newuser@example.com");
            Assert.NotNull(foundUser);
            Assert.Equal("New", foundUser.FirstName);
            Assert.Equal("User", foundUser.LastName);

            // Verifiera att användaren har User-roll
            var userRoles = await _userManager.GetRolesAsync(foundUser);
            Assert.Contains("User", userRoles);

            // Act - Den nya användaren försöker logga in
            var loginResult = await _userManager.CheckPasswordAsync(foundUser, "NewUserPassword123!");

            // Assert - Verifiera att inloggningen fungerar
            Assert.True(loginResult);

            // Act - Testa att fel lösenord inte fungerar
            var wrongPasswordResult = await _userManager.CheckPasswordAsync(foundUser, "WrongPassword");
            Assert.False(wrongPasswordResult);

            // Act - Verifiera att admin fortfarande kan logga in
            var adminLoginResult = await _userManager.CheckPasswordAsync(admin, "AdminPassword123!");
            Assert.True(adminLoginResult);

            // Verifiera att admin har Admin-roll
            var adminRoles = await _userManager.GetRolesAsync(admin);
            Assert.Contains("Admin", adminRoles);
        }

        [Fact]
        public async Task IdentityService_CreateUserAsync_ShouldReturnTrue_WhenUserIsCreatedSuccessfully()
        {
            // Arrange
            using var scope = _serviceProvider.CreateScope();
            var identityService = scope.ServiceProvider.GetRequiredService<CustomerManagement.Services.IdentityService>();
            
            var user = new ApplicationUser
            {
                UserName = "identitytest@example.com",
                Email = "identitytest@example.com",
                FirstName = "Identity",
                LastName = "Test"
            };

            // Act
            var result = await identityService.CreateUserAsync(user, "IdentityTest123!");

            // Assert
            Assert.True(result);
            
            var createdUser = await identityService.FindUserByEmailAsync("identitytest@example.com");
            Assert.NotNull(createdUser);
            Assert.Equal("Identity", createdUser.FirstName);
        }

        [Fact]
        public async Task IdentityService_CreateUserAsync_ShouldReturnFalse_WhenUserCreationFails()
        {
            // Arrange
            using var scope = _serviceProvider.CreateScope();
            var identityService = scope.ServiceProvider.GetRequiredService<CustomerManagement.Services.IdentityService>();
            
            var user = new ApplicationUser
            {
                UserName = "invalid-email", // Invalid email format
                Email = "invalid-email",
                FirstName = "Invalid",
                LastName = "User"
            };

            // Act
            var result = await identityService.CreateUserAsync(user, "weak"); // Weak password

            // Assert
            Assert.False(result);
        }

        [Fact]
        public async Task IdentityService_CreateRoleAsync_ShouldReturnTrue_WhenRoleIsCreatedSuccessfully()
        {
            // Arrange
            using var scope = _serviceProvider.CreateScope();
            var identityService = scope.ServiceProvider.GetRequiredService<CustomerManagement.Services.IdentityService>();

            // Act
            var result = await identityService.CreateRoleAsync("TestRole");

            // Assert
            Assert.True(result);
            
            var roleManager = scope.ServiceProvider.GetRequiredService<RoleManager<IdentityRole>>();
            var roleExists = await roleManager.RoleExistsAsync("TestRole");
            Assert.True(roleExists);
        }

        [Fact]
        public async Task IdentityService_AssignRoleToUserAsync_ShouldReturnTrue_WhenRoleIsAssignedSuccessfully()
        {
            // Arrange
            using var scope = _serviceProvider.CreateScope();
            var identityService = scope.ServiceProvider.GetRequiredService<CustomerManagement.Services.IdentityService>();
            
            // Skapa användare och roll
            var user = new ApplicationUser { UserName = "roletest@example.com", Email = "roletest@example.com" };
            await identityService.CreateUserAsync(user, "RoleTest123!");
            await identityService.CreateRoleAsync("TestAssignRole");
            
            var createdUser = await identityService.FindUserByEmailAsync("roletest@example.com");

            // Act
            var result = await identityService.AssignRoleToUserAsync(createdUser!.Id, "TestAssignRole");

            // Assert
            Assert.True(result);
            
            var userRoles = await identityService.GetUserRolesAsync(createdUser.Id);
            Assert.Contains("TestAssignRole", userRoles);
        }

        [Fact]
        public async Task IdentityService_AssignRoleToUserAsync_ShouldReturnFalse_WhenUserDoesNotExist()
        {
            // Arrange
            using var scope = _serviceProvider.CreateScope();
            var identityService = scope.ServiceProvider.GetRequiredService<CustomerManagement.Services.IdentityService>();
            
            await identityService.CreateRoleAsync("TestRole");

            // Act
            var result = await identityService.AssignRoleToUserAsync("nonexistent-user-id", "TestRole");

            // Assert
            Assert.False(result);
        }

        [Fact]
        public async Task IdentityService_RemoveRoleFromUserAsync_ShouldReturnTrue_WhenRoleIsRemovedSuccessfully()
        {
            // Arrange
            using var scope = _serviceProvider.CreateScope();
            var identityService = scope.ServiceProvider.GetRequiredService<CustomerManagement.Services.IdentityService>();
            
            // Skapa användare, roll och tilldela rollen
            var user = new ApplicationUser { UserName = "removetest@example.com", Email = "removetest@example.com" };
            await identityService.CreateUserAsync(user, "RemoveTest123!");
            await identityService.CreateRoleAsync("RemoveTestRole");
            
            var createdUser = await identityService.FindUserByEmailAsync("removetest@example.com");
            await identityService.AssignRoleToUserAsync(createdUser!.Id, "RemoveTestRole");

            // Act
            var result = await identityService.RemoveRoleFromUserAsync(createdUser.Id, "RemoveTestRole");

            // Assert
            Assert.True(result);
            
            var userRoles = await identityService.GetUserRolesAsync(createdUser.Id);
            Assert.DoesNotContain("RemoveTestRole", userRoles);
        }

        [Fact]
        public async Task IdentityService_GetUserRolesAsync_ShouldReturnEmptyList_WhenUserDoesNotExist()
        {
            // Arrange
            using var scope = _serviceProvider.CreateScope();
            var identityService = scope.ServiceProvider.GetRequiredService<CustomerManagement.Services.IdentityService>();

            // Act
            var roles = await identityService.GetUserRolesAsync("nonexistent-user-id");

            // Assert
            Assert.Empty(roles);
        }

        [Fact]
        public async Task IdentityService_IsUserInRoleAsync_ShouldReturnTrue_WhenUserHasRole()
        {
            // Arrange
            using var scope = _serviceProvider.CreateScope();
            var identityService = scope.ServiceProvider.GetRequiredService<CustomerManagement.Services.IdentityService>();
            
            var user = new ApplicationUser { UserName = "rolecheck@example.com", Email = "rolecheck@example.com" };
            await identityService.CreateUserAsync(user, "RoleCheck123!");
            await identityService.CreateRoleAsync("CheckRole");
            
            var createdUser = await identityService.FindUserByEmailAsync("rolecheck@example.com");
            await identityService.AssignRoleToUserAsync(createdUser!.Id, "CheckRole");

            // Act
            var result = await identityService.IsUserInRoleAsync(createdUser.Id, "CheckRole");

            // Assert
            Assert.True(result);
        }

        [Fact]
        public async Task IdentityService_IsUserInRoleAsync_ShouldReturnFalse_WhenUserDoesNotHaveRole()
        {
            // Arrange
            using var scope = _serviceProvider.CreateScope();
            var identityService = scope.ServiceProvider.GetRequiredService<CustomerManagement.Services.IdentityService>();
            
            var user = new ApplicationUser { UserName = "norole@example.com", Email = "norole@example.com" };
            await identityService.CreateUserAsync(user, "NoRole123!");
            await identityService.CreateRoleAsync("SomeRole");
            
            var createdUser = await identityService.FindUserByEmailAsync("norole@example.com");

            // Act
            var result = await identityService.IsUserInRoleAsync(createdUser!.Id, "SomeRole");

            // Assert
            Assert.False(result);
        }

        [Fact]
        public async Task IdentityService_FindUserByEmailAsync_ShouldReturnNull_WhenUserDoesNotExist()
        {
            // Arrange
            using var scope = _serviceProvider.CreateScope();
            var identityService = scope.ServiceProvider.GetRequiredService<CustomerManagement.Services.IdentityService>();

            // Act
            var user = await identityService.FindUserByEmailAsync("nonexistent@example.com");

            // Assert
            Assert.Null(user);
        }

        [Fact]
        public async Task IdentityService_FindUserByIdAsync_ShouldReturnNull_WhenUserDoesNotExist()
        {
            // Arrange
            using var scope = _serviceProvider.CreateScope();
            var identityService = scope.ServiceProvider.GetRequiredService<CustomerManagement.Services.IdentityService>();

            // Act
            var user = await identityService.FindUserByIdAsync("nonexistent-id");

            // Assert
            Assert.Null(user);
        }

        [Fact]
        public async Task IdentityService_ValidatePasswordAsync_ShouldReturnTrue_WhenPasswordIsCorrect()
        {
            // Arrange
            using var scope = _serviceProvider.CreateScope();
            var identityService = scope.ServiceProvider.GetRequiredService<CustomerManagement.Services.IdentityService>();
            
            var user = new ApplicationUser { UserName = "validate@example.com", Email = "validate@example.com" };
            await identityService.CreateUserAsync(user, "ValidatePass123!");
            
            var createdUser = await identityService.FindUserByEmailAsync("validate@example.com");

            // Act
            var result = await identityService.ValidatePasswordAsync(createdUser!, "ValidatePass123!");

            // Assert
            Assert.True(result);
        }

        [Fact]
        public async Task IdentityService_ValidatePasswordAsync_ShouldReturnFalse_WhenPasswordIsIncorrect()
        {
            // Arrange
            using var scope = _serviceProvider.CreateScope();
            var identityService = scope.ServiceProvider.GetRequiredService<CustomerManagement.Services.IdentityService>();
            
            var user = new ApplicationUser { UserName = "validate2@example.com", Email = "validate2@example.com" };
            await identityService.CreateUserAsync(user, "ValidatePass123!");
            
            var createdUser = await identityService.FindUserByEmailAsync("validate2@example.com");

            // Act
            var result = await identityService.ValidatePasswordAsync(createdUser!, "WrongPassword");

            // Assert
            Assert.False(result);
        }

        [Fact]
        public async Task IdentityService_UpdateUserAsync_ShouldReturnTrue_WhenUserIsUpdatedSuccessfully()
        {
            // Arrange
            using var scope = _serviceProvider.CreateScope();
            var identityService = scope.ServiceProvider.GetRequiredService<CustomerManagement.Services.IdentityService>();
            
            var user = new ApplicationUser { UserName = "update@example.com", Email = "update@example.com", FirstName = "Original" };
            await identityService.CreateUserAsync(user, "UpdateTest123!");
            
            var createdUser = await identityService.FindUserByEmailAsync("update@example.com");
            createdUser!.FirstName = "Updated";

            // Act
            var result = await identityService.UpdateUserAsync(createdUser);

            // Assert
            Assert.True(result);
            
            var updatedUser = await identityService.FindUserByEmailAsync("update@example.com");
            Assert.Equal("Updated", updatedUser!.FirstName);
        }

        [Fact]
        public async Task IdentityService_DeleteUserAsync_ShouldReturnTrue_WhenUserIsDeletedSuccessfully()
        {
            // Arrange
            using var scope = _serviceProvider.CreateScope();
            var identityService = scope.ServiceProvider.GetRequiredService<CustomerManagement.Services.IdentityService>();
            
            var user = new ApplicationUser { UserName = "delete@example.com", Email = "delete@example.com" };
            await identityService.CreateUserAsync(user, "DeleteTest123!");
            
            var createdUser = await identityService.FindUserByEmailAsync("delete@example.com");

            // Act
            var result = await identityService.DeleteUserAsync(createdUser!.Id);

            // Assert
            Assert.True(result);
            
            var deletedUser = await identityService.FindUserByEmailAsync("delete@example.com");
            Assert.Null(deletedUser);
        }

        [Fact]
        public async Task IdentityService_DeleteUserAsync_ShouldReturnFalse_WhenUserDoesNotExist()
        {
            // Arrange
            using var scope = _serviceProvider.CreateScope();
            var identityService = scope.ServiceProvider.GetRequiredService<CustomerManagement.Services.IdentityService>();

            // Act
            var result = await identityService.DeleteUserAsync("nonexistent-id");

            // Assert
            Assert.False(result);
        }

        [Fact]
        public async Task IdentityService_GetAllUsersAsync_ShouldReturnAllUsers()
        {
            // Arrange
            using var scope = _serviceProvider.CreateScope();
            var identityService = scope.ServiceProvider.GetRequiredService<CustomerManagement.Services.IdentityService>();
            
            await identityService.CreateUserAsync(new ApplicationUser { UserName = "user1@all.com", Email = "user1@all.com" }, "User1Pass123!");
            await identityService.CreateUserAsync(new ApplicationUser { UserName = "user2@all.com", Email = "user2@all.com" }, "User2Pass123!");

            // Act
            var users = await identityService.GetAllUsersAsync();

            // Assert
            var userList = users.ToList();
            Assert.True(userList.Count >= 2);
            Assert.Contains(userList, u => u.Email == "user1@all.com");
            Assert.Contains(userList, u => u.Email == "user2@all.com");
        }

        [Fact]
        public async Task IdentityService_InitializeRolesAsync_ShouldCreateAdminAndUserRoles()
        {
            // Arrange
            using var scope = _serviceProvider.CreateScope();
            var identityService = scope.ServiceProvider.GetRequiredService<CustomerManagement.Services.IdentityService>();
            var roleManager = scope.ServiceProvider.GetRequiredService<RoleManager<IdentityRole>>();

            // Act
            var result = await identityService.InitializeRolesAsync();

            // Assert
            Assert.True(result);
            
            var adminRoleExists = await roleManager.RoleExistsAsync("Admin");
            var userRoleExists = await roleManager.RoleExistsAsync("User");
            
            Assert.True(adminRoleExists);
            Assert.True(userRoleExists);
        }

        [Fact]
        public async Task IdentityService_GetAllCustomersAsync_ShouldReturnCustomersForUser()
        {
            // Arrange
            using var scope = _serviceProvider.CreateScope();
            var identityService = scope.ServiceProvider.GetRequiredService<CustomerManagement.Services.IdentityService>();
            var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            
            var user = new ApplicationUser { UserName = "customer@example.com", Email = "customer@example.com" };
            await identityService.CreateUserAsync(user, "CustomerTest123!");
            var createdUser = await identityService.FindUserByEmailAsync("customer@example.com");
            
            // Lägg till kunder
            var customers = new[]
            {
                new Customer { FirstName = "Customer1", LastName = "Test", Email = "c1@test.com", UserId = createdUser!.Id },
                new Customer { FirstName = "Customer2", LastName = "Test", Email = "c2@test.com", UserId = createdUser.Id }
            };
            
            context.Customers.AddRange(customers);
            await context.SaveChangesAsync();

            // Act
            var result = await identityService.GetAllCustomersAsync(createdUser.Id);

            // Assert
            var customerList = result.ToList();
            Assert.Equal(2, customerList.Count);
            Assert.Contains(customerList, c => c.FirstName == "Customer1");
            Assert.Contains(customerList, c => c.FirstName == "Customer2");
        }

        [Fact]
        public async Task IdentityService_SetCustomersUserIdToNullAsync_ShouldSetUserIdToNull()
        {
            // Arrange
            using var scope = _serviceProvider.CreateScope();
            var identityService = scope.ServiceProvider.GetRequiredService<CustomerManagement.Services.IdentityService>();
            var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            
            var user = new ApplicationUser { UserName = "nulltest@example.com", Email = "nulltest@example.com" };
            await identityService.CreateUserAsync(user, "NullTest123!");
            var createdUser = await identityService.FindUserByEmailAsync("nulltest@example.com");
            
            // Lägg till kunder
            var customers = new[]
            {
                new Customer { FirstName = "NullCustomer1", LastName = "Test", Email = "nc1@test.com", UserId = createdUser!.Id },
                new Customer { FirstName = "NullCustomer2", LastName = "Test", Email = "nc2@test.com", UserId = createdUser.Id }
            };
            
            context.Customers.AddRange(customers);
            await context.SaveChangesAsync();

            // Act
            await identityService.SetCustomersUserIdToNullAsync(createdUser.Id);

            // Assert
            var updatedCustomers = await context.Customers
                .Where(c => c.Email.StartsWith("nc"))
                .ToListAsync();
            
            Assert.All(updatedCustomers, c => Assert.Null(c.UserId));
        }

        public void Dispose()
        {
            _context?.Dispose();
            _serviceProvider?.Dispose();
        }
    }
}
