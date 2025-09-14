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
    public class CustomerNavigationTests
    {
        private readonly Mock<ICustomerService> _mockCustomerService;
        private readonly Mock<IInteractionService> _mockInteractionService;
        private readonly Mock<UserManager<ApplicationUser>> _mockUserManager;
        private readonly CustomerController _controller;

        public CustomerNavigationTests()
        {
            _mockCustomerService = new Mock<ICustomerService>();
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

            _controller = new CustomerController(_mockCustomerService.Object, _mockInteractionService.Object, _mockUserManager.Object);
            
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
        public async Task Customer_Details_ShouldShowInteractionSection()
        {
            // Arrange
            var customerId = 1;
            var userId = "user123";
            
            _mockUserManager.Setup(x => x.GetUserId(It.IsAny<ClaimsPrincipal>()))
                .Returns(userId);

            var customer = new Customer
            {
                Id = customerId,
                FirstName = "Test",
                LastName = "Customer",
                Email = "test@example.com",
                UserId = userId
            };

            var interactions = new List<Interaction>
            {
                new Interaction
                {
                    Id = 1,
                    CustomerId = customerId,
                    UserId = userId,
                    InteractionType = "Telefonsamtal",
                    Description = "Diskuterade projektet",
                    InteractionDate = DateTime.Now.AddDays(-1)
                },
                new Interaction
                {
                    Id = 2,
                    CustomerId = customerId,
                    UserId = userId,
                    InteractionType = "Mail",
                    Description = "Skickade offert",
                    InteractionDate = DateTime.Now.AddDays(-2)
                }
            };

            _mockCustomerService.Setup(x => x.GetCustomerByIdAsync(customerId, userId))
                .ReturnsAsync(customer);
            _mockInteractionService.Setup(x => x.GetInteractionsByCustomerIdAsync(customerId))
                .ReturnsAsync(interactions);

            // Act
            var result = await _controller.Details(customerId);

            // Assert
            var viewResult = Assert.IsType<ViewResult>(result);
            Assert.NotNull(viewResult.Model);
            
            // Verify that interactions are passed to the view
            Assert.True(viewResult.ViewData.ContainsKey("Interactions"));
            var viewInteractions = viewResult.ViewData["Interactions"] as IEnumerable<Interaction>;
            Assert.NotNull(viewInteractions);
            Assert.Equal(2, viewInteractions.Count());
        }

        [Fact]
        public async Task Customer_Details_ShouldShowCreateInteractionButton()
        {
            // Arrange
            var customerId = 1;
            var userId = "user123";
            
            _mockUserManager.Setup(x => x.GetUserId(It.IsAny<ClaimsPrincipal>()))
                .Returns(userId);

            var customer = new Customer
            {
                Id = customerId,
                FirstName = "Test",
                LastName = "Customer",
                Email = "test@example.com",
                UserId = userId
            };

            _mockCustomerService.Setup(x => x.GetCustomerByIdAsync(customerId, userId))
                .ReturnsAsync(customer);
            _mockInteractionService.Setup(x => x.GetInteractionsByCustomerIdAsync(customerId))
                .ReturnsAsync(new List<Interaction>());

            // Act
            var result = await _controller.Details(customerId);

            // Assert
            var viewResult = Assert.IsType<ViewResult>(result);
            Assert.NotNull(viewResult.Model);
            
            // Verify that customer data is available for creating interaction links
            var model = Assert.IsType<Customer>(viewResult.Model);
            Assert.Equal(customerId, model.Id);
        }

        [Fact]
        public async Task Customer_Details_ShouldShowInteractionCount()
        {
            // Arrange
            var customerId = 1;
            var userId = "user123";
            
            _mockUserManager.Setup(x => x.GetUserId(It.IsAny<ClaimsPrincipal>()))
                .Returns(userId);

            var customer = new Customer
            {
                Id = customerId,
                FirstName = "Test",
                LastName = "Customer",
                Email = "test@example.com",
                UserId = userId
            };

            var interactions = new List<Interaction>
            {
                new Interaction { Id = 1, CustomerId = customerId, UserId = userId, InteractionType = "Telefonsamtal", Description = "Test" },
                new Interaction { Id = 2, CustomerId = customerId, UserId = userId, InteractionType = "Mail", Description = "Test" },
                new Interaction { Id = 3, CustomerId = customerId, UserId = userId, InteractionType = "Möte", Description = "Test" }
            };

            _mockCustomerService.Setup(x => x.GetCustomerByIdAsync(customerId, userId))
                .ReturnsAsync(customer);
            _mockInteractionService.Setup(x => x.GetInteractionsByCustomerIdAsync(customerId))
                .ReturnsAsync(interactions);

            // Act
            var result = await _controller.Details(customerId);

            // Assert
            var viewResult = Assert.IsType<ViewResult>(result);
            Assert.NotNull(viewResult.Model);
            
            // Verify that interaction count is passed to the view
            Assert.True(viewResult.ViewData.ContainsKey("InteractionCount"));
            var interactionCount = viewResult.ViewData["InteractionCount"];
            Assert.Equal(3, interactionCount);
        }

        [Fact]
        public async Task Customer_Details_ShouldShowRecentInteractions()
        {
            // Arrange
            var customerId = 1;
            var userId = "user123";
            
            _mockUserManager.Setup(x => x.GetUserId(It.IsAny<ClaimsPrincipal>()))
                .Returns(userId);

            var customer = new Customer
            {
                Id = customerId,
                FirstName = "Test",
                LastName = "Customer",
                Email = "test@example.com",
                UserId = userId
            };

            var interactions = new List<Interaction>
            {
                new Interaction 
                { 
                    Id = 1, 
                    CustomerId = customerId, 
                    UserId = userId, 
                    InteractionType = "Telefonsamtal", 
                    Description = "Senaste interaktionen",
                    InteractionDate = DateTime.Now.AddDays(-1)
                },
                new Interaction 
                { 
                    Id = 2, 
                    CustomerId = customerId, 
                    UserId = userId, 
                    InteractionType = "Mail", 
                    Description = "Äldre interaktion",
                    InteractionDate = DateTime.Now.AddDays(-5)
                }
            };

            _mockCustomerService.Setup(x => x.GetCustomerByIdAsync(customerId, userId))
                .ReturnsAsync(customer);
            _mockInteractionService.Setup(x => x.GetInteractionsByCustomerIdAsync(customerId))
                .ReturnsAsync(interactions);

            // Act
            var result = await _controller.Details(customerId);

            // Assert
            var viewResult = Assert.IsType<ViewResult>(result);
            Assert.NotNull(viewResult.Model);
            
            // Verify that interactions are ordered by date (most recent first)
            Assert.True(viewResult.ViewData.ContainsKey("Interactions"));
            var viewInteractions = viewResult.ViewData["Interactions"] as IEnumerable<Interaction>;
            Assert.NotNull(viewInteractions);
            
            var interactionsList = viewInteractions.ToList();
            Assert.Equal(2, interactionsList.Count);
            Assert.Equal("Senaste interaktionen", interactionsList[0].Description);
            Assert.Equal("Äldre interaktion", interactionsList[1].Description);
        }
    }
}
