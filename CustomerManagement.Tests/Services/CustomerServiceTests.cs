using CustomerManagement.Data;
using CustomerManagement.Models;
using CustomerManagement.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Xunit;

namespace CustomerManagement.Tests.Services
{
    public class CustomerServiceTests : IDisposable
    {
        private readonly ApplicationDbContext _context;
        private readonly CustomerService _customerService;

        public CustomerServiceTests()
        {
            var options = new DbContextOptionsBuilder<ApplicationDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;

            _context = new ApplicationDbContext(options);
            _customerService = new CustomerService(_context);
        }

        [Fact]
        public async Task GetAllCustomersAsync_ShouldReturnCustomersForSpecificUser()
        {
            // Arrange
            var userId1 = "user1";
            var userId2 = "user2";
            
            var customer1 = new Customer { FirstName = "John", LastName = "Doe", Email = "john@example.com", UserId = userId1 };
            var customer2 = new Customer { FirstName = "Jane", LastName = "Smith", Email = "jane@example.com", UserId = userId1 };
            var customer3 = new Customer { FirstName = "Bob", LastName = "Johnson", Email = "bob@example.com", UserId = userId2 };

            _context.Customers.AddRange(customer1, customer2, customer3);
            await _context.SaveChangesAsync();

            // Act
            var result = await _customerService.GetAllCustomersAsync(userId1);

            // Assert
            Assert.Equal(2, result.Count());
            Assert.Contains(result, c => c.FirstName == "John");
            Assert.Contains(result, c => c.FirstName == "Jane");
            Assert.DoesNotContain(result, c => c.FirstName == "Bob");
        }

        [Fact]
        public async Task GetAllCustomersAsync_ShouldReturnEmptyList_WhenUserHasNoCustomers()
        {
            // Arrange
            var userId = "user1";
            var customer = new Customer { FirstName = "John", LastName = "Doe", Email = "john@example.com", UserId = "otheruser" };
            _context.Customers.Add(customer);
            await _context.SaveChangesAsync();

            // Act
            var result = await _customerService.GetAllCustomersAsync(userId);

            // Assert
            Assert.Empty(result);
        }

        [Fact]
        public async Task GetAllCustomersForAdminAsync_ShouldReturnAllCustomers()
        {
            // Arrange
            var customer1 = new Customer { FirstName = "John", LastName = "Doe", Email = "john@example.com", UserId = "user1" };
            var customer2 = new Customer { FirstName = "Jane", LastName = "Smith", Email = "jane@example.com", UserId = "user2" };

            _context.Customers.AddRange(customer1, customer2);
            await _context.SaveChangesAsync();

            // Act
            var result = await _customerService.GetAllCustomersForAdminAsync();

            // Assert
            Assert.Equal(2, result.Count());
            Assert.Contains(result, c => c.FirstName == "John");
            Assert.Contains(result, c => c.FirstName == "Jane");
        }

        [Fact]
        public async Task GetCustomerByIdAsync_ShouldReturnCustomer_WhenCustomerBelongsToUser()
        {
            // Arrange
            var userId = "user1";
            var customer = new Customer { FirstName = "John", LastName = "Doe", Email = "john@example.com", UserId = userId };
            _context.Customers.Add(customer);
            await _context.SaveChangesAsync();

            // Act
            var result = await _customerService.GetCustomerByIdAsync(customer.Id, userId);

            // Assert
            Assert.NotNull(result);
            Assert.Equal("John", result.FirstName);
        }

        [Fact]
        public async Task GetCustomerByIdAsync_ShouldReturnNull_WhenCustomerDoesNotBelongToUser()
        {
            // Arrange
            var userId = "user1";
            var customer = new Customer { FirstName = "John", LastName = "Doe", Email = "john@example.com", UserId = "user2" };
            _context.Customers.Add(customer);
            await _context.SaveChangesAsync();

            // Act
            var result = await _customerService.GetCustomerByIdAsync(customer.Id, userId);

            // Assert
            Assert.Null(result);
        }

        [Fact]
        public async Task CreateCustomerAsync_ShouldCreateCustomerWithCorrectData()
        {
            // Arrange
            var customer = new Customer 
            { 
                FirstName = "John", 
                LastName = "Doe", 
                Email = "john@example.com", 
                UserId = "user1" 
            };

            // Act
            var result = await _customerService.CreateCustomerAsync(customer);

            // Assert
            Assert.NotNull(result);
            Assert.Equal("John", result.FirstName);
            Assert.Equal("Doe", result.LastName);
            Assert.Equal("john@example.com", result.Email);
            Assert.Equal("user1", result.UserId);
            Assert.True(result.CreatedAt > DateTime.UtcNow.AddMinutes(-1));
        }

        [Fact]
        public async Task UpdateCustomerAsync_ShouldUpdateCustomer_WhenCustomerBelongsToUser()
        {
            // Arrange
            var userId = "user1";
            var customer = new Customer { FirstName = "John", LastName = "Doe", Email = "john@example.com", UserId = userId };
            _context.Customers.Add(customer);
            await _context.SaveChangesAsync();

            customer.FirstName = "Updated John";
            customer.Email = "updated@example.com";

            // Act
            var result = await _customerService.UpdateCustomerAsync(customer, userId);

            // Assert
            Assert.NotNull(result);
            Assert.Equal("Updated John", result.FirstName);
            Assert.Equal("updated@example.com", result.Email);
        }

        [Fact]
        public async Task UpdateCustomerAsync_ShouldReturnNull_WhenCustomerDoesNotBelongToUser()
        {
            // Arrange
            var userId = "user1";
            var customer = new Customer { FirstName = "John", LastName = "Doe", Email = "john@example.com", UserId = "user2" };
            _context.Customers.Add(customer);
            await _context.SaveChangesAsync();

            customer.FirstName = "Updated John";

            // Act
            var result = await _customerService.UpdateCustomerAsync(customer, userId);

            // Assert
            Assert.Null(result);
        }

        [Fact]
        public async Task DeleteCustomerAsync_ShouldDeleteCustomer_WhenCustomerBelongsToUser()
        {
            // Arrange
            var userId = "user1";
            var customer = new Customer { FirstName = "John", LastName = "Doe", Email = "john@example.com", UserId = userId };
            _context.Customers.Add(customer);
            await _context.SaveChangesAsync();

            // Act
            var result = await _customerService.DeleteCustomerAsync(customer.Id, userId);

            // Assert
            Assert.True(result);
            var deletedCustomer = await _context.Customers.FindAsync(customer.Id);
            Assert.Null(deletedCustomer);
        }

        [Fact]
        public async Task DeleteCustomerAsync_ShouldReturnFalse_WhenCustomerDoesNotBelongToUser()
        {
            // Arrange
            var userId = "user1";
            var customer = new Customer { FirstName = "John", LastName = "Doe", Email = "john@example.com", UserId = "user2" };
            _context.Customers.Add(customer);
            await _context.SaveChangesAsync();

            // Act
            var result = await _customerService.DeleteCustomerAsync(customer.Id, userId);

            // Assert
            Assert.False(result);
            var existingCustomer = await _context.Customers.FindAsync(customer.Id);
            Assert.NotNull(existingCustomer);
        }

        [Fact]
        public async Task DeleteCustomerForAdminAsync_ShouldDeleteCustomer()
        {
            // Arrange
            var customer = new Customer { FirstName = "John", LastName = "Doe", Email = "john@example.com", UserId = "user1" };
            _context.Customers.Add(customer);
            await _context.SaveChangesAsync();

            // Act
            var result = await _customerService.DeleteCustomerForAdminAsync(customer.Id);

            // Assert
            Assert.True(result);
            var deletedCustomer = await _context.Customers.FindAsync(customer.Id);
            Assert.Null(deletedCustomer);
        }

        [Fact]
        public async Task CustomerExistsAsync_ShouldReturnTrue_WhenCustomerExists()
        {
            // Arrange
            var customer = new Customer { FirstName = "John", LastName = "Doe", Email = "john@example.com", UserId = "user1" };
            _context.Customers.Add(customer);
            await _context.SaveChangesAsync();

            // Act
            var result = await _customerService.CustomerExistsAsync(customer.Id);

            // Assert
            Assert.True(result);
        }

        [Fact]
        public async Task CustomerExistsAsync_ShouldReturnFalse_WhenCustomerDoesNotExist()
        {
            // Act
            var result = await _customerService.CustomerExistsAsync(999);

            // Assert
            Assert.False(result);
        }

        [Fact]
        public async Task CustomerBelongsToUserAsync_ShouldReturnTrue_WhenCustomerBelongsToUser()
        {
            // Arrange
            var userId = "user1";
            var customer = new Customer { FirstName = "John", LastName = "Doe", Email = "john@example.com", UserId = userId };
            _context.Customers.Add(customer);
            await _context.SaveChangesAsync();

            // Act
            var result = await _customerService.CustomerBelongsToUserAsync(customer.Id, userId);

            // Assert
            Assert.True(result);
        }

        [Fact]
        public async Task CustomerBelongsToUserAsync_ShouldReturnFalse_WhenCustomerDoesNotBelongToUser()
        {
            // Arrange
            var userId = "user1";
            var customer = new Customer { FirstName = "John", LastName = "Doe", Email = "john@example.com", UserId = "user2" };
            _context.Customers.Add(customer);
            await _context.SaveChangesAsync();

            // Act
            var result = await _customerService.CustomerBelongsToUserAsync(customer.Id, userId);

            // Assert
            Assert.False(result);
        }

        // Nya tester för att hantera kunder utan ägare (UserId = null)
        [Fact]
        public async Task GetAllCustomersAsync_ShouldReturnCustomersWithNullUserId()
        {
            // Arrange
            var userId = "user1";
            var customerWithOwner = new Customer { FirstName = "John", LastName = "Doe", Email = "john@example.com", UserId = userId };
            var customerWithoutOwner = new Customer { FirstName = "Jane", LastName = "Smith", Email = "jane@example.com", UserId = null };
            
            _context.Customers.AddRange(customerWithOwner, customerWithoutOwner);
            await _context.SaveChangesAsync();

            // Act
            var result = await _customerService.GetAllCustomersAsync(userId);

            // Assert
            Assert.Single(result);
            Assert.Equal("John", result.First().FirstName);
        }

        [Fact]
        public async Task GetAllCustomersForAdminAsync_ShouldReturnCustomersWithNullUserId()
        {
            // Arrange
            var customerWithOwner = new Customer { FirstName = "John", LastName = "Doe", Email = "john@example.com", UserId = "user1" };
            var customerWithoutOwner = new Customer { FirstName = "Jane", LastName = "Smith", Email = "jane@example.com", UserId = null };
            
            _context.Customers.AddRange(customerWithOwner, customerWithoutOwner);
            await _context.SaveChangesAsync();

            // Act
            var result = await _customerService.GetAllCustomersForAdminAsync();

            // Assert
            Assert.Equal(2, result.Count());
            Assert.Contains(result, c => c.FirstName == "John" && c.UserId == "user1");
            Assert.Contains(result, c => c.FirstName == "Jane" && c.UserId == null);
        }

        [Fact]
        public async Task GetCustomerByIdForAdminAsync_ShouldReturnCustomerWithNullUserId()
        {
            // Arrange
            var customer = new Customer { FirstName = "Jane", LastName = "Smith", Email = "jane@example.com", UserId = null };
            _context.Customers.Add(customer);
            await _context.SaveChangesAsync();

            // Act
            var result = await _customerService.GetCustomerByIdForAdminAsync(customer.Id);

            // Assert
            Assert.NotNull(result);
            Assert.Equal("Jane", result.FirstName);
            Assert.Null(result.UserId);
        }

        [Fact]
        public async Task UpdateCustomerForAdminAsync_ShouldUpdateCustomerWithNullUserId()
        {
            // Arrange
            var customer = new Customer { FirstName = "Jane", LastName = "Smith", Email = "jane@example.com", UserId = null };
            _context.Customers.Add(customer);
            await _context.SaveChangesAsync();

            customer.FirstName = "Updated Jane";
            customer.Email = "updated@example.com";

            // Act
            var result = await _customerService.UpdateCustomerForAdminAsync(customer);

            // Assert
            Assert.NotNull(result);
            Assert.Equal("Updated Jane", result.FirstName);
            Assert.Equal("updated@example.com", result.Email);
            Assert.Null(result.UserId);
        }

        [Fact]
        public async Task DeleteCustomerForAdminAsync_ShouldDeleteCustomerWithNullUserId()
        {
            // Arrange
            var customer = new Customer { FirstName = "Jane", LastName = "Smith", Email = "jane@example.com", UserId = null };
            _context.Customers.Add(customer);
            await _context.SaveChangesAsync();

            // Act
            var result = await _customerService.DeleteCustomerForAdminAsync(customer.Id);

            // Assert
            Assert.True(result);
            var deletedCustomer = await _context.Customers.FindAsync(customer.Id);
            Assert.Null(deletedCustomer);
        }

        public void Dispose()
        {
            _context.Dispose();
        }
    }
}