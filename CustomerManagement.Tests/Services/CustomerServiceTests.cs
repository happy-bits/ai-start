using CustomerManagement.Data;
using CustomerManagement.Models;
using CustomerManagement.Services;
using Microsoft.EntityFrameworkCore;

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

            // Skapa testdata
            SeedTestData();
        }

        private void SeedTestData()
        {
            var user1 = new ApplicationUser
            {
                Id = "user1",
                UserName = "user1@example.com",
                Email = "user1@example.com",
                FirstName = "User",
                LastName = "One"
            };

            var user2 = new ApplicationUser
            {
                Id = "user2",
                UserName = "user2@example.com",
                Email = "user2@example.com",
                FirstName = "User",
                LastName = "Two"
            };

            _context.Users.AddRange(user1, user2);

            var customers = new List<Customer>
            {
                new Customer
                {
                    Id = 1,
                    FirstName = "Anna",
                    LastName = "Andersson",
                    Email = "anna@example.com",
                    Phone = "070-1234567",
                    Address = "Storgatan 1",
                    City = "Stockholm",
                    PostalCode = "12345",
                    Country = "Sverige",
                    UserId = "user1",
                    CreatedAt = DateTime.UtcNow.AddDays(-10),
                    UpdatedAt = DateTime.UtcNow.AddDays(-10)
                },
                new Customer
                {
                    Id = 2,
                    FirstName = "Erik",
                    LastName = "Eriksson",
                    Email = "erik@example.com",
                    Phone = "070-7654321",
                    Address = "Lillgatan 2",
                    City = "Göteborg",
                    PostalCode = "54321",
                    Country = "Sverige",
                    UserId = "user1",
                    CreatedAt = DateTime.UtcNow.AddDays(-5),
                    UpdatedAt = DateTime.UtcNow.AddDays(-5)
                },
                new Customer
                {
                    Id = 3,
                    FirstName = "Maria",
                    LastName = "Gustavsson",
                    Email = "maria@example.com",
                    Phone = "070-9876543",
                    Address = "Mellangatan 3",
                    City = "Malmö",
                    PostalCode = "98765",
                    Country = "Sverige",
                    UserId = "user2",
                    CreatedAt = DateTime.UtcNow.AddDays(-3),
                    UpdatedAt = DateTime.UtcNow.AddDays(-3)
                }
            };

            _context.Customers.AddRange(customers);
            _context.SaveChanges();
        }

        [Fact]
        public async Task GetAllCustomersAsync_ShouldReturnOnlyCustomersForSpecificUser()
        {
            // Act
            var result = await _customerService.GetAllCustomersAsync("user1");

            // Assert
            Assert.Equal(2, result.Count());
            Assert.All(result, c => Assert.Equal("user1", c.UserId));
            Assert.Contains(result, c => c.FirstName == "Anna");
            Assert.Contains(result, c => c.FirstName == "Erik");
        }

        [Fact]
        public async Task GetAllCustomersAsync_ShouldReturnEmptyListForUserWithNoCustomers()
        {
            // Act
            var result = await _customerService.GetAllCustomersAsync("nonexistent");

            // Assert
            Assert.Empty(result);
        }

        [Fact]
        public async Task GetAllCustomersForAdminAsync_ShouldReturnAllCustomers()
        {
            // Act
            var result = await _customerService.GetAllCustomersForAdminAsync();

            // Assert
            Assert.Equal(3, result.Count());
            Assert.Contains(result, c => c.FirstName == "Anna");
            Assert.Contains(result, c => c.FirstName == "Erik");
            Assert.Contains(result, c => c.FirstName == "Maria");
        }

        [Fact]
        public async Task GetAllCustomersForAdminAsync_ShouldIncludeUserData()
        {
            // Act
            var result = await _customerService.GetAllCustomersForAdminAsync();

            // Assert
            Assert.Equal(3, result.Count());
            
            // Kontrollera att User-data är inkluderad
            var customer1 = result.First(c => c.FirstName == "Anna");
            Assert.NotNull(customer1.User);
            Assert.Equal("User", customer1.User.FirstName);
            Assert.Equal("One", customer1.User.LastName);
            Assert.Equal("user1@example.com", customer1.User.Email);
            
            var customer2 = result.First(c => c.FirstName == "Erik");
            Assert.NotNull(customer2.User);
            Assert.Equal("User", customer2.User.FirstName);
            Assert.Equal("One", customer2.User.LastName);
            
            var customer3 = result.First(c => c.FirstName == "Maria");
            Assert.NotNull(customer3.User);
            Assert.Equal("User", customer3.User.FirstName);
            Assert.Equal("Two", customer3.User.LastName);
        }

        [Fact]
        public async Task GetCustomerByIdAsync_ShouldReturnCustomerForCorrectUser()
        {
            // Act
            var result = await _customerService.GetCustomerByIdAsync(1, "user1");

            // Assert
            Assert.NotNull(result);
            Assert.Equal("Anna", result.FirstName);
            Assert.Equal("Andersson", result.LastName);
            Assert.Equal("user1", result.UserId);
        }

        [Fact]
        public async Task GetCustomerByIdAsync_ShouldReturnNullForWrongUser()
        {
            // Act
            var result = await _customerService.GetCustomerByIdAsync(1, "user2");

            // Assert
            Assert.Null(result);
        }

        [Fact]
        public async Task GetCustomerByIdForAdminAsync_ShouldReturnAnyCustomer()
        {
            // Act
            var result = await _customerService.GetCustomerByIdForAdminAsync(3);

            // Assert
            Assert.NotNull(result);
            Assert.Equal("Maria", result.FirstName);
            Assert.Equal("Gustavsson", result.LastName);
        }

        [Fact]
        public async Task GetCustomerByIdForAdminAsync_ShouldIncludeUserData()
        {
            // Act
            var result = await _customerService.GetCustomerByIdForAdminAsync(1);

            // Assert
            Assert.NotNull(result);
            Assert.Equal("Anna", result.FirstName);
            Assert.NotNull(result.User);
            Assert.Equal("User", result.User.FirstName);
            Assert.Equal("One", result.User.LastName);
            Assert.Equal("user1@example.com", result.User.Email);
        }

        [Fact]
        public async Task CreateCustomerAsync_ShouldCreateNewCustomer()
        {
            // Arrange
            var newCustomer = new Customer
            {
                FirstName = "Test",
                LastName = "Customer",
                Email = "test@example.com",
                Phone = "070-1111111",
                Address = "Testgatan 1",
                City = "Teststad",
                PostalCode = "11111",
                Country = "Sverige",
                UserId = "user1"
            };

            // Act
            var result = await _customerService.CreateCustomerAsync(newCustomer);

            // Assert
            Assert.NotNull(result);
            Assert.True(result.Id > 0);
            Assert.Equal("Test", result.FirstName);
            Assert.True(result.CreatedAt > DateTime.MinValue);
            Assert.True(result.UpdatedAt > DateTime.MinValue);

            // Verify it was saved to database
            var savedCustomer = await _context.Customers.FindAsync(result.Id);
            Assert.NotNull(savedCustomer);
            Assert.Equal("Test", savedCustomer.FirstName);
        }

        [Fact]
        public async Task UpdateCustomerAsync_ShouldUpdateCustomerForCorrectUser()
        {
            // Arrange
            var customer = new Customer
            {
                Id = 1,
                FirstName = "Anna Updated",
                LastName = "Andersson Updated",
                Email = "anna.updated@example.com",
                Phone = "070-9999999",
                Address = "Updated Street 1",
                City = "Updated City",
                PostalCode = "99999",
                Country = "Updated Country",
                UserId = "user1"
            };

            // Act
            var result = await _customerService.UpdateCustomerAsync(customer, "user1");

            // Assert
            Assert.NotNull(result);
            Assert.Equal("Anna Updated", result.FirstName);
            Assert.Equal("Andersson Updated", result.LastName);
            Assert.Equal("anna.updated@example.com", result.Email);
            Assert.True(result.UpdatedAt > DateTime.UtcNow.AddMinutes(-1));
        }

        [Fact]
        public async Task UpdateCustomerAsync_ShouldReturnNullForWrongUser()
        {
            // Arrange
            var customer = new Customer
            {
                Id = 1,
                FirstName = "Anna Updated",
                LastName = "Andersson Updated",
                Email = "anna.updated@example.com",
                UserId = "user1"
            };

            // Act
            var result = await _customerService.UpdateCustomerAsync(customer, "user2");

            // Assert
            Assert.Null(result);
        }

        [Fact]
        public async Task UpdateCustomerForAdminAsync_ShouldUpdateAnyCustomer()
        {
            // Arrange
            var customer = new Customer
            {
                Id = 3,
                FirstName = "Maria Updated",
                LastName = "Gustavsson Updated",
                Email = "maria.updated@example.com",
                UserId = "user2"
            };

            // Act
            var result = await _customerService.UpdateCustomerForAdminAsync(customer);

            // Assert
            Assert.NotNull(result);
            Assert.Equal("Maria Updated", result.FirstName);
            Assert.Equal("Gustavsson Updated", result.LastName);
            Assert.Equal("maria.updated@example.com", result.Email);
        }

        [Fact]
        public async Task DeleteCustomerAsync_ShouldDeleteCustomerForCorrectUser()
        {
            // Act
            var result = await _customerService.DeleteCustomerAsync(1, "user1");

            // Assert
            Assert.True(result);

            // Verify it was deleted from database
            var deletedCustomer = await _context.Customers.FindAsync(1);
            Assert.Null(deletedCustomer);
        }

        [Fact]
        public async Task DeleteCustomerAsync_ShouldReturnFalseForWrongUser()
        {
            // Act
            var result = await _customerService.DeleteCustomerAsync(1, "user2");

            // Assert
            Assert.False(result);

            // Verify customer still exists
            var customer = await _context.Customers.FindAsync(1);
            Assert.NotNull(customer);
        }

        [Fact]
        public async Task DeleteCustomerForAdminAsync_ShouldDeleteAnyCustomer()
        {
            // Act
            var result = await _customerService.DeleteCustomerForAdminAsync(3);

            // Assert
            Assert.True(result);

            // Verify it was deleted from database
            var deletedCustomer = await _context.Customers.FindAsync(3);
            Assert.Null(deletedCustomer);
        }

        [Fact]
        public async Task CustomerExistsAsync_ShouldReturnTrueForExistingCustomer()
        {
            // Act
            var result = await _customerService.CustomerExistsAsync(1);

            // Assert
            Assert.True(result);
        }

        [Fact]
        public async Task CustomerExistsAsync_ShouldReturnFalseForNonExistingCustomer()
        {
            // Act
            var result = await _customerService.CustomerExistsAsync(999);

            // Assert
            Assert.False(result);
        }

        [Fact]
        public async Task CustomerBelongsToUserAsync_ShouldReturnTrueForCorrectUser()
        {
            // Act
            var result = await _customerService.CustomerBelongsToUserAsync(1, "user1");

            // Assert
            Assert.True(result);
        }

        [Fact]
        public async Task CustomerBelongsToUserAsync_ShouldReturnFalseForWrongUser()
        {
            // Act
            var result = await _customerService.CustomerBelongsToUserAsync(1, "user2");

            // Assert
            Assert.False(result);
        }

        [Fact]
        public async Task CustomerBelongsToUserAsync_ShouldReturnFalseForNonExistingCustomer()
        {
            // Act
            var result = await _customerService.CustomerBelongsToUserAsync(999, "user1");

            // Assert
            Assert.False(result);
        }

        public void Dispose()
        {
            _context?.Dispose();
        }
    }
}
