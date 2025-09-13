using CustomerManagement.Controllers;
using CustomerManagement.Models;
using CustomerManagement.Services;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Moq;
using System.Text.Json;

namespace CustomerManagement.Tests.Controllers
{
    public class DeveloperToolsControllerTests
    {
        private readonly Mock<IDatabaseSeedService> _mockSeedService;
        private readonly Mock<SignInManager<ApplicationUser>> _mockSignInManager;
        private readonly Mock<UserManager<ApplicationUser>> _mockUserManager;
        private readonly Mock<IConfiguration> _mockConfiguration;
        private readonly Mock<ILogger<DeveloperToolsController>> _mockLogger;
        private readonly DeveloperToolsController _controller;

        public DeveloperToolsControllerTests()
        {
            _mockSeedService = new Mock<IDatabaseSeedService>();
            
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

            _mockConfiguration = new Mock<IConfiguration>();
            _mockLogger = new Mock<ILogger<DeveloperToolsController>>();

            _controller = new DeveloperToolsController(
                _mockSeedService.Object,
                _mockSignInManager.Object,
                _mockUserManager.Object,
                _mockConfiguration.Object,
                _mockLogger.Object);
        }

        [Fact]
        public async Task RecreateDatabase_ShouldReturnSuccess_WhenBothOperationsSucceed()
        {
            // Arrange
            _mockSeedService.Setup(s => s.RecreateDatabaseAsync())
                .ReturnsAsync(true);
            _mockSeedService.Setup(s => s.SeedTestDataAsync())
                .ReturnsAsync(true);

            // Act
            var result = await _controller.RecreateDatabase();

            // Assert
            var jsonResult = Assert.IsType<JsonResult>(result);
            var (success, message) = ExtractJsonResult(jsonResult);
            Assert.True(success);
            Assert.Equal("Databas återskapad och testdata tillagd!", message);

            _mockSeedService.Verify(s => s.RecreateDatabaseAsync(), Times.Once);
            _mockSeedService.Verify(s => s.SeedTestDataAsync(), Times.Once);
        }

        [Fact]
        public async Task RecreateDatabase_ShouldReturnError_WhenRecreateFails()
        {
            // Arrange
            _mockSeedService.Setup(s => s.RecreateDatabaseAsync())
                .ReturnsAsync(false);

            // Act
            var result = await _controller.RecreateDatabase();

            // Assert
            var jsonResult = Assert.IsType<JsonResult>(result);
            var (success, message) = ExtractJsonResult(jsonResult);
            Assert.False(success);
            Assert.Equal("Fel vid återskapning av databas", message);

            _mockSeedService.Verify(s => s.RecreateDatabaseAsync(), Times.Once);
            _mockSeedService.Verify(s => s.SeedTestDataAsync(), Times.Never);
        }

        [Fact]
        public async Task RecreateDatabase_ShouldReturnError_WhenSeedFails()
        {
            // Arrange
            _mockSeedService.Setup(s => s.RecreateDatabaseAsync())
                .ReturnsAsync(true);
            _mockSeedService.Setup(s => s.SeedTestDataAsync())
                .ReturnsAsync(false);

            // Act
            var result = await _controller.RecreateDatabase();

            // Assert
            var jsonResult = Assert.IsType<JsonResult>(result);
            var (success, message) = ExtractJsonResult(jsonResult);
            Assert.False(success);
            Assert.Equal("Fel vid tillägg av testdata", message);

            _mockSeedService.Verify(s => s.RecreateDatabaseAsync(), Times.Once);
            _mockSeedService.Verify(s => s.SeedTestDataAsync(), Times.Once);
        }

        [Fact]
        public async Task RecreateDatabase_ShouldReturnError_WhenExceptionThrown()
        {
            // Arrange
            _mockSeedService.Setup(s => s.RecreateDatabaseAsync())
                .ThrowsAsync(new Exception("Database error"));

            // Act
            var result = await _controller.RecreateDatabase();

            // Assert
            var jsonResult = Assert.IsType<JsonResult>(result);
            var (success, message) = ExtractJsonResult(jsonResult);
            Assert.False(success);
            Assert.Equal("Ett oväntat fel inträffade", message);

            // Verifiera att fel loggades
            _mockLogger.Verify(
                x => x.Log(
                    LogLevel.Error,
                    It.IsAny<EventId>(),
                    It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("Fel vid återskapning av databas")),
                    It.IsAny<Exception>(),
                    It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
                Times.Once);
        }

        [Fact]
        public async Task LoginAs_ShouldReturnSuccess_WhenUserExists()
        {
            // Arrange
            var email = "test@example.com";
            var user = new ApplicationUser
            {
                Id = "user123",
                Email = email,
                UserName = email
            };

            _mockUserManager.Setup(m => m.FindByEmailAsync(email))
                .ReturnsAsync(user);
            _mockSignInManager.Setup(m => m.SignInAsync(user, false, null))
                .Returns(Task.CompletedTask);

            // Act
            var result = await _controller.LoginAs(email);

            // Assert
            var jsonResult = Assert.IsType<JsonResult>(result);
            var (success, message) = ExtractJsonResult(jsonResult);
            Assert.True(success);
            Assert.Equal($"Inloggad som {email}", message);

            _mockUserManager.Verify(m => m.FindByEmailAsync(email), Times.Once);
            _mockSignInManager.Verify(m => m.SignInAsync(user, false, null), Times.Once);
        }

        [Fact]
        public async Task LoginAs_ShouldReturnError_WhenUserNotFound()
        {
            // Arrange
            var email = "nonexistent@example.com";
            _mockUserManager.Setup(m => m.FindByEmailAsync(email))
                .ReturnsAsync((ApplicationUser?)null);

            // Act
            var result = await _controller.LoginAs(email);

            // Assert
            var jsonResult = Assert.IsType<JsonResult>(result);
            var (success, message) = ExtractJsonResult(jsonResult);
            Assert.False(success);
            Assert.Equal("Användare hittades inte", message);

            _mockUserManager.Verify(m => m.FindByEmailAsync(email), Times.Once);
            _mockSignInManager.Verify(m => m.SignInAsync(It.IsAny<ApplicationUser>(), It.IsAny<bool>(), null), Times.Never);
        }

        [Fact]
        public async Task LoginAs_ShouldReturnError_WhenExceptionThrown()
        {
            // Arrange
            var email = "test@example.com";
            _mockUserManager.Setup(m => m.FindByEmailAsync(email))
                .ThrowsAsync(new Exception("Database error"));

            // Act
            var result = await _controller.LoginAs(email);

            // Assert
            var jsonResult = Assert.IsType<JsonResult>(result);
            var (success, message) = ExtractJsonResult(jsonResult);
            Assert.False(success);
            Assert.Equal("Fel vid inloggning", message);

            // Verifiera att fel loggades
            _mockLogger.Verify(
                x => x.Log(
                    LogLevel.Error,
                    It.IsAny<EventId>(),
                    It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("Fel vid inloggning som")),
                    It.IsAny<Exception>(),
                    It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
                Times.Once);
        }

        [Fact]
        public async Task LoginAs_ShouldAcceptValidEmailFormats()
        {
            // Arrange
            var validEmails = new[]
            {
                "user@example.com",
                "user.name@domain.co.uk",
                "admin1@test.com",
                "test123@gmail.com"
            };

            foreach (var email in validEmails)
            {
                var user = new ApplicationUser { Id = "user123", Email = email, UserName = email };
                _mockUserManager.Setup(m => m.FindByEmailAsync(email))
                    .ReturnsAsync(user);
                _mockSignInManager.Setup(m => m.SignInAsync(user, false, null))
                    .Returns(Task.CompletedTask);

                // Act
                var result = await _controller.LoginAs(email);

                // Assert
                var jsonResult = Assert.IsType<JsonResult>(result);
                var (success, message) = ExtractJsonResult(jsonResult);
                Assert.True(success, $"Failed for email: {email}");
                Assert.Equal($"Inloggad som {email}", message);
            }
        }

        [Fact]
        public void LoginAs_ShouldHaveHttpPostAttribute()
        {
            // Arrange & Act
            var method = typeof(DeveloperToolsController).GetMethod("LoginAs");

            // Assert
            Assert.NotNull(method);
            var httpPostAttribute = method.GetCustomAttributes(typeof(HttpPostAttribute), false)
                .Cast<HttpPostAttribute>().FirstOrDefault();
            Assert.NotNull(httpPostAttribute);
        }

        [Fact]
        public void RecreateDatabase_ShouldHaveHttpPostAttribute()
        {
            // Arrange & Act
            var method = typeof(DeveloperToolsController).GetMethod("RecreateDatabase");

            // Assert
            Assert.NotNull(method);
            var httpPostAttribute = method.GetCustomAttributes(typeof(HttpPostAttribute), false)
                .Cast<HttpPostAttribute>().FirstOrDefault();
            Assert.NotNull(httpPostAttribute);
        }

        [Fact]
        public async Task LoginAs_ShouldSignInWithCorrectParameters()
        {
            // Arrange
            var email = "test@example.com";
            var user = new ApplicationUser { Id = "user123", Email = email, UserName = email };

            _mockUserManager.Setup(m => m.FindByEmailAsync(email))
                .ReturnsAsync(user);
            _mockSignInManager.Setup(m => m.SignInAsync(user, false, null))
                .Returns(Task.CompletedTask);

            // Act
            await _controller.LoginAs(email);

            // Assert
            _mockSignInManager.Verify(m => m.SignInAsync(
                It.Is<ApplicationUser>(u => u.Email == email),
                false, // isPersistent should be false
                null   // authenticationMethod should be null
            ), Times.Once);
        }

        private static (bool success, string message) ExtractJsonResult(JsonResult result)
        {
            var json = JsonSerializer.Serialize(result.Value);
            using var document = JsonDocument.Parse(json);
            var root = document.RootElement;
            
            var success = root.GetProperty("success").GetBoolean();
            var message = root.GetProperty("message").GetString() ?? "";
            
            return (success, message);
        }
    }
}
