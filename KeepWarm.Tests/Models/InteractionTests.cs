using KeepWarm.Models;
using System.ComponentModel.DataAnnotations;

namespace KeepWarm.Tests.Models
{
    public class InteractionTests
    {
        [Fact]
        public void Interaction_ShouldHaveRequiredProperties()
        {
            // Arrange
            var interaction = new Interaction();

            // Act & Assert
            Assert.NotNull(interaction);
            Assert.Equal(0, interaction.Id);
            Assert.Equal(0, interaction.CustomerId);
            Assert.Equal(string.Empty, interaction.UserId);
            Assert.Equal(string.Empty, interaction.InteractionType);
            Assert.Equal(string.Empty, interaction.Description);
            Assert.True(interaction.InteractionDate > DateTime.MinValue);
            Assert.True(interaction.CreatedAt > DateTime.MinValue);
            Assert.True(interaction.UpdatedAt > DateTime.MinValue);
        }

        [Fact]
        public void Interaction_ShouldSetPropertiesCorrectly()
        {
            // Arrange
            var interaction = new Interaction
            {
                Id = 1,
                CustomerId = 1,
                UserId = "user123",
                InteractionType = "Telefonsamtal",
                Description = "Diskuterade projektets framsteg",
                InteractionDate = new DateTime(2024, 1, 15, 14, 30, 0),
                CreatedAt = new DateTime(2024, 1, 15, 14, 30, 0),
                UpdatedAt = new DateTime(2024, 1, 15, 14, 30, 0)
            };

            // Act & Assert
            Assert.Equal(1, interaction.Id);
            Assert.Equal(1, interaction.CustomerId);
            Assert.Equal("user123", interaction.UserId);
            Assert.Equal("Telefonsamtal", interaction.InteractionType);
            Assert.Equal("Diskuterade projektets framsteg", interaction.Description);
            Assert.Equal(new DateTime(2024, 1, 15, 14, 30, 0), interaction.InteractionDate);
        }

        [Fact]
        public void Interaction_ShouldHaveValidationAttributes()
        {
            // Arrange
            var interaction = new Interaction();
            var properties = typeof(Interaction).GetProperties();

            // Act & Assert
            var customerIdProperty = properties.First(p => p.Name == "CustomerId");
            var userIdProperty = properties.First(p => p.Name == "UserId");
            var interactionTypeProperty = properties.First(p => p.Name == "InteractionType");
            var descriptionProperty = properties.First(p => p.Name == "Description");

            Assert.True(customerIdProperty.GetCustomAttributes(typeof(RequiredAttribute), false).Any());
            Assert.True(userIdProperty.GetCustomAttributes(typeof(RequiredAttribute), false).Any());
            Assert.True(interactionTypeProperty.GetCustomAttributes(typeof(RequiredAttribute), false).Any());
            Assert.True(descriptionProperty.GetCustomAttributes(typeof(RequiredAttribute), false).Any());
        }

        [Fact]
        public void Interaction_ShouldHaveStringLengthValidation()
        {
            // Arrange
            var interaction = new Interaction();
            var properties = typeof(Interaction).GetProperties();

            // Act & Assert
            var interactionTypeProperty = properties.First(p => p.Name == "InteractionType");
            var descriptionProperty = properties.First(p => p.Name == "Description");

            var interactionTypeLengthAttribute = interactionTypeProperty.GetCustomAttributes(typeof(StringLengthAttribute), false).FirstOrDefault() as StringLengthAttribute;
            var descriptionLengthAttribute = descriptionProperty.GetCustomAttributes(typeof(StringLengthAttribute), false).FirstOrDefault() as StringLengthAttribute;

            Assert.NotNull(interactionTypeLengthAttribute);
            Assert.NotNull(descriptionLengthAttribute);
            Assert.Equal(50, interactionTypeLengthAttribute.MaximumLength);
            Assert.Equal(500, descriptionLengthAttribute.MaximumLength);
        }

        [Theory]
        [InlineData("Telefonsamtal")]
        [InlineData("Fysiskt möte")]
        [InlineData("Videomöte")]
        [InlineData("LinkedIn")]
        [InlineData("SMS")]
        [InlineData("Mail")]
        public void Interaction_ShouldAcceptValidInteractionTypes(string interactionType)
        {
            // Arrange
            var interaction = new Interaction
            {
                InteractionType = interactionType,
                Description = "Test beskrivning",
                CustomerId = 1,
                UserId = "user123"
            };

            // Act
            var validationContext = new ValidationContext(interaction);
            var validationResults = new List<ValidationResult>();
            var isValid = Validator.TryValidateObject(interaction, validationContext, validationResults, true);

            // Assert
            Assert.True(isValid);
            Assert.Empty(validationResults);
        }

        [Fact]
        public void Interaction_ShouldHaveNavigationProperties()
        {
            // Arrange
            var interaction = new Interaction();
            var properties = typeof(Interaction).GetProperties();

            // Act & Assert
            var customerProperty = properties.FirstOrDefault(p => p.Name == "Customer");
            var userProperty = properties.FirstOrDefault(p => p.Name == "User");

            Assert.NotNull(customerProperty);
            Assert.NotNull(userProperty);
            Assert.Equal(typeof(Customer), customerProperty.PropertyType);
            Assert.Equal(typeof(ApplicationUser), userProperty.PropertyType);
        }
    }
}
