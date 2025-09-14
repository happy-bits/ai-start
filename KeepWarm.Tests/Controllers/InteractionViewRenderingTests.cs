using KeepWarm.Controllers;
using KeepWarm.Controllers.ViewModels;
using KeepWarm.Models;
using KeepWarm.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.ViewFeatures;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Moq;
using System.Security.Claims;

namespace KeepWarm.Tests.Controllers
{
    public class InteractionViewRenderingTests
    {
        private readonly Mock<IInteractionService> _mockInteractionService;
        private readonly Mock<UserManager<ApplicationUser>> _mockUserManager;
        private readonly InteractionController _controller;

        public InteractionViewRenderingTests()
        {
            _mockInteractionService = new Mock<IInteractionService>();
            
            var userStore = new Mock<IUserStore<ApplicationUser>>();
            _mockUserManager = new Mock<UserManager<ApplicationUser>>(
                userStore.Object, 
                new Mock<IOptions<IdentityOptions>>().Object,
                new Mock<IPasswordHasher<ApplicationUser>>().Object,
                new List<IUserValidator<ApplicationUser>>(),
                new List<IPasswordValidator<ApplicationUser>>(),
                new Mock<ILookupNormalizer>().Object,
                new Mock<IdentityErrorDescriber>().Object,
                new Mock<IServiceProvider>().Object,
                new Mock<ILogger<UserManager<ApplicationUser>>>().Object);

            _controller = new InteractionController(_mockInteractionService.Object, _mockUserManager.Object);
            
            // Setup controller context with user
            var user = new ClaimsPrincipal(new ClaimsIdentity(new Claim[]
            {
                new Claim(ClaimTypes.NameIdentifier, "user123"),
                new Claim(ClaimTypes.Name, "test@example.com")
            }, "TestAuthenticationType"));
            
            _controller.ControllerContext = new ControllerContext()
            {
                HttpContext = new DefaultHttpContext() { User = user }
            };
            
            _controller.TempData = new Mock<ITempDataDictionary>().Object;
        }

        [Fact]
        public void Create_GET_ShouldReturnViewWithCorrectModel()
        {
            // Arrange
            var customerId = 1;

            // Act
            var result = _controller.Create(customerId);

            // Assert
            var viewResult = Assert.IsType<ViewResult>(result);
            var model = Assert.IsType<InteractionCreateViewModel>(viewResult.Model);
            Assert.NotNull(model);
            Assert.Equal(customerId, model.CustomerId);
            Assert.Equal(6, model.AvailableInteractionTypes.Count);
            Assert.Contains("Telefonsamtal", model.AvailableInteractionTypes);
            Assert.Contains("Fysiskt möte", model.AvailableInteractionTypes);
            Assert.Contains("Videomöte", model.AvailableInteractionTypes);
            Assert.Contains("LinkedIn", model.AvailableInteractionTypes);
            Assert.Contains("SMS", model.AvailableInteractionTypes);
            Assert.Contains("Mail", model.AvailableInteractionTypes);
        }

        [Fact]
        public async Task Edit_GET_ShouldReturnViewWithCorrectModel()
        {
            // Arrange
            var interactionId = 1;
            var userId = "user123";
            
            _mockUserManager.Setup(x => x.GetUserId(It.IsAny<ClaimsPrincipal>()))
                .Returns(userId);

            var interaction = new Interaction
            {
                Id = 1,
                CustomerId = 1,
                UserId = userId,
                InteractionType = "Telefonsamtal",
                Description = "Test beskrivning",
                InteractionDate = new DateTime(2024, 1, 15, 14, 30, 0)
            };

            _mockInteractionService.Setup(x => x.GetInteractionByIdAsync(interactionId))
                .ReturnsAsync(interaction);

            // Act
            var result = await _controller.Edit(interactionId);

            // Assert
            var viewResult = Assert.IsType<ViewResult>(result);
            var model = Assert.IsType<InteractionEditViewModel>(viewResult.Model);
            Assert.NotNull(model);
            Assert.Equal(interaction.Id, model.Id);
            Assert.Equal(interaction.InteractionType, model.InteractionType);
            Assert.Equal(interaction.Description, model.Description);
            Assert.Equal(6, model.AvailableInteractionTypes.Count);
        }

        [Fact]
        public async Task Details_GET_ShouldReturnViewWithCorrectModel()
        {
            // Arrange
            var interactionId = 1;
            var userId = "user123";
            
            _mockUserManager.Setup(x => x.GetUserId(It.IsAny<ClaimsPrincipal>()))
                .Returns(userId);

            var interaction = new Interaction
            {
                Id = 1,
                CustomerId = 1,
                UserId = userId,
                InteractionType = "Telefonsamtal",
                Description = "Test beskrivning",
                Customer = new Customer { Id = 1, FirstName = "Test", LastName = "Customer" },
                User = new ApplicationUser { Id = "user123", FirstName = "Test", LastName = "User" }
            };

            _mockInteractionService.Setup(x => x.GetInteractionByIdAsync(interactionId))
                .ReturnsAsync(interaction);

            // Act
            var result = await _controller.Details(interactionId);

            // Assert
            var viewResult = Assert.IsType<ViewResult>(result);
            Assert.NotNull(viewResult.Model);
            Assert.Equal(interaction, viewResult.Model);
        }

        [Fact]
        public async Task Delete_GET_ShouldReturnViewWithCorrectModel()
        {
            // Arrange
            var interactionId = 1;
            var userId = "user123";
            
            _mockUserManager.Setup(x => x.GetUserId(It.IsAny<ClaimsPrincipal>()))
                .Returns(userId);

            var interaction = new Interaction
            {
                Id = 1,
                CustomerId = 1,
                UserId = userId,
                InteractionType = "Telefonsamtal",
                Description = "Test beskrivning",
                Customer = new Customer { Id = 1, FirstName = "Test", LastName = "Customer" }
            };

            _mockInteractionService.Setup(x => x.GetInteractionByIdAsync(interactionId))
                .ReturnsAsync(interaction);

            // Act
            var result = await _controller.Delete(interactionId);

            // Assert
            var viewResult = Assert.IsType<ViewResult>(result);
            Assert.NotNull(viewResult.Model);
            Assert.Equal(interaction, viewResult.Model);
        }

        [Fact]
        public void InteractionCreateViewModel_ShouldHaveCorrectProperties()
        {
            // Arrange
            var model = new InteractionCreateViewModel
            {
                CustomerId = 1,
                InteractionType = "Telefonsamtal",
                Description = "Test beskrivning",
                InteractionDate = DateTime.Now
            };

            // Act & Assert
            Assert.Equal(1, model.CustomerId);
            Assert.Equal("Telefonsamtal", model.InteractionType);
            Assert.Equal("Test beskrivning", model.Description);
            Assert.True(model.InteractionDate > DateTime.MinValue);
            Assert.Equal(6, model.AvailableInteractionTypes.Count);
        }

        [Fact]
        public void InteractionEditViewModel_ShouldHaveCorrectProperties()
        {
            // Arrange
            var model = new InteractionEditViewModel
            {
                Id = 1,
                CustomerId = 1,
                InteractionType = "Mail",
                Description = "Uppdaterad beskrivning",
                InteractionDate = DateTime.Now
            };

            // Act & Assert
            Assert.Equal(1, model.Id);
            Assert.Equal(1, model.CustomerId);
            Assert.Equal("Mail", model.InteractionType);
            Assert.Equal("Uppdaterad beskrivning", model.Description);
            Assert.True(model.InteractionDate > DateTime.MinValue);
            Assert.Equal(6, model.AvailableInteractionTypes.Count);
        }
    }
}
