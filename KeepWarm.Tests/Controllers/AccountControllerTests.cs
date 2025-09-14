using KeepWarm.Controllers;
using KeepWarm.Controllers.ViewModels;
using KeepWarm.Models;
using KeepWarm.Services;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Moq;
using System.Security.Claims;

namespace KeepWarm.Tests.Controllers
{
    public class AccountControllerTests
    {
        private readonly Mock<UserManager<ApplicationUser>> _mockUserManager;
        private readonly Mock<SignInManager<ApplicationUser>> _mockSignInManager;
        private readonly Mock<IIdentityService> _mockIdentityService;
        private readonly AccountController _controller;

        public AccountControllerTests()
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
                _mockUserManager.Object, contextAccessor.Object, claimsFactory.Object, optionsAccessor.Object, logger.Object, schemes.Object, null!);

            _mockIdentityService = new Mock<IIdentityService>();

            _controller = new AccountController(_mockUserManager.Object, _mockSignInManager.Object, _mockIdentityService.Object);
        }

        [Fact]
        public void Register_Get_ShouldReturnView()
        {
            // Act
            var result = _controller.Register();

            // Assert
            Assert.IsType<ViewResult>(result);
        }

        [Fact]
        public async Task Register_Post_ShouldCreateUser_WhenModelIsValid()
        {
            // Arrange
            var model = new RegisterViewModel
            {
                FirstName = "New",
                LastName = "User",
                Email = "newuser@example.com",
                Password = "NewUser123!",
                ConfirmPassword = "NewUser123!"
            };

            var user = new ApplicationUser
            {
                Id = "user1",
                UserName = model.Email,
                Email = model.Email,
                FirstName = model.FirstName,
                LastName = model.LastName
            };

            _mockUserManager.Setup(m => m.CreateAsync(It.IsAny<ApplicationUser>(), model.Password))
                .ReturnsAsync(IdentityResult.Success);
            _mockUserManager.Setup(m => m.AddToRoleAsync(It.IsAny<ApplicationUser>(), "User"))
                .ReturnsAsync(IdentityResult.Success);

            // Act
            var result = await _controller.Register(model);

            // Assert
            var redirectResult = Assert.IsType<RedirectToActionResult>(result);
            Assert.Equal("Index", redirectResult.ActionName);
            Assert.Equal("Home", redirectResult.ControllerName);

            _mockUserManager.Verify(m => m.CreateAsync(It.Is<ApplicationUser>(u => 
                u.Email == model.Email && 
                u.FirstName == model.FirstName && 
                u.LastName == model.LastName), model.Password), Times.Once);
            _mockUserManager.Verify(m => m.AddToRoleAsync(It.IsAny<ApplicationUser>(), "User"), Times.Once);
        }

        [Fact]
        public async Task Register_Post_ShouldReturnView_WhenModelIsInvalid()
        {
            // Arrange
            var model = new RegisterViewModel();
            _controller.ModelState.AddModelError("Email", "Required");

            // Act
            var result = await _controller.Register(model);

            // Assert
            var viewResult = Assert.IsType<ViewResult>(result);
            Assert.Equal(model, viewResult.Model);
        }

        [Fact]
        public async Task Register_Post_ShouldReturnView_WhenUserCreationFails()
        {
            // Arrange
            var model = new RegisterViewModel
            {
                FirstName = "New",
                LastName = "User",
                Email = "newuser@example.com",
                Password = "NewUser123!",
                ConfirmPassword = "NewUser123!"
            };

            var errors = new List<IdentityError>
            {
                new IdentityError { Code = "DuplicateEmail", Description = "Email already exists" }
            };

            _mockUserManager.Setup(m => m.CreateAsync(It.IsAny<ApplicationUser>(), model.Password))
                .ReturnsAsync(IdentityResult.Failed(errors.ToArray()));

            // Act
            var result = await _controller.Register(model);

            // Assert
            var viewResult = Assert.IsType<ViewResult>(result);
            Assert.Equal(model, viewResult.Model);
            Assert.True(_controller.ModelState.ContainsKey(string.Empty));
        }

        [Fact]
        public void Login_Get_ShouldReturnView()
        {
            // Act
            var result = _controller.Login();

            // Assert
            var viewResult = Assert.IsType<ViewResult>(result);
            Assert.Null(viewResult.ViewData["ReturnUrl"]);
        }

        [Fact]
        public void Login_Get_ShouldReturnViewWithReturnUrl()
        {
            // Arrange
            var returnUrl = "/Customer/Index";

            // Act
            var result = _controller.Login(returnUrl);

            // Assert
            var viewResult = Assert.IsType<ViewResult>(result);
            Assert.Equal(returnUrl, viewResult.ViewData["ReturnUrl"]);
        }

        [Fact]
        public async Task Login_Post_ShouldRedirectToHome_WhenCredentialsAreValid()
        {
            // Arrange
            var model = new LoginViewModel
            {
                Email = "user@example.com",
                Password = "Password123!",
                RememberMe = false
            };

            SetupControllerContext();
            _mockSignInManager.Setup(m => m.PasswordSignInAsync(model.Email, model.Password, model.RememberMe, false))
                .ReturnsAsync(Microsoft.AspNetCore.Identity.SignInResult.Success);

            // Act
            var result = await _controller.Login(model);

            // Assert
            var redirectResult = Assert.IsType<RedirectToActionResult>(result);
            Assert.Equal("Index", redirectResult.ActionName);
            Assert.Equal("Home", redirectResult.ControllerName);
        }

        [Fact]
        public async Task Login_Post_ShouldRedirectToReturnUrl_WhenCredentialsAreValid()
        {
            // Arrange
            var model = new LoginViewModel
            {
                Email = "user@example.com",
                Password = "Password123!",
                RememberMe = false
            };
            var returnUrl = "/Customer/Index";

            SetupControllerContextWithLocalUrl();
            _mockSignInManager.Setup(m => m.PasswordSignInAsync(model.Email, model.Password, model.RememberMe, false))
                .ReturnsAsync(Microsoft.AspNetCore.Identity.SignInResult.Success);

            // Act
            var result = await _controller.Login(model, returnUrl);

            // Assert
            var redirectResult = Assert.IsType<RedirectResult>(result);
            Assert.Equal(returnUrl, redirectResult.Url);
        }

        [Fact]
        public async Task Login_Post_ShouldReturnView_WhenCredentialsAreInvalid()
        {
            // Arrange
            var model = new LoginViewModel
            {
                Email = "user@example.com",
                Password = "WrongPassword",
                RememberMe = false
            };

            _mockSignInManager.Setup(m => m.PasswordSignInAsync(model.Email, model.Password, model.RememberMe, false))
                .ReturnsAsync(Microsoft.AspNetCore.Identity.SignInResult.Failed);

            // Act
            var result = await _controller.Login(model);

            // Assert
            var viewResult = Assert.IsType<ViewResult>(result);
            Assert.Equal(model, viewResult.Model);
            Assert.True(_controller.ModelState.ContainsKey(string.Empty));
        }

        [Fact]
        public async Task Logout_ShouldRedirectToHome()
        {
            // Arrange
            _mockSignInManager.Setup(m => m.SignOutAsync())
                .Returns(Task.CompletedTask);

            // Act
            var result = await _controller.Logout();

            // Assert
            var redirectResult = Assert.IsType<RedirectToActionResult>(result);
            Assert.Equal("Index", redirectResult.ActionName);
            Assert.Equal("Home", redirectResult.ControllerName);
        }

        [Fact]
        public async Task ManageUsers_ShouldReturnViewWithUsers_WhenUserIsAdmin()
        {
            // Arrange
            var users = new List<ApplicationUser>
            {
                new ApplicationUser { Id = "user1", Email = "user1@example.com", FirstName = "User", LastName = "One" },
                new ApplicationUser { Id = "user2", Email = "user2@example.com", FirstName = "User", LastName = "Two" }
            };

            SetupAuthenticatedUser("admin1", true);
            _mockIdentityService.Setup(s => s.GetAllUsersAsync())
                .ReturnsAsync(users);

            // Act
            var result = await _controller.ManageUsers();

            // Assert
            var viewResult = Assert.IsType<ViewResult>(result);
            var model = Assert.IsAssignableFrom<IEnumerable<ApplicationUser>>(viewResult.Model);
            Assert.Equal(2, model.Count());
        }

        [Fact]
        public void CreateUser_Get_ShouldReturnView_WhenUserIsAdmin()
        {
            // Arrange
            SetupAuthenticatedUser("admin1", true);

            // Act
            var result = _controller.CreateUser();

            // Assert
            Assert.IsType<ViewResult>(result);
        }

        [Fact]
        public async Task CreateUser_Post_ShouldCreateUser_WhenModelIsValid()
        {
            // Arrange
            var model = new CreateUserViewModel
            {
                FirstName = "Admin",
                LastName = "Created",
                Email = "admincreated@example.com",
                Password = "AdminCreated123!"
            };

            SetupAuthenticatedUser("admin1", true);
            _mockUserManager.Setup(m => m.CreateAsync(It.IsAny<ApplicationUser>(), model.Password))
                .ReturnsAsync(IdentityResult.Success);
            _mockUserManager.Setup(m => m.AddToRoleAsync(It.IsAny<ApplicationUser>(), "User"))
                .ReturnsAsync(IdentityResult.Success);

            // Act
            var result = await _controller.CreateUser(model);

            // Assert
            var redirectResult = Assert.IsType<RedirectToActionResult>(result);
            Assert.Equal("ManageUsers", redirectResult.ActionName);

            _mockUserManager.Verify(m => m.CreateAsync(It.Is<ApplicationUser>(u => 
                u.Email == model.Email && 
                u.FirstName == model.FirstName && 
                u.LastName == model.LastName), model.Password), Times.Once);
            _mockUserManager.Verify(m => m.AddToRoleAsync(It.IsAny<ApplicationUser>(), "User"), Times.Once);
        }

        [Fact]
        public async Task CreateUser_Post_ShouldReturnView_WhenModelIsInvalid()
        {
            // Arrange
            var model = new CreateUserViewModel();
            _controller.ModelState.AddModelError("Email", "Required");

            // Act
            var result = await _controller.CreateUser(model);

            // Assert
            var viewResult = Assert.IsType<ViewResult>(result);
            Assert.Equal(model, viewResult.Model);
        }

        [Fact]
        public async Task CreateUser_Post_ShouldReturnView_WhenUserCreationFails()
        {
            // Arrange
            var model = new CreateUserViewModel
            {
                FirstName = "Admin",
                LastName = "Created",
                Email = "admincreated@example.com",
                Password = "AdminCreated123!"
            };

            var errors = new List<IdentityError>
            {
                new IdentityError { Code = "DuplicateEmail", Description = "Email already exists" }
            };

            SetupAuthenticatedUser("admin1", true);
            _mockUserManager.Setup(m => m.CreateAsync(It.IsAny<ApplicationUser>(), model.Password))
                .ReturnsAsync(IdentityResult.Failed(errors.ToArray()));

            // Act
            var result = await _controller.CreateUser(model);

            // Assert
            var viewResult = Assert.IsType<ViewResult>(result);
            Assert.Equal(model, viewResult.Model);
            Assert.True(_controller.ModelState.ContainsKey(string.Empty));
        }

        [Fact]
        public async Task EditUser_Get_ShouldReturnView_WhenUserIsAdmin()
        {
            // Arrange
            var userId = "user123";
            var user = new ApplicationUser
            {
                Id = userId,
                FirstName = "Test",
                LastName = "User",
                Email = "test@example.com",
                PhoneNumber = "070-1234567"
            };

            SetupAuthenticatedUser("admin1", true);
            _mockUserManager.Setup(m => m.FindByIdAsync(userId))
                .ReturnsAsync(user);
            _mockUserManager.Setup(m => m.GetRolesAsync(user))
                .ReturnsAsync(new List<string> { "User" });

            // Act
            var result = await _controller.EditUser(userId);

            // Assert
            var viewResult = Assert.IsType<ViewResult>(result);
            var model = Assert.IsAssignableFrom<EditUserViewModel>(viewResult.Model);
            Assert.Equal(userId, model.Id);
            Assert.Equal("Test", model.FirstName);
            Assert.Equal("User", model.LastName);
            Assert.Equal("test@example.com", model.Email);
            Assert.Equal("070-1234567", model.PhoneNumber);
            Assert.Equal("User", model.Role);
        }

        [Fact]
        public async Task EditUser_Get_ShouldReturnNotFound_WhenUserNotFound()
        {
            // Arrange
            var userId = "nonexistent";

            SetupAuthenticatedUser("admin1", true);
            _mockUserManager.Setup(m => m.FindByIdAsync(userId))
                .ReturnsAsync((ApplicationUser?)null);

            // Act
            var result = await _controller.EditUser(userId);

            // Assert
            Assert.IsType<NotFoundResult>(result);
        }

        [Fact]
        public async Task EditUser_Post_ShouldUpdateUser_WhenModelIsValid()
        {
            // Arrange
            var model = new EditUserViewModel
            {
                Id = "user123",
                FirstName = "Updated",
                LastName = "User",
                Email = "updated@example.com",
                PhoneNumber = "070-9876543",
                Role = "User"
            };

            var existingUser = new ApplicationUser
            {
                Id = "user123",
                FirstName = "Original",
                LastName = "User",
                Email = "original@example.com",
                PhoneNumber = "070-1234567"
            };

            SetupAuthenticatedUser("admin1", true);
            _mockUserManager.Setup(m => m.FindByIdAsync(model.Id))
                .ReturnsAsync(existingUser);
            _mockUserManager.Setup(m => m.UpdateAsync(It.IsAny<ApplicationUser>()))
                .ReturnsAsync(IdentityResult.Success);
            _mockUserManager.Setup(m => m.GetRolesAsync(existingUser))
                .ReturnsAsync(new List<string> { "User" });
            _mockUserManager.Setup(m => m.RemoveFromRolesAsync(existingUser, It.IsAny<IEnumerable<string>>()))
                .ReturnsAsync(IdentityResult.Success);
            _mockUserManager.Setup(m => m.AddToRoleAsync(existingUser, model.Role))
                .ReturnsAsync(IdentityResult.Success);

            // Act
            var result = await _controller.EditUser(model);

            // Assert
            var redirectResult = Assert.IsType<RedirectToActionResult>(result);
            Assert.Equal("ManageUsers", redirectResult.ActionName);

            _mockUserManager.Verify(m => m.UpdateAsync(It.Is<ApplicationUser>(u => 
                u.FirstName == model.FirstName && 
                u.LastName == model.LastName &&
                u.Email == model.Email &&
                u.PhoneNumber == model.PhoneNumber)), Times.Once);
        }

        [Fact]
        public async Task EditUser_Post_ShouldReturnView_WhenModelIsInvalid()
        {
            // Arrange
            var model = new EditUserViewModel();
            _controller.ModelState.AddModelError("Email", "Required");

            // Act
            var result = await _controller.EditUser(model);

            // Assert
            var viewResult = Assert.IsType<ViewResult>(result);
            Assert.Equal(model, viewResult.Model);
        }

        [Fact]
        public async Task EditUser_Post_ShouldReturnNotFound_WhenUserNotFound()
        {
            // Arrange
            var model = new EditUserViewModel
            {
                Id = "nonexistent",
                FirstName = "Test",
                LastName = "User",
                Email = "test@example.com",
                Role = "User"
            };

            SetupAuthenticatedUser("admin1", true);
            _mockUserManager.Setup(m => m.FindByIdAsync(model.Id))
                .ReturnsAsync((ApplicationUser?)null);

            // Act
            var result = await _controller.EditUser(model);

            // Assert
            Assert.IsType<NotFoundResult>(result);
        }

        [Fact]
        public async Task EditUser_Post_ShouldReturnView_WhenUpdateFails()
        {
            // Arrange
            var model = new EditUserViewModel
            {
                Id = "user123",
                FirstName = "Updated",
                LastName = "User",
                Email = "updated@example.com",
                Role = "User"
            };

            var existingUser = new ApplicationUser
            {
                Id = "user123",
                FirstName = "Original",
                LastName = "User",
                Email = "original@example.com"
            };

            var errors = new List<IdentityError>
            {
                new IdentityError { Code = "DuplicateEmail", Description = "Email already exists" }
            };

            SetupAuthenticatedUser("admin1", true);
            _mockUserManager.Setup(m => m.FindByIdAsync(model.Id))
                .ReturnsAsync(existingUser);
            _mockUserManager.Setup(m => m.GetUserId(It.IsAny<System.Security.Claims.ClaimsPrincipal>()))
                .Returns("admin1");
            _mockUserManager.Setup(m => m.GetRolesAsync(existingUser))
                .ReturnsAsync(new List<string> { "User" });
            _mockUserManager.Setup(m => m.UpdateAsync(It.IsAny<ApplicationUser>()))
                .ReturnsAsync(IdentityResult.Failed(errors.ToArray()));

            // Act
            var result = await _controller.EditUser(model);

            // Assert
            var viewResult = Assert.IsType<ViewResult>(result);
            Assert.Equal(model, viewResult.Model);
            Assert.True(_controller.ModelState.ContainsKey(string.Empty));
        }

        [Fact]
        public async Task EditUser_Get_ShouldReturnForbidden_WhenTryingToEditAnotherAdmin()
        {
            // Arrange
            var adminUserId = "admin123";
            var targetAdmin = new ApplicationUser
            {
                Id = adminUserId,
                FirstName = "Target",
                LastName = "Admin",
                Email = "targetadmin@example.com"
            };

            SetupAuthenticatedUser("admin1", true);
            _mockUserManager.Setup(m => m.FindByIdAsync(adminUserId))
                .ReturnsAsync(targetAdmin);
            _mockUserManager.Setup(m => m.GetRolesAsync(targetAdmin))
                .ReturnsAsync(new List<string> { "Admin" });

            // Act
            var result = await _controller.EditUser(adminUserId);

            // Assert
            var forbiddenResult = Assert.IsType<ForbidResult>(result);
        }

        [Fact]
        public async Task EditUser_Get_ShouldReturnView_WhenTryingToEditSelf()
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

            SetupAuthenticatedUser("admin1", true);
            _mockUserManager.Setup(m => m.FindByIdAsync(currentAdminId))
                .ReturnsAsync(currentAdmin);
            _mockUserManager.Setup(m => m.GetUserId(It.IsAny<System.Security.Claims.ClaimsPrincipal>()))
                .Returns("admin1");
            _mockUserManager.Setup(m => m.GetRolesAsync(currentAdmin))
                .ReturnsAsync(new List<string> { "Admin" });

            // Act
            var result = await _controller.EditUser(currentAdminId);

            // Assert
            var viewResult = Assert.IsType<ViewResult>(result);
            var model = Assert.IsAssignableFrom<EditUserViewModel>(viewResult.Model);
            Assert.Equal(currentAdminId, model.Id);
            Assert.Equal("Current", model.FirstName);
            Assert.Equal("Admin", model.LastName);
            Assert.Equal("admin1@test.com", model.Email);
            Assert.Equal("Admin", model.Role);
        }

        [Fact]
        public async Task EditUser_Post_ShouldReturnForbidden_WhenTryingToEditAnotherAdmin()
        {
            // Arrange
            var model = new EditUserViewModel
            {
                Id = "admin123",
                FirstName = "Updated",
                LastName = "Admin",
                Email = "updatedadmin@example.com",
                Role = "Admin"
            };

            var targetAdmin = new ApplicationUser
            {
                Id = "admin123",
                FirstName = "Target",
                LastName = "Admin",
                Email = "targetadmin@example.com"
            };

            SetupAuthenticatedUser("admin1", true);
            _mockUserManager.Setup(m => m.FindByIdAsync(model.Id))
                .ReturnsAsync(targetAdmin);
            _mockUserManager.Setup(m => m.GetRolesAsync(targetAdmin))
                .ReturnsAsync(new List<string> { "Admin" });

            // Act
            var result = await _controller.EditUser(model);

            // Assert
            var forbiddenResult = Assert.IsType<ForbidResult>(result);
        }

        [Fact]
        public async Task EditUser_Post_ShouldUpdateUser_WhenTryingToEditSelf()
        {
            // Arrange
            var model = new EditUserViewModel
            {
                Id = "admin1",
                FirstName = "Updated",
                LastName = "Admin",
                Email = "updatedadmin@example.com",
                PhoneNumber = "070-1234567",
                Role = "Admin"
            };

            var currentAdmin = new ApplicationUser
            {
                Id = "admin1",
                FirstName = "Current",
                LastName = "Admin",
                Email = "admin1@test.com",
                PhoneNumber = "070-9876543"
            };

            SetupAuthenticatedUser("admin1", true);
            _mockUserManager.Setup(m => m.FindByIdAsync(model.Id))
                .ReturnsAsync(currentAdmin);
            _mockUserManager.Setup(m => m.GetUserId(It.IsAny<System.Security.Claims.ClaimsPrincipal>()))
                .Returns("admin1");
            _mockUserManager.Setup(m => m.GetRolesAsync(currentAdmin))
                .ReturnsAsync(new List<string> { "Admin" });
            _mockUserManager.Setup(m => m.UpdateAsync(It.IsAny<ApplicationUser>()))
                .ReturnsAsync(IdentityResult.Success);

            // Act
            var result = await _controller.EditUser(model);

            // Assert
            var redirectResult = Assert.IsType<RedirectToActionResult>(result);
            Assert.Equal("ManageUsers", redirectResult.ActionName);

            _mockUserManager.Verify(m => m.UpdateAsync(It.Is<ApplicationUser>(u => 
                u.FirstName == model.FirstName && 
                u.LastName == model.LastName &&
                u.Email == model.Email &&
                u.PhoneNumber == model.PhoneNumber)), Times.Once);
        }

        [Fact]
        public async Task DeleteUser_ShouldDeleteUser_WhenUserIsNotAdmin()
        {
            // Arrange
            var userId = "user123";
            var user = new ApplicationUser
            {
                Id = userId,
                FirstName = "Test",
                LastName = "User",
                Email = "test@example.com"
            };

            SetupAuthenticatedUser("admin1", true);
            _mockUserManager.Setup(m => m.FindByIdAsync(userId))
                .ReturnsAsync(user);
            _mockUserManager.Setup(m => m.GetRolesAsync(user))
                .ReturnsAsync(new List<string> { "User" });
            _mockUserManager.Setup(m => m.DeleteAsync(user))
                .ReturnsAsync(IdentityResult.Success);

            // Act
            var result = await _controller.DeleteUser(userId);

            // Assert
            var redirectResult = Assert.IsType<RedirectToActionResult>(result);
            Assert.Equal("ManageUsers", redirectResult.ActionName);

            _mockUserManager.Verify(m => m.DeleteAsync(user), Times.Once);
        }

        [Fact]
        public async Task DeleteUser_ShouldReturnNotFound_WhenUserNotFound()
        {
            // Arrange
            var userId = "nonexistent";

            SetupAuthenticatedUser("admin1", true);
            _mockUserManager.Setup(m => m.FindByIdAsync(userId))
                .ReturnsAsync((ApplicationUser?)null);

            // Act
            var result = await _controller.DeleteUser(userId);

            // Assert
            Assert.IsType<NotFoundResult>(result);
        }

        [Fact]
        public async Task DeleteUser_ShouldReturnForbidden_WhenTryingToDeleteAnotherAdmin()
        {
            // Arrange
            var adminUserId = "admin123";
            var targetAdmin = new ApplicationUser
            {
                Id = adminUserId,
                FirstName = "Target",
                LastName = "Admin",
                Email = "targetadmin@example.com"
            };

            SetupAuthenticatedUser("admin1", true);
            _mockUserManager.Setup(m => m.FindByIdAsync(adminUserId))
                .ReturnsAsync(targetAdmin);
            _mockUserManager.Setup(m => m.GetRolesAsync(targetAdmin))
                .ReturnsAsync(new List<string> { "Admin" });

            // Act
            var result = await _controller.DeleteUser(adminUserId);

            // Assert
            var forbiddenResult = Assert.IsType<ForbidResult>(result);
        }

        [Fact]
        public async Task DeleteUser_ShouldReturnForbidden_WhenTryingToDeleteSelf()
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

            SetupAuthenticatedUser("admin1", true);
            _mockUserManager.Setup(m => m.FindByIdAsync(currentAdminId))
                .ReturnsAsync(currentAdmin);
            _mockUserManager.Setup(m => m.GetRolesAsync(currentAdmin))
                .ReturnsAsync(new List<string> { "Admin" });

            // Act
            var result = await _controller.DeleteUser(currentAdminId);

            // Assert
            var forbiddenResult = Assert.IsType<ForbidResult>(result);
        }


        private void SetupControllerContext()
        {
            var httpContext = new Microsoft.AspNetCore.Http.DefaultHttpContext();
            var urlHelper = new Mock<Microsoft.AspNetCore.Mvc.IUrlHelper>();
            urlHelper.Setup(u => u.IsLocalUrl(It.IsAny<string>())).Returns(false);

            _controller.ControllerContext = new ControllerContext
            {
                HttpContext = httpContext
            };
            _controller.Url = urlHelper.Object;
        }

        private void SetupControllerContextWithLocalUrl()
        {
            var httpContext = new Microsoft.AspNetCore.Http.DefaultHttpContext();
            var urlHelper = new Mock<Microsoft.AspNetCore.Mvc.IUrlHelper>();
            urlHelper.Setup(u => u.IsLocalUrl(It.IsAny<string>())).Returns(true);

            _controller.ControllerContext = new ControllerContext
            {
                HttpContext = httpContext
            };
            _controller.Url = urlHelper.Object;
        }

        // Nya tester för att verifiera att kunder får UserId = null när användare tas bort
        [Fact]
        public async Task DeleteUser_ShouldSetCustomerUserIdToNull_WhenUserHasCustomers()
        {
            // Arrange
            SetupAuthenticatedUser("admin1", true);
            var userId = "user123";
            var user = new ApplicationUser
            {
                Id = userId,
                FirstName = "Test",
                LastName = "User",
                Email = "test@example.com"
            };

            // Mock kunder som tillhör användaren
            var customers = new List<Customer>
            {
                new Customer { Id = 1, FirstName = "Customer1", LastName = "One", Email = "c1@example.com", UserId = userId },
                new Customer { Id = 2, FirstName = "Customer2", LastName = "Two", Email = "c2@example.com", UserId = userId }
            };

            _mockUserManager.Setup(m => m.FindByIdAsync(userId))
                .ReturnsAsync(user);
            _mockUserManager.Setup(m => m.GetRolesAsync(user))
                .ReturnsAsync(new List<string> { "User" });
            _mockUserManager.Setup(m => m.DeleteAsync(user))
                .ReturnsAsync(IdentityResult.Success);

            // Mock IdentityService för att hantera kunder
            _mockIdentityService.Setup(s => s.GetAllCustomersAsync(userId))
                .ReturnsAsync(customers);

            // Act
            var result = await _controller.DeleteUser(userId);

            // Assert
            var redirectResult = Assert.IsType<RedirectToActionResult>(result);
            Assert.Equal("ManageUsers", redirectResult.ActionName);

            // Verifiera att IdentityService anropas för att uppdatera kundernas UserId till null
            _mockIdentityService.Verify(s => s.SetCustomersUserIdToNullAsync(userId), Times.Once);
        }

        [Fact]
        public async Task DeleteUser_ShouldNotCallIdentityService_WhenUserHasNoCustomers()
        {
            // Arrange
            SetupAuthenticatedUser("admin1", true);
            var userId = "user123";
            var user = new ApplicationUser
            {
                Id = userId,
                FirstName = "Test",
                LastName = "User",
                Email = "test@example.com"
            };

            _mockUserManager.Setup(m => m.FindByIdAsync(userId))
                .ReturnsAsync(user);
            _mockUserManager.Setup(m => m.GetRolesAsync(user))
                .ReturnsAsync(new List<string> { "User" });
            _mockUserManager.Setup(m => m.DeleteAsync(user))
                .ReturnsAsync(IdentityResult.Success);

            // Mock IdentityService för att returnera tom lista
            _mockIdentityService.Setup(s => s.GetAllCustomersAsync(userId))
                .ReturnsAsync(new List<Customer>());

            // Act
            var result = await _controller.DeleteUser(userId);

            // Assert
            var redirectResult = Assert.IsType<RedirectToActionResult>(result);
            Assert.Equal("ManageUsers", redirectResult.ActionName);

            // Verifiera att IdentityService INTE anropas för att uppdatera kundernas UserId
            _mockIdentityService.Verify(s => s.SetCustomersUserIdToNullAsync(userId), Times.Never);
        }

        private void SetupAuthenticatedUser(string userId, bool isAdmin)
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

            _controller.ControllerContext = new ControllerContext
            {
                HttpContext = new Microsoft.AspNetCore.Http.DefaultHttpContext
                {
                    User = claimsPrincipal
                }
            };
        }
    }
}
