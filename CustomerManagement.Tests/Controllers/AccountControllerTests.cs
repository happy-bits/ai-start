using CustomerManagement.Controllers;
using CustomerManagement.Controllers.ViewModels;
using CustomerManagement.Models;
using CustomerManagement.Services;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Moq;
using System.Security.Claims;

namespace CustomerManagement.Tests.Controllers
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
