using CustomerManagement.Models;
using System.ComponentModel.DataAnnotations;

namespace CustomerManagement.Tests.Models
{
    public class CustomerTests
    {
        [Fact]
        public void Customer_ShouldHaveRequiredProperties()
        {
            // Arrange & Act
            var customer = new Customer();

            // Assert
            Assert.NotNull(customer.FirstName);
            Assert.NotNull(customer.LastName);
            Assert.NotNull(customer.Email);
            Assert.NotNull(customer.UserId);
            Assert.True(customer.CreatedAt > DateTime.MinValue);
            Assert.True(customer.UpdatedAt > DateTime.MinValue);
        }

        [Fact]
        public void Customer_ShouldSetPropertiesCorrectly()
        {
            // Arrange
            var customer = new Customer
            {
                FirstName = "Anna",
                LastName = "Andersson",
                Email = "anna.andersson@example.com",
                Phone = "070-1234567",
                Address = "Storgatan 1",
                City = "Stockholm",
                PostalCode = "12345",
                Country = "Sverige",
                UserId = "user123"
            };

            // Act & Assert
            Assert.Equal("Anna", customer.FirstName);
            Assert.Equal("Andersson", customer.LastName);
            Assert.Equal("anna.andersson@example.com", customer.Email);
            Assert.Equal("070-1234567", customer.Phone);
            Assert.Equal("Storgatan 1", customer.Address);
            Assert.Equal("Stockholm", customer.City);
            Assert.Equal("12345", customer.PostalCode);
            Assert.Equal("Sverige", customer.Country);
            Assert.Equal("user123", customer.UserId);
        }

        [Fact]
        public void Customer_ShouldHaveCorrectDataAnnotations()
        {
            // Arrange
            var customer = new Customer();
            var properties = typeof(Customer).GetProperties();

            // Act & Assert
            var firstNameProperty = properties.First(p => p.Name == "FirstName");
            var firstNameRequired = firstNameProperty.GetCustomAttributes(typeof(RequiredAttribute), false).FirstOrDefault();
            var firstNameStringLength = firstNameProperty.GetCustomAttributes(typeof(StringLengthAttribute), false).FirstOrDefault() as StringLengthAttribute;

            Assert.NotNull(firstNameRequired);
            Assert.NotNull(firstNameStringLength);
            Assert.Equal(100, firstNameStringLength.MaximumLength);

            var lastNameProperty = properties.First(p => p.Name == "LastName");
            var lastNameRequired = lastNameProperty.GetCustomAttributes(typeof(RequiredAttribute), false).FirstOrDefault();
            var lastNameStringLength = lastNameProperty.GetCustomAttributes(typeof(StringLengthAttribute), false).FirstOrDefault() as StringLengthAttribute;

            Assert.NotNull(lastNameRequired);
            Assert.NotNull(lastNameStringLength);
            Assert.Equal(100, lastNameStringLength.MaximumLength);

            var emailProperty = properties.First(p => p.Name == "Email");
            var emailRequired = emailProperty.GetCustomAttributes(typeof(RequiredAttribute), false).FirstOrDefault();
            var emailAddress = emailProperty.GetCustomAttributes(typeof(EmailAddressAttribute), false).FirstOrDefault();
            var emailStringLength = emailProperty.GetCustomAttributes(typeof(StringLengthAttribute), false).FirstOrDefault() as StringLengthAttribute;

            Assert.NotNull(emailRequired);
            Assert.NotNull(emailAddress);
            Assert.NotNull(emailStringLength);
            Assert.Equal(255, emailStringLength.MaximumLength);
        }

        [Fact]
        public void Customer_ShouldSetTimestampsOnCreation()
        {
            // Arrange
            var beforeCreation = DateTime.UtcNow;

            // Act
            var customer = new Customer();

            // Assert
            Assert.True(customer.CreatedAt >= beforeCreation);
            Assert.True(customer.UpdatedAt >= beforeCreation);
            Assert.True(customer.CreatedAt <= DateTime.UtcNow);
            Assert.True(customer.UpdatedAt <= DateTime.UtcNow);
        }

        [Theory]
        [InlineData("", "Andersson", "anna@example.com", "user123")]
        [InlineData("Anna", "", "anna@example.com", "user123")]
        [InlineData("Anna", "Andersson", "", "user123")]
        [InlineData("Anna", "Andersson", "anna@example.com", "")]
        public void Customer_ShouldRequireEssentialFields(string firstName, string lastName, string email, string userId)
        {
            // Arrange
            var customer = new Customer
            {
                FirstName = firstName,
                LastName = lastName,
                Email = email,
                UserId = userId
            };

            // Act
            var validationResults = new List<ValidationResult>();
            var validationContext = new ValidationContext(customer);
            var isValid = Validator.TryValidateObject(customer, validationContext, validationResults, true);

            // Assert
            Assert.False(isValid);
            Assert.NotEmpty(validationResults);
        }

        [Fact]
        public void Customer_ShouldAcceptValidData()
        {
            // Arrange
            var customer = new Customer
            {
                FirstName = "Anna",
                LastName = "Andersson",
                Email = "anna.andersson@example.com",
                Phone = "070-1234567",
                Address = "Storgatan 1",
                City = "Stockholm",
                PostalCode = "12345",
                Country = "Sverige",
                UserId = "user123"
            };

            // Act
            var validationResults = new List<ValidationResult>();
            var validationContext = new ValidationContext(customer);
            var isValid = Validator.TryValidateObject(customer, validationContext, validationResults, true);

            // Assert
            Assert.True(isValid);
            Assert.Empty(validationResults);
        }

        [Theory]
        [InlineData("a@b.c", true)]
        [InlineData("test@example.com", true)]
        [InlineData("user.name@domain.co.uk", true)]
        [InlineData("invalid-email", false)]
        [InlineData("@example.com", false)]
        [InlineData("test@", false)]
        public void Customer_ShouldValidateEmailFormat(string email, bool shouldBeValid)
        {
            // Arrange
            var customer = new Customer
            {
                FirstName = "Anna",
                LastName = "Andersson",
                Email = email,
                UserId = "user123"
            };

            // Act
            var validationResults = new List<ValidationResult>();
            var validationContext = new ValidationContext(customer);
            var isValid = Validator.TryValidateObject(customer, validationContext, validationResults, true);

            // Assert
            if (shouldBeValid)
            {
                Assert.True(isValid);
            }
            else
            {
                Assert.False(isValid);
                Assert.Contains(validationResults, vr => vr.MemberNames.Contains("Email"));
            }
        }
    }
}
