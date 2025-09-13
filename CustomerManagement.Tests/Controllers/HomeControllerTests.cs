using CustomerManagement.Controllers;
using CustomerManagement.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Moq;
using System.Diagnostics;

namespace CustomerManagement.Tests.Controllers
{
    public class HomeControllerTests
    {
        private readonly Mock<ILogger<HomeController>> _mockLogger;
        private readonly Mock<IConfiguration> _mockConfiguration;
        private readonly HomeController _controller;

        public HomeControllerTests()
        {
            _mockLogger = new Mock<ILogger<HomeController>>();
            _mockConfiguration = new Mock<IConfiguration>();
            _controller = new HomeController(_mockLogger.Object, _mockConfiguration.Object);
        }

        [Fact]
        public void Index_ShouldReturnView()
        {
            // Arrange
            var configSection = new Mock<IConfigurationSection>();
            configSection.Setup(x => x.Value).Returns("false");
            _mockConfiguration.Setup(c => c.GetSection("DeveloperTools:Enabled"))
                .Returns(configSection.Object);

            // Act
            var result = _controller.Index();

            // Assert
            var viewResult = Assert.IsType<ViewResult>(result);
            Assert.False((bool)viewResult.ViewData["ShowDeveloperTools"]!);
        }

        [Fact]
        public void Index_ShouldShowDeveloperTools_WhenEnabled()
        {
            // Arrange
            var configSection = new Mock<IConfigurationSection>();
            configSection.Setup(x => x.Value).Returns("true");
            _mockConfiguration.Setup(c => c.GetSection("DeveloperTools:Enabled"))
                .Returns(configSection.Object);

            // Act
            var result = _controller.Index();

            // Assert
            var viewResult = Assert.IsType<ViewResult>(result);
            Assert.True((bool)viewResult.ViewData["ShowDeveloperTools"]!);
        }

        [Fact]
        public void Index_ShouldNotShowDeveloperTools_WhenDisabled()
        {
            // Arrange
            var configSection = new Mock<IConfigurationSection>();
            configSection.Setup(x => x.Value).Returns("false");
            _mockConfiguration.Setup(c => c.GetSection("DeveloperTools:Enabled"))
                .Returns(configSection.Object);

            // Act
            var result = _controller.Index();

            // Assert
            var viewResult = Assert.IsType<ViewResult>(result);
            Assert.False((bool)viewResult.ViewData["ShowDeveloperTools"]!);
        }

        [Fact]
        public void Privacy_ShouldReturnView()
        {
            // Act
            var result = _controller.Privacy();

            // Assert
            Assert.IsType<ViewResult>(result);
        }

        [Fact]
        public void Error_ShouldReturnViewWithErrorViewModel()
        {
            // Arrange
            var httpContext = new Microsoft.AspNetCore.Http.DefaultHttpContext();
            httpContext.TraceIdentifier = "test-trace-id";
            
            _controller.ControllerContext = new ControllerContext
            {
                HttpContext = httpContext
            };

            // Act
            var result = _controller.Error();

            // Assert
            var viewResult = Assert.IsType<ViewResult>(result);
            var model = Assert.IsType<ErrorViewModel>(viewResult.Model);
            Assert.Equal("test-trace-id", model.RequestId);
        }

        [Fact]
        public void Error_ShouldUseActivityCurrentId_WhenAvailable()
        {
            // Arrange
            var activity = new Activity("test-activity");
            activity.Start();
            
            var httpContext = new Microsoft.AspNetCore.Http.DefaultHttpContext();
            httpContext.TraceIdentifier = "http-trace-id";
            
            _controller.ControllerContext = new ControllerContext
            {
                HttpContext = httpContext
            };

            // Act
            var result = _controller.Error();

            // Assert
            var viewResult = Assert.IsType<ViewResult>(result);
            var model = Assert.IsType<ErrorViewModel>(viewResult.Model);
            Assert.Equal(activity.Id, model.RequestId);
            
            activity.Stop();
        }

        [Fact]
        public void Error_ShouldHaveCorrectCacheSettings()
        {
            // Arrange & Act
            var method = typeof(HomeController).GetMethod("Error");
            var responseCacheAttribute = method?.GetCustomAttributes(typeof(ResponseCacheAttribute), false)
                .Cast<ResponseCacheAttribute>().FirstOrDefault();
            
            // Assert
            Assert.NotNull(responseCacheAttribute);
            Assert.Equal(0, responseCacheAttribute.Duration);
            Assert.Equal(ResponseCacheLocation.None, responseCacheAttribute.Location);
            Assert.True(responseCacheAttribute.NoStore);
        }

        [Fact]
        public void Error_ShouldReturnErrorViewModel_WithShowRequestIdTrue()
        {
            // Arrange
            var httpContext = new Microsoft.AspNetCore.Http.DefaultHttpContext();
            httpContext.TraceIdentifier = "test-trace-id";
            
            _controller.ControllerContext = new ControllerContext
            {
                HttpContext = httpContext
            };

            // Act
            var result = _controller.Error();

            // Assert
            var viewResult = Assert.IsType<ViewResult>(result);
            var model = Assert.IsType<ErrorViewModel>(viewResult.Model);
            Assert.True(model.ShowRequestId);
        }

        [Fact]
        public void Error_ShouldReturnErrorViewModel_WithShowRequestIdFalse_WhenRequestIdIsEmpty()
        {
            // Arrange
            var httpContext = new Microsoft.AspNetCore.Http.DefaultHttpContext();
            httpContext.TraceIdentifier = "";
            
            _controller.ControllerContext = new ControllerContext
            {
                HttpContext = httpContext
            };

            // Act
            var result = _controller.Error();

            // Assert
            var viewResult = Assert.IsType<ViewResult>(result);
            var model = Assert.IsType<ErrorViewModel>(viewResult.Model);
            Assert.False(model.ShowRequestId);
        }
    }
}
