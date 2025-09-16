using KeepWarm.Controllers;
using KeepWarm.Models;
using KeepWarm.Services;
using KeepWarm.Tests.TestHelpers;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Moq;
using System.Text.Json;

namespace KeepWarm.Tests.Controllers
{
    public class DeveloperToolsControllerTests : ControllerTestBase<DeveloperToolsController>
    {
        private readonly DeveloperToolsController _controller;

        public DeveloperToolsControllerTests()
        {
            _controller = new DeveloperToolsController(
                MockDatabaseSeedService.Object,
                MockSignInManager.Object,
                MockUserManager.Object,
                MockConfiguration.Object,
                MockLogger.Object);
        }

        [Fact]
        public async Task RecreateDatabase_ShouldReturnSuccess_WhenBothOperationsSucceed()
        {
            // Arrange
            MockDatabaseSeedService.Setup(s => s.RecreateDatabaseAsync())
                .ReturnsAsync(true);
            MockDatabaseSeedService.Setup(s => s.SeedTestDataAsync())
                .ReturnsAsync(true);

            // Act
            var result = await _controller.RecreateDatabase();

            // Assert
            var jsonResult = Assert.IsType<JsonResult>(result);
            var (success, message) = ExtractJsonResult(jsonResult);
            Assert.True(success);
            Assert.Equal("Databas återskapad och testdata tillagd!", message);

            MockDatabaseSeedService.Verify(s => s.RecreateDatabaseAsync(), Times.Once);
            MockDatabaseSeedService.Verify(s => s.SeedTestDataAsync(), Times.Once);
        }

        [Fact]
        public async Task RecreateDatabase_ShouldReturnError_WhenRecreateFails()
        {
            // Arrange
            MockDatabaseSeedService.Setup(s => s.RecreateDatabaseAsync())
                .ReturnsAsync(false);

            // Act
            var result = await _controller.RecreateDatabase();

            // Assert
            var jsonResult = Assert.IsType<JsonResult>(result);
            var (success, message) = ExtractJsonResult(jsonResult);
            Assert.False(success);
            Assert.Equal("Fel vid återskapning av databas", message);

            MockDatabaseSeedService.Verify(s => s.RecreateDatabaseAsync(), Times.Once);
            MockDatabaseSeedService.Verify(s => s.SeedTestDataAsync(), Times.Never);
        }

        [Fact]
        public async Task RecreateDatabase_ShouldReturnError_WhenSeedFails()
        {
            // Arrange
            MockDatabaseSeedService.Setup(s => s.RecreateDatabaseAsync())
                .ReturnsAsync(true);
            MockDatabaseSeedService.Setup(s => s.SeedTestDataAsync())
                .ReturnsAsync(false);

            // Act
            var result = await _controller.RecreateDatabase();

            // Assert
            var jsonResult = Assert.IsType<JsonResult>(result);
            var (success, message) = ExtractJsonResult(jsonResult);
            Assert.False(success);
            Assert.Equal("Fel vid tillägg av testdata", message);

            MockDatabaseSeedService.Verify(s => s.RecreateDatabaseAsync(), Times.Once);
            MockDatabaseSeedService.Verify(s => s.SeedTestDataAsync(), Times.Once);
        }

        [Fact]
        public async Task RecreateDatabase_ShouldReturnError_WhenExceptionThrown()
        {
            // Arrange
            MockDatabaseSeedService.Setup(s => s.RecreateDatabaseAsync())
                .ThrowsAsync(new Exception("Database error"));

            // Act
            var result = await _controller.RecreateDatabase();

            // Assert
            var jsonResult = Assert.IsType<JsonResult>(result);
            var (success, message) = ExtractJsonResult(jsonResult);
            Assert.False(success);
            Assert.Equal("Ett oväntat fel inträffade", message);

            // Verifiera att fel loggades
            MockLogger.Verify(
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
            var user = TestDataFactory.CreateUser(email, id: "user123");

            MockUserManager.Setup(m => m.FindByEmailAsync(email))
                .ReturnsAsync(user);
            MockSignInManager.Setup(m => m.SignInAsync(user, false, null))
                .Returns(Task.CompletedTask);

            // Act
            var result = await _controller.LoginAs(email);

            // Assert
            var jsonResult = Assert.IsType<JsonResult>(result);
            var (success, message) = ExtractJsonResult(jsonResult);
            Assert.True(success);
            Assert.Equal($"Inloggad som {email}", message);

            MockUserManager.Verify(m => m.FindByEmailAsync(email), Times.Once);
            MockSignInManager.Verify(m => m.SignInAsync(user, false, null), Times.Once);
        }

        [Fact]
        public async Task LoginAs_ShouldReturnError_WhenUserNotFound()
        {
            // Arrange
            var email = "nonexistent@example.com";
            MockUserManager.Setup(m => m.FindByEmailAsync(email))
                .ReturnsAsync((ApplicationUser?)null);

            // Act
            var result = await _controller.LoginAs(email);

            // Assert
            var jsonResult = Assert.IsType<JsonResult>(result);
            var (success, message) = ExtractJsonResult(jsonResult);
            Assert.False(success);
            Assert.Equal("Användare hittades inte", message);

            MockUserManager.Verify(m => m.FindByEmailAsync(email), Times.Once);
            MockSignInManager.Verify(m => m.SignInAsync(It.IsAny<ApplicationUser>(), It.IsAny<bool>(), null), Times.Never);
        }

        [Fact]
        public async Task LoginAs_ShouldReturnError_WhenExceptionThrown()
        {
            // Arrange
            var email = "test@example.com";
            MockUserManager.Setup(m => m.FindByEmailAsync(email))
                .ThrowsAsync(new Exception("Database error"));

            // Act
            var result = await _controller.LoginAs(email);

            // Assert
            var jsonResult = Assert.IsType<JsonResult>(result);
            var (success, message) = ExtractJsonResult(jsonResult);
            Assert.False(success);
            Assert.Equal("Fel vid inloggning", message);

            // Verifiera att fel loggades
            MockLogger.Verify(
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
                var user = TestDataFactory.CreateUser(email, id: "user123");
                MockUserManager.Setup(m => m.FindByEmailAsync(email))
                    .ReturnsAsync(user);
                MockSignInManager.Setup(m => m.SignInAsync(user, false, null))
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
            var user = TestDataFactory.CreateUser(email, id: "user123");

            MockUserManager.Setup(m => m.FindByEmailAsync(email))
                .ReturnsAsync(user);
            MockSignInManager.Setup(m => m.SignInAsync(user, false, null))
                .Returns(Task.CompletedTask);

            // Act
            await _controller.LoginAs(email);

            // Assert
            MockSignInManager.Verify(m => m.SignInAsync(
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
