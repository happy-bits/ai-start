using KeepWarm.Models;
using KeepWarm.Services;
using KeepWarm.Tests.TestHelpers;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace KeepWarm.Tests.Services
{
    public class CustomerServiceTests : DbContextTestBase
    {
        private readonly CustomerService _customerService;

        public CustomerServiceTests()
        {
            _customerService = new CustomerService(Context);
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

            await SeedDatabaseAsync(customer1, customer2, customer3);

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
            await SeedDatabaseAsync(customer);

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

            await SeedDatabaseAsync(customer1, customer2);

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
            await SeedDatabaseAsync(customer);

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
            await SeedDatabaseAsync(customer);

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
            await SeedDatabaseAsync(customer);

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
            await SeedDatabaseAsync(customer);

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
            await SeedDatabaseAsync(customer);

            // Act
            var result = await _customerService.DeleteCustomerAsync(customer.Id, userId);

            // Assert
            Assert.True(result);
            var deletedCustomer = await Context.Customers.FindAsync(customer.Id);
            Assert.Null(deletedCustomer);
        }

        [Fact]
        public async Task DeleteCustomerAsync_ShouldReturnFalse_WhenCustomerDoesNotBelongToUser()
        {
            // Arrange
            var userId = "user1";
            var customer = new Customer { FirstName = "John", LastName = "Doe", Email = "john@example.com", UserId = "user2" };
            await SeedDatabaseAsync(customer);

            // Act
            var result = await _customerService.DeleteCustomerAsync(customer.Id, userId);

            // Assert
            Assert.False(result);
            var existingCustomer = await Context.Customers.FindAsync(customer.Id);
            Assert.NotNull(existingCustomer);
        }

        [Fact]
        public async Task DeleteCustomerForAdminAsync_ShouldDeleteCustomer()
        {
            // Arrange
            var customer = new Customer { FirstName = "John", LastName = "Doe", Email = "john@example.com", UserId = "user1" };
            await SeedDatabaseAsync(customer);

            // Act
            var result = await _customerService.DeleteCustomerForAdminAsync(customer.Id);

            // Assert
            Assert.True(result);
            var deletedCustomer = await Context.Customers.FindAsync(customer.Id);
            Assert.Null(deletedCustomer);
        }

        [Fact]
        public async Task CustomerExistsAsync_ShouldReturnTrue_WhenCustomerExists()
        {
            // Arrange
            var customer = new Customer { FirstName = "John", LastName = "Doe", Email = "john@example.com", UserId = "user1" };
            await SeedDatabaseAsync(customer);

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
            await SeedDatabaseAsync(customer);

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
            await SeedDatabaseAsync(customer);

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
            
            await SeedDatabaseAsync(customerWithOwner, customerWithoutOwner);

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
            
            await SeedDatabaseAsync(customerWithOwner, customerWithoutOwner);

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
            await SeedDatabaseAsync(customer);

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
            await SeedDatabaseAsync(customer);

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
            await SeedDatabaseAsync(customer);

            // Act
            var result = await _customerService.DeleteCustomerForAdminAsync(customer.Id);

            // Assert
            Assert.True(result);
            var deletedCustomer = await Context.Customers.FindAsync(customer.Id);
            Assert.Null(deletedCustomer);
        }

        [Fact]
        public async Task SetCustomersUserIdToNullAsync_ShouldSetUserIdToNull_ForAllCustomersOfUser()
        {
            // Arrange
            var userId = "user123";
            var otherUserId = "user456";
            
            var customers = new[]
            {
                new Customer { FirstName = "Customer1", LastName = "Test", Email = "c1@test.com", UserId = userId },
                new Customer { FirstName = "Customer2", LastName = "Test", Email = "c2@test.com", UserId = userId },
                new Customer { FirstName = "Customer3", LastName = "Test", Email = "c3@test.com", UserId = otherUserId },
                new Customer { FirstName = "Customer4", LastName = "Test", Email = "c4@test.com", UserId = null } // Already null
            };
            
            await SeedDatabaseAsync(customers);

            // Act
            await _customerService.SetCustomersUserIdToNullAsync(userId);

            // Assert
            var updatedCustomers = await Context.Customers.ToListAsync();
            
            // Kunder som tillhörde userId ska nu ha UserId = null
            var userCustomers = updatedCustomers.Where(c => c.Email.StartsWith("c1@") || c.Email.StartsWith("c2@")).ToList();
            Assert.All(userCustomers, c => Assert.Null(c.UserId));
            
            // Andra användares kunder ska vara opåverkade
            var otherUserCustomer = updatedCustomers.First(c => c.Email == "c3@test.com");
            Assert.Equal(otherUserId, otherUserCustomer.UserId);
            
            // Redan null-kunder ska förbli opåverkade
            var nullCustomer = updatedCustomers.First(c => c.Email == "c4@test.com");
            Assert.Null(nullCustomer.UserId);
        }

        [Fact]
        public async Task SetCustomersUserIdToNullAsync_ShouldUpdateTimestamp_WhenSettingUserIdToNull()
        {
            // Arrange
            var userId = "user123";
            var originalTime = DateTime.UtcNow.AddDays(-1);
            
            var customer = new Customer 
            { 
                FirstName = "Test", 
                LastName = "Customer", 
                Email = "test@example.com", 
                UserId = userId,
                UpdatedAt = originalTime
            };
            
            await SeedDatabaseAsync(customer);
            
            var beforeUpdate = DateTime.UtcNow;

            // Act
            await _customerService.SetCustomersUserIdToNullAsync(userId);

            // Assert
            var updatedCustomer = await Context.Customers.FirstAsync(c => c.Email == "test@example.com");
            Assert.Null(updatedCustomer.UserId);
            Assert.True(updatedCustomer.UpdatedAt >= beforeUpdate);
            Assert.True(updatedCustomer.UpdatedAt > originalTime);
        }

        [Fact]
        public async Task SetCustomersUserIdToNullAsync_ShouldDoNothing_WhenUserHasNoCustomers()
        {
            // Arrange
            var userId = "user-with-no-customers";
            var otherUserId = "user-with-customers";
            
            var customer = new Customer 
            { 
                FirstName = "Other", 
                LastName = "Customer", 
                Email = "other@example.com", 
                UserId = otherUserId 
            };
            
            await SeedDatabaseAsync(customer);

            // Act
            await _customerService.SetCustomersUserIdToNullAsync(userId);

            // Assert
            var unchangedCustomer = await Context.Customers.FirstAsync(c => c.Email == "other@example.com");
            Assert.Equal(otherUserId, unchangedCustomer.UserId);
        }

        [Fact]
        public async Task SetCustomersUserIdToNullAsync_ShouldHandleEmptyUserId()
        {
            // Arrange
            var customer = new Customer 
            { 
                FirstName = "Test", 
                LastName = "Customer", 
                Email = "test@example.com", 
                UserId = "user123" 
            };
            
            await SeedDatabaseAsync(customer);

            // Act
            await _customerService.SetCustomersUserIdToNullAsync("");

            // Assert - Ingen kund ska påverkas av tom userId
            var unchangedCustomer = await Context.Customers.FirstAsync(c => c.Email == "test@example.com");
            Assert.Equal("user123", unchangedCustomer.UserId);
        }

        [Fact]
        public async Task SetCustomersUserIdToNullAsync_ShouldHandleNullUserId()
        {
            // Arrange
            var customer = new Customer 
            { 
                FirstName = "Test", 
                LastName = "Customer", 
                Email = "test@example.com", 
                UserId = "user123" 
            };
            
            await SeedDatabaseAsync(customer);

            // Act
            await _customerService.SetCustomersUserIdToNullAsync(null!);

            // Assert - Ingen kund ska påverkas av null userId
            var unchangedCustomer = await Context.Customers.FirstAsync(c => c.Email == "test@example.com");
            Assert.Equal("user123", unchangedCustomer.UserId);
        }

    }
}