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
    public class CustomerControllerTests
    {
        private readonly Mock<ICustomerService> _mockCustomerService;
        private readonly Mock<UserManager<ApplicationUser>> _mockUserManager;
        private readonly CustomerController _controller;

        public CustomerControllerTests()
        {
            _mockCustomerService = new Mock<ICustomerService>();
            
            var store = new Mock<IUserStore<ApplicationUser>>();
            _mockUserManager = new Mock<UserManager<ApplicationUser>>(
                store.Object, null!, null!, null!, null!, null!, null!, null!, null!);

            _controller = new CustomerController(_mockCustomerService.Object, _mockUserManager.Object);
        }

        [Fact]
        public async Task Index_ShouldReturnViewWithCustomers_WhenUserIsAuthenticated()
        {
            // Arrange
            var userId = "user1";
            var customers = new List<Customer>
            {
                new Customer { Id = 1, FirstName = "Test", LastName = "Customer1", Email = "test1@example.com", UserId = userId },
                new Customer { Id = 2, FirstName = "Test", LastName = "Customer2", Email = "test2@example.com", UserId = userId }
            };

            SetupAuthenticatedUser(userId, false);
            _mockCustomerService.Setup(s => s.GetAllCustomersAsync(userId))
                .ReturnsAsync(customers);

            // Act
            var result = await _controller.Index();

            // Assert
            var viewResult = Assert.IsType<ViewResult>(result);
            var model = Assert.IsAssignableFrom<IEnumerable<Customer>>(viewResult.Model);
            Assert.Equal(2, model.Count());
        }

        [Fact]
        public async Task Index_ShouldReturnAllCustomers_WhenUserIsAdmin()
        {
            // Arrange
            var userId = "admin1";
            var customers = new List<Customer>
            {
                new Customer { Id = 1, FirstName = "Test", LastName = "Customer1", Email = "test1@example.com", UserId = "user1" },
                new Customer { Id = 2, FirstName = "Test", LastName = "Customer2", Email = "test2@example.com", UserId = "user2" }
            };

            SetupAuthenticatedUser(userId, true);
            _mockCustomerService.Setup(s => s.GetAllCustomersForAdminAsync())
                .ReturnsAsync(customers);

            // Act
            var result = await _controller.Index();

            // Assert
            var viewResult = Assert.IsType<ViewResult>(result);
            var model = Assert.IsAssignableFrom<IEnumerable<Customer>>(viewResult.Model);
            Assert.Equal(2, model.Count());
        }

        [Fact]
        public async Task Index_ShouldReturnCustomersWithUserData_WhenUserIsAdmin()
        {
            // Arrange
            var userId = "admin1";
            var user1 = new ApplicationUser { Id = "user1", FirstName = "User", LastName = "One", Email = "user1@example.com" };
            var user2 = new ApplicationUser { Id = "user2", FirstName = "User", LastName = "Two", Email = "user2@example.com" };
            
            var customers = new List<Customer>
            {
                new Customer { Id = 1, FirstName = "Test", LastName = "Customer1", Email = "test1@example.com", UserId = "user1", User = user1 },
                new Customer { Id = 2, FirstName = "Test", LastName = "Customer2", Email = "test2@example.com", UserId = "user2", User = user2 }
            };

            SetupAuthenticatedUser(userId, true);
            _mockCustomerService.Setup(s => s.GetAllCustomersForAdminAsync())
                .ReturnsAsync(customers);

            // Act
            var result = await _controller.Index();

            // Assert
            var viewResult = Assert.IsType<ViewResult>(result);
            var model = Assert.IsAssignableFrom<IEnumerable<Customer>>(viewResult.Model);
            Assert.Equal(2, model.Count());
            
            // Kontrollera att User-data finns
            var customer1 = model.First(c => c.Id == 1);
            Assert.NotNull(customer1.User);
            Assert.Equal("User", customer1.User.FirstName);
            Assert.Equal("One", customer1.User.LastName);
            
            var customer2 = model.First(c => c.Id == 2);
            Assert.NotNull(customer2.User);
            Assert.Equal("User", customer2.User.FirstName);
            Assert.Equal("Two", customer2.User.LastName);
        }

        [Fact]
        public async Task Index_ShouldReturnUnauthorized_WhenUserIsNotAuthenticated()
        {
            // Arrange
            _mockUserManager.Setup(m => m.GetUserId(It.IsAny<ClaimsPrincipal>()))
                .Returns((string?)null);

            // Act
            var result = await _controller.Index();

            // Assert
            Assert.IsType<UnauthorizedResult>(result);
        }

        [Fact]
        public async Task Details_ShouldReturnViewWithCustomer_WhenCustomerExistsAndBelongsToUser()
        {
            // Arrange
            var userId = "user1";
            var customer = new Customer 
            { 
                Id = 1, 
                FirstName = "Test", 
                LastName = "Customer", 
                Email = "test@example.com", 
                UserId = userId 
            };

            SetupAuthenticatedUser(userId, false);
            _mockCustomerService.Setup(s => s.GetCustomerByIdAsync(1, userId))
                .ReturnsAsync(customer);

            // Act
            var result = await _controller.Details(1);

            // Assert
            var viewResult = Assert.IsType<ViewResult>(result);
            var model = Assert.IsType<Customer>(viewResult.Model);
            Assert.Equal(1, model.Id);
            Assert.Equal("Test", model.FirstName);
        }

        [Fact]
        public async Task Details_ShouldReturnNotFound_WhenCustomerDoesNotExist()
        {
            // Arrange
            var userId = "user1";
            SetupAuthenticatedUser(userId, false);
            _mockCustomerService.Setup(s => s.GetCustomerByIdAsync(999, userId))
                .ReturnsAsync((Customer?)null);

            // Act
            var result = await _controller.Details(999);

            // Assert
            Assert.IsType<NotFoundResult>(result);
        }

        [Fact]
        public async Task Details_ShouldReturnCustomer_WhenUserIsAdmin()
        {
            // Arrange
            var userId = "admin1";
            var customer = new Customer 
            { 
                Id = 1, 
                FirstName = "Test", 
                LastName = "Customer", 
                Email = "test@example.com", 
                UserId = "user1" 
            };

            SetupAuthenticatedUser(userId, true);
            _mockCustomerService.Setup(s => s.GetCustomerByIdForAdminAsync(1))
                .ReturnsAsync(customer);

            // Act
            var result = await _controller.Details(1);

            // Assert
            var viewResult = Assert.IsType<ViewResult>(result);
            var model = Assert.IsType<Customer>(viewResult.Model);
            Assert.Equal(1, model.Id);
        }

        [Fact]
        public async Task Details_ShouldReturnCustomerWithUserData_WhenUserIsAdmin()
        {
            // Arrange
            var userId = "admin1";
            var user = new ApplicationUser { Id = "user1", FirstName = "User", LastName = "One", Email = "user1@example.com" };
            var customer = new Customer 
            { 
                Id = 1, 
                FirstName = "Test", 
                LastName = "Customer", 
                Email = "test@example.com", 
                UserId = "user1",
                User = user
            };

            SetupAuthenticatedUser(userId, true);
            _mockCustomerService.Setup(s => s.GetCustomerByIdForAdminAsync(1))
                .ReturnsAsync(customer);

            // Act
            var result = await _controller.Details(1);

            // Assert
            var viewResult = Assert.IsType<ViewResult>(result);
            var model = Assert.IsType<Customer>(viewResult.Model);
            Assert.Equal(1, model.Id);
            Assert.NotNull(model.User);
            Assert.Equal("User", model.User.FirstName);
            Assert.Equal("One", model.User.LastName);
            Assert.Equal("user1@example.com", model.User.Email);
        }

        [Fact]
        public void Create_Get_ShouldReturnView()
        {
            // Act
            var result = _controller.Create();

            // Assert
            Assert.IsType<ViewResult>(result);
        }

        [Fact]
        public async Task Create_Post_ShouldCreateCustomer_WhenModelIsValid()
        {
            // Arrange
            var userId = "user1";
            var model = new CustomerCreateViewModel
            {
                FirstName = "New",
                LastName = "Customer",
                Email = "new@example.com",
                Phone = "070-1234567",
                Address = "Test Street 1",
                City = "Test City",
                PostalCode = "12345",
                Country = "Sverige"
            };

            SetupAuthenticatedUser(userId, false);
            _mockCustomerService.Setup(s => s.CreateCustomerAsync(It.IsAny<Customer>()))
                .ReturnsAsync(new Customer { Id = 1 });

            // Act
            var result = await _controller.Create(model);

            // Assert
            var redirectResult = Assert.IsType<RedirectToActionResult>(result);
            Assert.Equal("Index", redirectResult.ActionName);
            
            _mockCustomerService.Verify(s => s.CreateCustomerAsync(It.Is<Customer>(c => 
                c.FirstName == "New" && 
                c.LastName == "Customer" && 
                c.Email == "new@example.com" &&
                c.UserId == userId)), Times.Once);
        }

        [Fact]
        public async Task Create_Post_ShouldReturnView_WhenModelIsInvalid()
        {
            // Arrange
            var model = new CustomerCreateViewModel();
            _controller.ModelState.AddModelError("FirstName", "Required");

            // Act
            var result = await _controller.Create(model);

            // Assert
            var viewResult = Assert.IsType<ViewResult>(result);
            Assert.Equal(model, viewResult.Model);
        }

        [Fact]
        public async Task Edit_Get_ShouldReturnViewWithCustomer_WhenCustomerExists()
        {
            // Arrange
            var userId = "user1";
            var customer = new Customer 
            { 
                Id = 1, 
                FirstName = "Test", 
                LastName = "Customer", 
                Email = "test@example.com", 
                UserId = userId 
            };

            SetupAuthenticatedUser(userId, false);
            _mockCustomerService.Setup(s => s.GetCustomerByIdAsync(1, userId))
                .ReturnsAsync(customer);

            // Act
            var result = await _controller.Edit(1);

            // Assert
            var viewResult = Assert.IsType<ViewResult>(result);
            var model = Assert.IsType<CustomerEditViewModel>(viewResult.Model);
            Assert.Equal(1, model.Id);
            Assert.Equal("Test", model.FirstName);
        }

        [Fact]
        public async Task Edit_Get_ShouldReturnNotFound_WhenCustomerDoesNotExist()
        {
            // Arrange
            var userId = "user1";
            SetupAuthenticatedUser(userId, false);
            _mockCustomerService.Setup(s => s.GetCustomerByIdAsync(999, userId))
                .ReturnsAsync((Customer?)null);

            // Act
            var result = await _controller.Edit(999);

            // Assert
            Assert.IsType<NotFoundResult>(result);
        }

        [Fact]
        public async Task Edit_Post_ShouldUpdateCustomer_WhenModelIsValid()
        {
            // Arrange
            var userId = "user1";
            var model = new CustomerEditViewModel
            {
                Id = 1,
                FirstName = "Updated",
                LastName = "Customer",
                Email = "updated@example.com",
                Phone = "070-7654321",
                Address = "Updated Street 1",
                City = "Updated City",
                PostalCode = "54321",
                Country = "Sverige"
            };

            var updatedCustomer = new Customer { Id = 1, FirstName = "Updated", UserId = userId };

            SetupAuthenticatedUser(userId, false);
            _mockCustomerService.Setup(s => s.UpdateCustomerAsync(It.IsAny<Customer>(), userId))
                .ReturnsAsync(updatedCustomer);

            // Act
            var result = await _controller.Edit(model);

            // Assert
            var redirectResult = Assert.IsType<RedirectToActionResult>(result);
            Assert.Equal("Index", redirectResult.ActionName);
            
            _mockCustomerService.Verify(s => s.UpdateCustomerAsync(It.Is<Customer>(c => 
                c.Id == 1 && 
                c.FirstName == "Updated" && 
                c.Email == "updated@example.com"), userId), Times.Once);
        }

        [Fact]
        public async Task Edit_Post_ShouldReturnNotFound_WhenCustomerDoesNotExist()
        {
            // Arrange
            var userId = "user1";
            var model = new CustomerEditViewModel { Id = 999 };
            SetupAuthenticatedUser(userId, false);
            _mockCustomerService.Setup(s => s.UpdateCustomerAsync(It.IsAny<Customer>(), userId))
                .ReturnsAsync((Customer?)null);

            // Act
            var result = await _controller.Edit(model);

            // Assert
            Assert.IsType<NotFoundResult>(result);
        }

        [Fact]
        public async Task Delete_Get_ShouldReturnViewWithCustomer_WhenCustomerExists()
        {
            // Arrange
            var userId = "user1";
            var customer = new Customer 
            { 
                Id = 1, 
                FirstName = "Test", 
                LastName = "Customer", 
                Email = "test@example.com", 
                UserId = userId 
            };

            SetupAuthenticatedUser(userId, false);
            _mockCustomerService.Setup(s => s.GetCustomerByIdAsync(1, userId))
                .ReturnsAsync(customer);

            // Act
            var result = await _controller.Delete(1);

            // Assert
            var viewResult = Assert.IsType<ViewResult>(result);
            var model = Assert.IsType<Customer>(viewResult.Model);
            Assert.Equal(1, model.Id);
        }

        [Fact]
        public async Task DeleteConfirmed_ShouldDeleteCustomer_WhenCustomerExists()
        {
            // Arrange
            var userId = "user1";
            SetupAuthenticatedUser(userId, false);
            _mockCustomerService.Setup(s => s.DeleteCustomerAsync(1, userId))
                .ReturnsAsync(true);

            // Act
            var result = await _controller.DeleteConfirmed(1);

            // Assert
            var redirectResult = Assert.IsType<RedirectToActionResult>(result);
            Assert.Equal("Index", redirectResult.ActionName);
            
            _mockCustomerService.Verify(s => s.DeleteCustomerAsync(1, userId), Times.Once);
        }

        [Fact]
        public async Task DeleteConfirmed_ShouldReturnNotFound_WhenCustomerDoesNotExist()
        {
            // Arrange
            var userId = "user1";
            SetupAuthenticatedUser(userId, false);
            _mockCustomerService.Setup(s => s.DeleteCustomerAsync(999, userId))
                .ReturnsAsync(false);

            // Act
            var result = await _controller.DeleteConfirmed(999);

            // Assert
            Assert.IsType<NotFoundResult>(result);
        }

        [Fact]
        public async Task Admin_ShouldBeAbleToEditAnyCustomer()
        {
            // Arrange
            var userId = "admin1";
            var model = new CustomerEditViewModel
            {
                Id = 1,
                FirstName = "Admin Updated",
                LastName = "Customer",
                Email = "admin.updated@example.com"
            };

            var updatedCustomer = new Customer { Id = 1, FirstName = "Admin Updated" };

            SetupAuthenticatedUser(userId, true);
            _mockCustomerService.Setup(s => s.UpdateCustomerForAdminAsync(It.IsAny<Customer>()))
                .ReturnsAsync(updatedCustomer);

            // Act
            var result = await _controller.Edit(model);

            // Assert
            var redirectResult = Assert.IsType<RedirectToActionResult>(result);
            Assert.Equal("Index", redirectResult.ActionName);
            
            _mockCustomerService.Verify(s => s.UpdateCustomerForAdminAsync(It.Is<Customer>(c => 
                c.Id == 1 && 
                c.FirstName == "Admin Updated")), Times.Once);
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

            _mockUserManager.Setup(m => m.GetUserId(It.IsAny<ClaimsPrincipal>()))
                .Returns(userId);
        }
    }
}
