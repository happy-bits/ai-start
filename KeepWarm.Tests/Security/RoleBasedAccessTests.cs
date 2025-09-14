using KeepWarm.Controllers;
using KeepWarm.Controllers.ViewModels;
using KeepWarm.Models;
using KeepWarm.Services;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Moq;
using System.Security.Claims;

namespace KeepWarm.Tests.Security
{
    public class RoleBasedAccessTests
    {
        private readonly Mock<UserManager<ApplicationUser>> _mockUserManager;
        private readonly Mock<SignInManager<ApplicationUser>> _mockSignInManager;
        private readonly Mock<IIdentityService> _mockIdentityService;
        private readonly Mock<ICustomerService> _mockCustomerService;
        private readonly AccountController _accountController;
        private readonly CustomerController _customerController;

        public RoleBasedAccessTests()
        {
            var store = new Mock<IUserStore<ApplicationUser>>();
            _mockUserManager = new Mock<UserManager<ApplicationUser>>(
                store.Object, null!, null!, null!, null!, null!, null!, null!, null!);

            var contextAccessor = new Mock<Microsoft.AspNetCore.Http.IHttpContextAccessor>();
            var claimsFactory = new Mock<IUserClaimsPrincipalFactory<ApplicationUser>>();
            var optionsAccessor = new Mock<Microsoft.Extensions.Options.IOptions<IdentityOptions>>();
            var logger = new Mock<Microsoft.Extensions.Logging.ILogger<SignInManager<ApplicationUser>>>();
            var schemes = new Mock<Microsoft.AspNetCore.Authentication.IAuthenticationSchemeProvider>();

            _mockSignInManager = new Mock<SignInManager<ApplicationUser>>(
                _mockUserManager.Object, contextAccessor.Object, claimsFactory.Object,
                optionsAccessor.Object, logger.Object, schemes.Object, null!);

            _mockIdentityService = new Mock<IIdentityService>();
            _mockCustomerService = new Mock<ICustomerService>();

            _accountController = new AccountController(_mockUserManager.Object, _mockSignInManager.Object, _mockIdentityService.Object);
            _customerController = new CustomerController(_mockCustomerService.Object, new Mock<IInteractionService>().Object, _mockUserManager.Object);
        }

        [Fact]
        public async Task Admin_ShouldAccessManageUsers()
        {
            // Arrange
            var users = new List<ApplicationUser>
            {
                new ApplicationUser { Id = "user1", Email = "user1@test.com" }
            };

            SetupAuthenticatedUser(_accountController, "admin1", true);
            _mockIdentityService.Setup(s => s.GetAllUsersAsync())
                .ReturnsAsync(users);

            // Act
            var result = await _accountController.ManageUsers();

            // Assert
            var viewResult = Assert.IsType<ViewResult>(result);
            var model = Assert.IsAssignableFrom<IEnumerable<ApplicationUser>>(viewResult.Model);
            Assert.Single(model);
        }

        [Fact]
        public void Admin_ShouldAccessCreateUser()
        {
            // Arrange
            SetupAuthenticatedUser(_accountController, "admin1", true);

            // Act
            var result = _accountController.CreateUser();

            // Assert
            Assert.IsType<ViewResult>(result);
        }

        [Fact]
        public async Task Admin_ShouldCreateNewUser()
        {
            // Arrange
            var model = new CreateUserViewModel
            {
                FirstName = "New",
                LastName = "User",
                Email = "new@test.com",
                Password = "NewUser123!"
            };

            SetupAuthenticatedUser(_accountController, "admin1", true);
            _mockUserManager.Setup(m => m.CreateAsync(It.IsAny<ApplicationUser>(), model.Password))
                .ReturnsAsync(IdentityResult.Success);
            _mockUserManager.Setup(m => m.AddToRoleAsync(It.IsAny<ApplicationUser>(), "User"))
                .ReturnsAsync(IdentityResult.Success);

            // Act
            var result = await _accountController.CreateUser(model);

            // Assert
            var redirectResult = Assert.IsType<RedirectToActionResult>(result);
            Assert.Equal("ManageUsers", redirectResult.ActionName);
        }

        [Fact]
        public async Task Admin_ShouldEditRegularUser()
        {
            // Arrange
            var userId = "user123";
            var user = new ApplicationUser
            {
                Id = userId,
                FirstName = "Test",
                LastName = "User",
                Email = "test@test.com"
            };

            SetupAuthenticatedUser(_accountController, "admin1", true);
            _mockUserManager.Setup(m => m.FindByIdAsync(userId))
                .ReturnsAsync(user);
            _mockUserManager.Setup(m => m.GetRolesAsync(user))
                .ReturnsAsync(new List<string> { "User" });

            // Act
            var result = await _accountController.EditUser(userId);

            // Assert
            var viewResult = Assert.IsType<ViewResult>(result);
            var model = Assert.IsAssignableFrom<EditUserViewModel>(viewResult.Model);
            Assert.Equal(userId, model.Id);
        }

        [Fact]
        public async Task Admin_ShouldNotEditAnotherAdmin()
        {
            // Arrange
            var adminUserId = "admin123";
            var targetAdmin = new ApplicationUser
            {
                Id = adminUserId,
                FirstName = "Target",
                LastName = "Admin",
                Email = "target@test.com"
            };

            SetupAuthenticatedUser(_accountController, "admin1", true);
            _mockUserManager.Setup(m => m.FindByIdAsync(adminUserId))
                .ReturnsAsync(targetAdmin);
            _mockUserManager.Setup(m => m.GetRolesAsync(targetAdmin))
                .ReturnsAsync(new List<string> { "Admin" });

            // Act
            var result = await _accountController.EditUser(adminUserId);

            // Assert
            Assert.IsType<ForbidResult>(result);
        }

        [Fact]
        public async Task Admin_ShouldEditTheirOwnProfile()
        {
            // Arrange
            var currentAdminId = "admin1";
            var currentAdmin = new ApplicationUser
            {
                Id = currentAdminId,
                FirstName = "Current",
                LastName = "Admin",
                Email = "admin1@test.com"
            };

            SetupAuthenticatedUser(_accountController, "admin1", true);
            _mockUserManager.Setup(m => m.FindByIdAsync(currentAdminId))
                .ReturnsAsync(currentAdmin);
            _mockUserManager.Setup(m => m.GetUserId(It.IsAny<ClaimsPrincipal>()))
                .Returns("admin1");
            _mockUserManager.Setup(m => m.GetRolesAsync(currentAdmin))
                .ReturnsAsync(new List<string> { "Admin" });

            // Act
            var result = await _accountController.EditUser(currentAdminId);

            // Assert
            var viewResult = Assert.IsType<ViewResult>(result);
            var model = Assert.IsAssignableFrom<EditUserViewModel>(viewResult.Model);
            Assert.Equal(currentAdminId, model.Id);
        }

        [Fact]
        public async Task Admin_ShouldDeleteRegularUser()
        {
            // Arrange
            var userId = "user123";
            var user = new ApplicationUser
            {
                Id = userId,
                FirstName = "Test",
                LastName = "User",
                Email = "test@test.com"
            };

            SetupAuthenticatedUser(_accountController, "admin1", true);
            _mockUserManager.Setup(m => m.FindByIdAsync(userId))
                .ReturnsAsync(user);
            _mockUserManager.Setup(m => m.GetRolesAsync(user))
                .ReturnsAsync(new List<string> { "User" });
            _mockUserManager.Setup(m => m.DeleteAsync(user))
                .ReturnsAsync(IdentityResult.Success);
            _mockIdentityService.Setup(s => s.GetAllCustomersAsync(userId))
                .ReturnsAsync(new List<Customer>());

            // Act
            var result = await _accountController.DeleteUser(userId);

            // Assert
            var redirectResult = Assert.IsType<RedirectToActionResult>(result);
            Assert.Equal("ManageUsers", redirectResult.ActionName);
        }

        [Fact]
        public async Task Admin_ShouldNotDeleteAnotherAdmin()
        {
            // Arrange
            var adminUserId = "admin123";
            var targetAdmin = new ApplicationUser
            {
                Id = adminUserId,
                FirstName = "Target",
                LastName = "Admin",
                Email = "target@test.com"
            };

            SetupAuthenticatedUser(_accountController, "admin1", true);
            _mockUserManager.Setup(m => m.FindByIdAsync(adminUserId))
                .ReturnsAsync(targetAdmin);
            _mockUserManager.Setup(m => m.GetRolesAsync(targetAdmin))
                .ReturnsAsync(new List<string> { "Admin" });

            // Act
            var result = await _accountController.DeleteUser(adminUserId);

            // Assert
            Assert.IsType<ForbidResult>(result);
        }

        [Fact]
        public async Task Admin_ShouldNotDeleteThemselves()
        {
            // Arrange
            var currentAdminId = "admin1";
            var currentAdmin = new ApplicationUser
            {
                Id = currentAdminId,
                FirstName = "Current",
                LastName = "Admin",
                Email = "admin1@test.com"
            };

            SetupAuthenticatedUser(_accountController, "admin1", true);
            _mockUserManager.Setup(m => m.FindByIdAsync(currentAdminId))
                .ReturnsAsync(currentAdmin);
            _mockUserManager.Setup(m => m.GetRolesAsync(currentAdmin))
                .ReturnsAsync(new List<string> { "Admin" });

            // Act
            var result = await _accountController.DeleteUser(currentAdminId);

            // Assert
            Assert.IsType<ForbidResult>(result);
        }

        [Fact]
        public async Task RegularUser_ShouldOnlySeeOwnCustomers()
        {
            // Arrange
            var userId = "user1";
            var userCustomers = new List<Customer>
            {
                new Customer { Id = 1, FirstName = "User1", LastName = "Customer", UserId = userId }
            };

            SetupAuthenticatedUser(_customerController, userId, false);
            _mockCustomerService.Setup(s => s.GetAllCustomersAsync(userId))
                .ReturnsAsync(userCustomers);

            // Act
            var result = await _customerController.Index();

            // Assert
            var viewResult = Assert.IsType<ViewResult>(result);
            var model = Assert.IsAssignableFrom<IEnumerable<Customer>>(viewResult.Model);
            Assert.Single(model);
            Assert.Equal("User1", model.First().FirstName);
        }

        [Fact]
        public async Task RegularUser_ShouldNotAccessOtherUsersCustomer()
        {
            // Arrange
            var userId = "user1";
            var customerId = 999; // Kund som tillhör annan användare

            SetupAuthenticatedUser(_customerController, userId, false);
            _mockCustomerService.Setup(s => s.GetCustomerByIdAsync(customerId, userId))
                .ReturnsAsync((Customer?)null); // Returnerar null för kunder som inte tillhör användaren

            // Act
            var result = await _customerController.Details(customerId);

            // Assert
            Assert.IsType<NotFoundResult>(result);
        }

        [Fact]
        public async Task RegularUser_ShouldNotEditOtherUsersCustomer()
        {
            // Arrange
            var userId = "user1";
            var customerId = 999;

            SetupAuthenticatedUser(_customerController, userId, false);
            _mockCustomerService.Setup(s => s.GetCustomerByIdAsync(customerId, userId))
                .ReturnsAsync((Customer?)null);

            // Act
            var result = await _customerController.Edit(customerId);

            // Assert
            Assert.IsType<NotFoundResult>(result);
        }

        [Fact]
        public async Task RegularUser_ShouldNotDeleteOtherUsersCustomer()
        {
            // Arrange
            var userId = "user1";
            var customerId = 999;

            SetupAuthenticatedUser(_customerController, userId, false);
            _mockCustomerService.Setup(s => s.DeleteCustomerAsync(customerId, userId))
                .ReturnsAsync(false); // Returnerar false för kunder som inte tillhör användaren

            // Act
            var result = await _customerController.DeleteConfirmed(customerId);

            // Assert
            Assert.IsType<NotFoundResult>(result);
        }

        [Fact]
        public async Task Admin_ShouldAccessAllCustomers()
        {
            // Arrange
            var allCustomers = new List<Customer>
            {
                new Customer { Id = 1, FirstName = "Customer1", UserId = "user1" },
                new Customer { Id = 2, FirstName = "Customer2", UserId = "user2" },
                new Customer { Id = 3, FirstName = "Customer3", UserId = null } // Kund utan ägare
            };

            SetupAuthenticatedUser(_customerController, "admin1", true);
            _mockCustomerService.Setup(s => s.GetAllCustomersForAdminAsync())
                .ReturnsAsync(allCustomers);

            // Act
            var result = await _customerController.Index();

            // Assert
            var viewResult = Assert.IsType<ViewResult>(result);
            var model = Assert.IsAssignableFrom<IEnumerable<Customer>>(viewResult.Model);
            Assert.Equal(3, model.Count());
        }

        [Fact]
        public async Task Admin_ShouldAccessAnyCustomer()
        {
            // Arrange
            var customerId = 1;
            var customer = new Customer
            {
                Id = customerId,
                FirstName = "Any",
                LastName = "Customer",
                UserId = "user1"
            };

            SetupAuthenticatedUser(_customerController, "admin1", true);
            _mockCustomerService.Setup(s => s.GetCustomerByIdForAdminAsync(customerId))
                .ReturnsAsync(customer);

            // Act
            var result = await _customerController.Details(customerId);

            // Assert
            var viewResult = Assert.IsType<ViewResult>(result);
            var model = Assert.IsType<Customer>(viewResult.Model);
            Assert.Equal("Any", model.FirstName);
        }

        [Fact]
        public async Task UnauthenticatedUser_ShouldNotAccessCustomerPages()
        {
            // Arrange
            _mockUserManager.Setup(m => m.GetUserId(It.IsAny<ClaimsPrincipal>()))
                .Returns((string?)null);

            // Act
            var result = await _customerController.Index();

            // Assert
            Assert.IsType<UnauthorizedResult>(result);
        }

        [Fact]
        public async Task CustomerOwnership_ShouldBeValidatedCorrectly()
        {
            // Arrange - Användare försöker komma åt egen kund
            var userId = "user1";
            var ownCustomer = new Customer
            {
                Id = 1,
                FirstName = "Own",
                LastName = "Customer",
                UserId = userId
            };

            SetupAuthenticatedUser(_customerController, userId, false);
            _mockCustomerService.Setup(s => s.GetCustomerByIdAsync(1, userId))
                .ReturnsAsync(ownCustomer);

            // Act
            var ownResult = await _customerController.Details(1);

            // Assert - Kan komma åt egen kund
            var ownView = Assert.IsType<ViewResult>(ownResult);
            var ownModel = Assert.IsType<Customer>(ownView.Model);
            Assert.Equal("Own", ownModel.FirstName);

            // Arrange - Användare försöker komma åt annans kund
            _mockCustomerService.Setup(s => s.GetCustomerByIdAsync(2, userId))
                .ReturnsAsync((Customer?)null); // Servicen returnerar null för andras kunder

            // Act
            var othersResult = await _customerController.Details(2);

            // Assert - Kan inte komma åt andras kund
            Assert.IsType<NotFoundResult>(othersResult);
        }

        [Fact]
        public async Task AdminSelfEdit_ShouldBeAllowed()
        {
            // Arrange
            var adminId = "admin1";
            var admin = new ApplicationUser
            {
                Id = adminId,
                FirstName = "Admin",
                LastName = "User",
                Email = "admin@test.com"
            };

            SetupAuthenticatedUser(_accountController, adminId, true);
            _mockUserManager.Setup(m => m.FindByIdAsync(adminId))
                .ReturnsAsync(admin);
            _mockUserManager.Setup(m => m.GetUserId(It.IsAny<ClaimsPrincipal>()))
                .Returns(adminId);
            _mockUserManager.Setup(m => m.GetRolesAsync(admin))
                .ReturnsAsync(new List<string> { "Admin" });

            // Act
            var result = await _accountController.EditUser(adminId);

            // Assert
            var viewResult = Assert.IsType<ViewResult>(result);
            var model = Assert.IsAssignableFrom<EditUserViewModel>(viewResult.Model);
            Assert.Equal(adminId, model.Id);
        }

        [Fact]
        public async Task AdminSelfDeletion_ShouldBePrevented()
        {
            // Arrange
            var adminId = "admin1";
            var admin = new ApplicationUser
            {
                Id = adminId,
                FirstName = "Admin",
                LastName = "User",
                Email = "admin@test.com"
            };

            SetupAuthenticatedUser(_accountController, adminId, true);
            _mockUserManager.Setup(m => m.FindByIdAsync(adminId))
                .ReturnsAsync(admin);
            _mockUserManager.Setup(m => m.GetRolesAsync(admin))
                .ReturnsAsync(new List<string> { "Admin" });

            // Act
            var result = await _accountController.DeleteUser(adminId);

            // Assert
            Assert.IsType<ForbidResult>(result);
        }

        [Fact]
        public async Task CrossAdminEdit_ShouldBePrevented()
        {
            // Arrange
            var targetAdminId = "admin2";
            var targetAdmin = new ApplicationUser
            {
                Id = targetAdminId,
                FirstName = "Target",
                LastName = "Admin",
                Email = "target@test.com"
            };

            SetupAuthenticatedUser(_accountController, "admin1", true);
            _mockUserManager.Setup(m => m.FindByIdAsync(targetAdminId))
                .ReturnsAsync(targetAdmin);
            _mockUserManager.Setup(m => m.GetRolesAsync(targetAdmin))
                .ReturnsAsync(new List<string> { "Admin" });

            // Act
            var result = await _accountController.EditUser(targetAdminId);

            // Assert
            Assert.IsType<ForbidResult>(result);
        }

        [Fact]
        public async Task CrossAdminDeletion_ShouldBePrevented()
        {
            // Arrange
            var targetAdminId = "admin2";
            var targetAdmin = new ApplicationUser
            {
                Id = targetAdminId,
                FirstName = "Target",
                LastName = "Admin",
                Email = "target@test.com"
            };

            SetupAuthenticatedUser(_accountController, "admin1", true);
            _mockUserManager.Setup(m => m.FindByIdAsync(targetAdminId))
                .ReturnsAsync(targetAdmin);
            _mockUserManager.Setup(m => m.GetRolesAsync(targetAdmin))
                .ReturnsAsync(new List<string> { "Admin" });

            // Act
            var result = await _accountController.DeleteUser(targetAdminId);

            // Assert
            Assert.IsType<ForbidResult>(result);
        }

        [Fact]
        public async Task CustomerDataIsolation_ShouldBeEnforced()
        {
            // Arrange - Test att användare bara kan se sina egna kunder
            var userId1 = "user1";
            var userId2 = "user2";

            var user1Customers = new List<Customer>
            {
                new Customer { Id = 1, FirstName = "User1", LastName = "Customer1", UserId = userId1 },
                new Customer { Id = 2, FirstName = "User1", LastName = "Customer2", UserId = userId1 }
            };

            var user2Customers = new List<Customer>
            {
                new Customer { Id = 3, FirstName = "User2", LastName = "Customer1", UserId = userId2 }
            };

            // Test för user1
            SetupAuthenticatedUser(_customerController, userId1, false);
            _mockCustomerService.Setup(s => s.GetAllCustomersAsync(userId1))
                .ReturnsAsync(user1Customers);

            // Act
            var user1Result = await _customerController.Index();

            // Assert
            var user1View = Assert.IsType<ViewResult>(user1Result);
            var user1Model = Assert.IsAssignableFrom<IEnumerable<Customer>>(user1View.Model);
            Assert.Equal(2, user1Model.Count());
            Assert.All(user1Model, c => Assert.Equal(userId1, c.UserId));

            // Test för user2
            SetupAuthenticatedUser(_customerController, userId2, false);
            _mockCustomerService.Setup(s => s.GetAllCustomersAsync(userId2))
                .ReturnsAsync(user2Customers);

            // Act
            var user2Result = await _customerController.Index();

            // Assert
            var user2View = Assert.IsType<ViewResult>(user2Result);
            var user2Model = Assert.IsAssignableFrom<IEnumerable<Customer>>(user2View.Model);
            Assert.Single(user2Model);
            Assert.Equal(userId2, user2Model.First().UserId);
        }

        [Fact]
        public async Task AdminCustomerAccess_ShouldSeeAllCustomers()
        {
            // Arrange
            var allCustomers = new List<Customer>
            {
                new Customer { Id = 1, FirstName = "Customer1", UserId = "user1" },
                new Customer { Id = 2, FirstName = "Customer2", UserId = "user2" },
                new Customer { Id = 3, FirstName = "Customer3", UserId = null }
            };

            SetupAuthenticatedUser(_customerController, "admin1", true);
            _mockCustomerService.Setup(s => s.GetAllCustomersForAdminAsync())
                .ReturnsAsync(allCustomers);

            // Act
            var result = await _customerController.Index();

            // Assert
            var viewResult = Assert.IsType<ViewResult>(result);
            var model = Assert.IsAssignableFrom<IEnumerable<Customer>>(viewResult.Model);
            Assert.Equal(3, model.Count());
            
            // Verifiera att alla typer av kunder inkluderas
            Assert.Contains(model, c => c.UserId == "user1");
            Assert.Contains(model, c => c.UserId == "user2");
            Assert.Contains(model, c => c.UserId == null);
        }

        [Fact]
        public async Task UserDeletionWithCustomers_ShouldSetCustomerUserIdToNull()
        {
            // Arrange
            var userId = "user-with-customers";
            var user = new ApplicationUser
            {
                Id = userId,
                FirstName = "User",
                LastName = "WithCustomers",
                Email = "user@test.com"
            };

            var customers = new List<Customer>
            {
                new Customer { Id = 1, FirstName = "Customer1", UserId = userId },
                new Customer { Id = 2, FirstName = "Customer2", UserId = userId }
            };

            SetupAuthenticatedUser(_accountController, "admin1", true);
            _mockUserManager.Setup(m => m.FindByIdAsync(userId))
                .ReturnsAsync(user);
            _mockUserManager.Setup(m => m.GetRolesAsync(user))
                .ReturnsAsync(new List<string> { "User" });
            _mockUserManager.Setup(m => m.DeleteAsync(user))
                .ReturnsAsync(IdentityResult.Success);
            _mockIdentityService.Setup(s => s.GetAllCustomersAsync(userId))
                .ReturnsAsync(customers);

            // Act
            var result = await _accountController.DeleteUser(userId);

            // Assert
            var redirectResult = Assert.IsType<RedirectToActionResult>(result);
            Assert.Equal("ManageUsers", redirectResult.ActionName);

            // Verifiera att kundernas UserId sätts till null
            _mockIdentityService.Verify(s => s.SetCustomersUserIdToNullAsync(userId), Times.Once);
        }

        private void SetupAuthenticatedUser(Controller controller, string userId, bool isAdmin)
        {
            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, userId),
                new Claim(ClaimTypes.Name, "test@example.com")
            };

            if (isAdmin)
            {
                claims.Add(new Claim(ClaimTypes.Role, "Admin"));
            }

            var identity = new ClaimsIdentity(claims, "TestAuthType");
            var claimsPrincipal = new ClaimsPrincipal(identity);

            controller.ControllerContext = new ControllerContext
            {
                HttpContext = new Microsoft.AspNetCore.Http.DefaultHttpContext
                {
                    User = claimsPrincipal
                }
            };

            _mockUserManager.Setup(m => m.GetUserId(It.IsAny<ClaimsPrincipal>()))
                .Returns(userId);
        }
    }
}