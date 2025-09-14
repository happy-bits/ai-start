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
    public class InteractionControllerTests
    {
        private readonly Mock<IInteractionService> _mockInteractionService;
        private readonly Mock<UserManager<ApplicationUser>> _mockUserManager;
        private readonly InteractionController _controller;

        public InteractionControllerTests()
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
        public void Create_GET_ShouldReturnViewWithViewModel()
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
        }

        [Fact]
        public async Task Create_POST_WithValidModel_ShouldCreateInteractionAndRedirect()
        {
            // Arrange
            var userId = "user123";
            _mockUserManager.Setup(x => x.GetUserId(It.IsAny<ClaimsPrincipal>()))
                .Returns(userId);

            var model = new InteractionCreateViewModel
            {
                CustomerId = 1,
                InteractionType = "Telefonsamtal",
                Description = "Diskuterade projektets framsteg",
                InteractionDate = new DateTime(2024, 1, 15, 14, 30, 0)
            };

            _mockInteractionService.Setup(x => x.CreateInteractionAsync(It.IsAny<Interaction>()))
                .ReturnsAsync(true);

            // Act
            var result = await _controller.Create(model);

            // Assert
            var redirectResult = Assert.IsType<RedirectToActionResult>(result);
            Assert.Equal("Details", redirectResult.ActionName);
            Assert.Equal("Customer", redirectResult.ControllerName);
            Assert.NotNull(redirectResult.RouteValues);
            Assert.Equal(1, redirectResult.RouteValues["id"]);

            _mockInteractionService.Verify(x => x.CreateInteractionAsync(It.Is<Interaction>(i =>
                i.CustomerId == 1 &&
                i.UserId == userId &&
                i.InteractionType == "Telefonsamtal" &&
                i.Description == "Diskuterade projektets framsteg"
            )), Times.Once);
        }

        [Fact]
        public async Task Create_POST_WithInvalidModel_ShouldReturnView()
        {
            // Arrange
            var model = new InteractionCreateViewModel
            {
                CustomerId = 1,
                InteractionType = "", // Invalid - empty
                Description = "Test beskrivning"
            };

            _controller.ModelState.AddModelError("InteractionType", "InteractionType is required");

            // Act
            var result = await _controller.Create(model);

            // Assert
            var viewResult = Assert.IsType<ViewResult>(result);
            Assert.Equal(model, viewResult.Model);
        }

        [Fact]
        public async Task Edit_GET_WithValidId_ShouldReturnViewWithViewModel()
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
        }

        [Fact]
        public async Task Edit_GET_WithInvalidId_ShouldReturnNotFound()
        {
            // Arrange
            var interactionId = 999;
            var userId = "user123";
            
            _mockUserManager.Setup(x => x.GetUserId(It.IsAny<ClaimsPrincipal>()))
                .Returns(userId);
            
            _mockInteractionService.Setup(x => x.GetInteractionByIdAsync(interactionId))
                .ReturnsAsync((Interaction?)null);

            // Act
            var result = await _controller.Edit(interactionId);

            // Assert
            Assert.IsType<NotFoundResult>(result);
        }

        [Fact]
        public async Task Edit_POST_WithValidModel_ShouldUpdateInteractionAndRedirect()
        {
            // Arrange
            var userId = "user123";
            _mockUserManager.Setup(x => x.GetUserId(It.IsAny<ClaimsPrincipal>()))
                .Returns(userId);

            var model = new InteractionEditViewModel
            {
                Id = 1,
                CustomerId = 1,
                InteractionType = "Mail",
                Description = "Uppdaterad beskrivning",
                InteractionDate = new DateTime(2024, 1, 16, 10, 0, 0)
            };

            var existingInteraction = new Interaction
            {
                Id = 1,
                CustomerId = 1,
                UserId = userId,
                InteractionType = "Telefonsamtal",
                Description = "Original beskrivning"
            };

            _mockInteractionService.Setup(x => x.GetInteractionByIdAsync(1))
                .ReturnsAsync(existingInteraction);
            _mockInteractionService.Setup(x => x.UpdateInteractionAsync(It.IsAny<Interaction>()))
                .ReturnsAsync(true);

            // Act
            var result = await _controller.Edit(model);

            // Assert
            var redirectResult = Assert.IsType<RedirectToActionResult>(result);
            Assert.Equal("Details", redirectResult.ActionName);
            Assert.Equal("Customer", redirectResult.ControllerName);
            Assert.NotNull(redirectResult.RouteValues);
            Assert.Equal(1, redirectResult.RouteValues["id"]);

            _mockInteractionService.Verify(x => x.UpdateInteractionAsync(It.Is<Interaction>(i =>
                i.Id == 1 &&
                i.InteractionType == "Mail" &&
                i.Description == "Uppdaterad beskrivning"
            )), Times.Once);
        }

        [Fact]
        public async Task Delete_GET_WithValidId_ShouldReturnViewWithInteraction()
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
        public async Task DeleteConfirmed_WithValidId_ShouldDeleteInteractionAndRedirect()
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
                Description = "Test beskrivning"
            };

            _mockInteractionService.Setup(x => x.GetInteractionByIdAsync(interactionId))
                .ReturnsAsync(interaction);
            _mockInteractionService.Setup(x => x.DeleteInteractionAsync(interactionId))
                .ReturnsAsync(true);

            // Act
            var result = await _controller.DeleteConfirmed(interactionId);

            // Assert
            var redirectResult = Assert.IsType<RedirectToActionResult>(result);
            Assert.Equal("Details", redirectResult.ActionName);
            Assert.Equal("Customer", redirectResult.ControllerName);
            Assert.NotNull(redirectResult.RouteValues);
            Assert.Equal(1, redirectResult.RouteValues["id"]);

            _mockInteractionService.Verify(x => x.DeleteInteractionAsync(interactionId), Times.Once);
        }

        [Fact]
        public async Task DeleteConfirmed_WithInvalidId_ShouldReturnNotFound()
        {
            // Arrange
            var interactionId = 999;
            var userId = "user123";
            
            _mockUserManager.Setup(x => x.GetUserId(It.IsAny<ClaimsPrincipal>()))
                .Returns(userId);
            
            _mockInteractionService.Setup(x => x.GetInteractionByIdAsync(interactionId))
                .ReturnsAsync((Interaction?)null);

            // Act
            var result = await _controller.DeleteConfirmed(interactionId);

            // Assert
            Assert.IsType<NotFoundResult>(result);
        }

        [Fact]
        public async Task Details_WithValidId_ShouldReturnViewWithInteraction()
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
        public async Task Details_WithInvalidId_ShouldReturnNotFound()
        {
            // Arrange
            var interactionId = 999;
            var userId = "user123";
            
            _mockUserManager.Setup(x => x.GetUserId(It.IsAny<ClaimsPrincipal>()))
                .Returns(userId);
            
            _mockInteractionService.Setup(x => x.GetInteractionByIdAsync(interactionId))
                .ReturnsAsync((Interaction?)null);

            // Act
            var result = await _controller.Details(interactionId);

            // Assert
            Assert.IsType<NotFoundResult>(result);
        }
    }
}
