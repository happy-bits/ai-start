using KeepWarm.Models;
using Microsoft.AspNetCore.Identity;
using System.ComponentModel.DataAnnotations;

namespace KeepWarm.Tests.Models
{
    public class ApplicationUserTests
    {
        [Fact]
        public void ApplicationUser_ShouldInheritFromIdentityUser()
        {
            // Arrange & Act
            var user = new ApplicationUser();

            // Assert
            Assert.IsAssignableFrom<IdentityUser>(user);
        }

        [Fact]
        public void ApplicationUser_ShouldHaveAdditionalProperties()
        {
            // Arrange
            var user = new ApplicationUser
            {
                FirstName = "Anna",
                LastName = "Andersson",
                Email = "anna.andersson@example.com",
                UserName = "anna.andersson@example.com"
            };

            // Act & Assert
            Assert.Equal("Anna", user.FirstName);
            Assert.Equal("Andersson", user.LastName);
            Assert.Equal("anna.andersson@example.com", user.Email);
            Assert.Equal("anna.andersson@example.com", user.UserName);
        }

        [Fact]
        public void ApplicationUser_ShouldSetTimestampsOnCreation()
        {
            // Arrange
            var beforeCreation = DateTime.UtcNow;

            // Act
            var user = new ApplicationUser();

            // Assert
            Assert.True(user.CreatedAt >= beforeCreation);
            Assert.True(user.UpdatedAt >= beforeCreation);
            Assert.True(user.CreatedAt <= DateTime.UtcNow);
            Assert.True(user.UpdatedAt <= DateTime.UtcNow);
        }

        [Fact]
        public void ApplicationUser_ShouldHaveNullableStringProperties()
        {
            // Arrange
            var user = new ApplicationUser();

            // Act & Assert
            Assert.Null(user.FirstName);
            Assert.Null(user.LastName);
        }

        [Fact]
        public void ApplicationUser_ShouldAllowSettingOptionalProperties()
        {
            // Arrange
            var user = new ApplicationUser
            {
                FirstName = "Anna",
                LastName = "Andersson"
            };

            // Act & Assert
            Assert.Equal("Anna", user.FirstName);
            Assert.Equal("Andersson", user.LastName);
        }

        [Fact]
        public void ApplicationUser_ShouldInheritIdentityUserProperties()
        {
            // Arrange
            var user = new ApplicationUser
            {
                Id = "user123",
                Email = "test@example.com",
                UserName = "test@example.com",
                PhoneNumber = "070-1234567"
            };

            // Act & Assert
            Assert.Equal("user123", user.Id);
            Assert.Equal("test@example.com", user.Email);
            Assert.Equal("test@example.com", user.UserName);
            Assert.Equal("070-1234567", user.PhoneNumber);
        }

        [Fact]
        public void ApplicationUser_ShouldHaveCorrectDefaultValues()
        {
            // Arrange & Act
            var user = new ApplicationUser();

            // Assert
            Assert.True(user.CreatedAt > DateTime.MinValue);
            Assert.True(user.UpdatedAt > DateTime.MinValue);
            Assert.True(user.CreatedAt <= DateTime.UtcNow);
            Assert.True(user.UpdatedAt <= DateTime.UtcNow);
        }

        [Theory]
        [InlineData("Anna", "Andersson")]
        [InlineData("Erik", "Eriksson")]
        [InlineData("Maria", "Gustavsson")]
        public void ApplicationUser_ShouldAcceptValidNames(string firstName, string lastName)
        {
            // Arrange
            var user = new ApplicationUser
            {
                FirstName = firstName,
                LastName = lastName,
                Email = "test@example.com",
                UserName = "test@example.com"
            };

            // Act
            var validationResults = new List<ValidationResult>();
            var validationContext = new ValidationContext(user);
            var isValid = Validator.TryValidateObject(user, validationContext, validationResults, true);

            // Assert
            Assert.True(isValid);
            Assert.Empty(validationResults);
        }

        [Fact]
        public void ApplicationUser_ShouldAllowEmptyOptionalProperties()
        {
            // Arrange
            var user = new ApplicationUser
            {
                Email = "test@example.com",
                UserName = "test@example.com"
            };

            // Act & Assert
            Assert.Null(user.FirstName);
            Assert.Null(user.LastName);
            Assert.NotNull(user.Email);
            Assert.NotNull(user.UserName);
        }
    }
}
