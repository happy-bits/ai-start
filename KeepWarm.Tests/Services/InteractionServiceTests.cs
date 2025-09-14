using KeepWarm.Data;
using KeepWarm.Models;
using KeepWarm.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace KeepWarm.Tests.Services
{
    public class InteractionServiceTests : IDisposable
    {
        private readonly ApplicationDbContext _context;
        private readonly InteractionService _service;

        public InteractionServiceTests()
        {
            var options = new DbContextOptionsBuilder<ApplicationDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;

            _context = new ApplicationDbContext(options);
            _service = new InteractionService(_context);
        }

        [Fact]
        public async Task CreateInteractionAsync_ShouldCreateInteractionSuccessfully()
        {
            // Arrange
            var customer = new Customer
            {
                Id = 1,
                FirstName = "Test",
                LastName = "Customer",
                Email = "test@example.com",
                UserId = "user123"
            };
            _context.Customers.Add(customer);
            await _context.SaveChangesAsync();

            var interaction = new Interaction
            {
                CustomerId = 1,
                UserId = "user123",
                InteractionType = "Telefonsamtal",
                Description = "Diskuterade projektets framsteg",
                InteractionDate = new DateTime(2024, 1, 15, 14, 30, 0)
            };

            // Act
            var result = await _service.CreateInteractionAsync(interaction);

            // Assert
            Assert.True(result);
            var createdInteraction = await _context.Interactions.FirstOrDefaultAsync();
            Assert.NotNull(createdInteraction);
            Assert.Equal("Telefonsamtal", createdInteraction.InteractionType);
            Assert.Equal("Diskuterade projektets framsteg", createdInteraction.Description);
        }

        [Fact]
        public async Task GetInteractionsByCustomerIdAsync_ShouldReturnCorrectInteractions()
        {
            // Arrange
            var customer = new Customer
            {
                Id = 1,
                FirstName = "Test",
                LastName = "Customer",
                Email = "test@example.com",
                UserId = "user123"
            };
            _context.Customers.Add(customer);

            var interaction1 = new Interaction
            {
                CustomerId = 1,
                UserId = "user123",
                InteractionType = "Telefonsamtal",
                Description = "Första kontakt",
                InteractionDate = new DateTime(2024, 1, 15, 14, 30, 0)
            };

            var interaction2 = new Interaction
            {
                CustomerId = 1,
                UserId = "user123",
                InteractionType = "Mail",
                Description = "Uppföljning",
                InteractionDate = new DateTime(2024, 1, 16, 10, 0, 0)
            };

            _context.Interactions.AddRange(interaction1, interaction2);
            await _context.SaveChangesAsync();

            // Act
            var result = await _service.GetInteractionsByCustomerIdAsync(1);

            // Assert
            Assert.Equal(2, result.Count());
            Assert.Contains(result, i => i.InteractionType == "Telefonsamtal");
            Assert.Contains(result, i => i.InteractionType == "Mail");
        }

        [Fact]
        public async Task GetInteractionsByUserIdAsync_ShouldReturnOnlyUserInteractions()
        {
            // Arrange
            var customer1 = new Customer { Id = 1, FirstName = "Test1", LastName = "Customer1", Email = "test1@example.com", UserId = "user123" };
            var customer2 = new Customer { Id = 2, FirstName = "Test2", LastName = "Customer2", Email = "test2@example.com", UserId = "user456" };
            _context.Customers.AddRange(customer1, customer2);

            var interaction1 = new Interaction { CustomerId = 1, UserId = "user123", InteractionType = "Telefonsamtal", Description = "User1 interaction" };
            var interaction2 = new Interaction { CustomerId = 2, UserId = "user456", InteractionType = "Mail", Description = "User2 interaction" };

            _context.Interactions.AddRange(interaction1, interaction2);
            await _context.SaveChangesAsync();

            // Act
            var result = await _service.GetInteractionsByUserIdAsync("user123");

            // Assert
            Assert.Single(result);
            Assert.Equal("user123", result.First().UserId);
        }

        [Fact]
        public async Task UpdateInteractionAsync_ShouldUpdateInteractionSuccessfully()
        {
            // Arrange
            var customer = new Customer { Id = 1, FirstName = "Test", LastName = "Customer", Email = "test@example.com", UserId = "user123" };
            _context.Customers.Add(customer);

            var interaction = new Interaction
            {
                CustomerId = 1,
                UserId = "user123",
                InteractionType = "Telefonsamtal",
                Description = "Original beskrivning",
                InteractionDate = new DateTime(2024, 1, 15, 14, 30, 0)
            };
            _context.Interactions.Add(interaction);
            await _context.SaveChangesAsync();

            // Act
            interaction.Description = "Uppdaterad beskrivning";
            var result = await _service.UpdateInteractionAsync(interaction);

            // Assert
            Assert.True(result);
            var updatedInteraction = await _context.Interactions.FindAsync(interaction.Id);
            Assert.Equal("Uppdaterad beskrivning", updatedInteraction!.Description);
        }

        [Fact]
        public async Task DeleteInteractionAsync_ShouldDeleteInteractionSuccessfully()
        {
            // Arrange
            var customer = new Customer { Id = 1, FirstName = "Test", LastName = "Customer", Email = "test@example.com", UserId = "user123" };
            _context.Customers.Add(customer);

            var interaction = new Interaction
            {
                CustomerId = 1,
                UserId = "user123",
                InteractionType = "Telefonsamtal",
                Description = "Test beskrivning"
            };
            _context.Interactions.Add(interaction);
            await _context.SaveChangesAsync();

            // Act
            var result = await _service.DeleteInteractionAsync(interaction.Id);

            // Assert
            Assert.True(result);
            var deletedInteraction = await _context.Interactions.FindAsync(interaction.Id);
            Assert.Null(deletedInteraction);
        }

        [Fact]
        public async Task GetInteractionByIdAsync_ShouldReturnCorrectInteraction()
        {
            // Arrange
            var user = new ApplicationUser
            {
                Id = "user123",
                UserName = "test@example.com",
                Email = "test@example.com",
                FirstName = "Test",
                LastName = "User"
            };
            _context.Users.Add(user);

            var customer = new Customer { Id = 1, FirstName = "Test", LastName = "Customer", Email = "test@example.com", UserId = "user123" };
            _context.Customers.Add(customer);
            await _context.SaveChangesAsync();

            var interaction = new Interaction
            {
                CustomerId = 1,
                UserId = "user123",
                InteractionType = "Telefonsamtal",
                Description = "Test beskrivning"
            };
            _context.Interactions.Add(interaction);
            await _context.SaveChangesAsync();

            // Act
            var result = await _service.GetInteractionByIdAsync(interaction.Id);

            // Assert
            Assert.NotNull(result);
            Assert.Equal(interaction.Id, result.Id);
            Assert.Equal("Telefonsamtal", result.InteractionType);
        }

        public void Dispose()
        {
            _context.Dispose();
        }
    }
}
