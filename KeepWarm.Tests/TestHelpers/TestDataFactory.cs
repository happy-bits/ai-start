using KeepWarm.Controllers.ViewModels;
using KeepWarm.Models;

namespace KeepWarm.Tests.TestHelpers
{
    /// <summary>
    /// Factory-klass för att skapa testdata på ett konsistent sätt
    /// </summary>
    public static class TestDataFactory
    {
        #region ApplicationUser Factory Methods

        /// <summary>
        /// Skapar en test-användare med standardvärden
        /// </summary>
        public static ApplicationUser CreateUser(
            string? email = null,
            string firstName = "Test",
            string lastName = "User",
            string? id = null)
        {
            email ??= $"{firstName.ToLower()}.{lastName.ToLower()}@example.com";
            id ??= Guid.NewGuid().ToString();

            return new ApplicationUser
            {
                Id = id,
                UserName = email,
                Email = email,
                FirstName = firstName,
                LastName = lastName,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
        }

        /// <summary>
        /// Skapar en admin-användare
        /// </summary>
        public static ApplicationUser CreateAdminUser(
            string email = "admin@example.com",
            string firstName = "Admin",
            string lastName = "User")
        {
            return CreateUser(email, firstName, lastName);
        }

        #endregion

        #region Customer Factory Methods

        /// <summary>
        /// Skapar en test-kund med standardvärden
        /// </summary>
        public static Customer CreateCustomer(
            string firstName = "Test",
            string lastName = "Customer", 
            string? email = null,
            string? userId = "user1",
            int? id = null)
        {
            email ??= $"{firstName.ToLower()}.{lastName.ToLower()}@example.com";

            var customer = new Customer
            {
                FirstName = firstName,
                LastName = lastName,
                Email = email,
                UserId = userId,
                Phone = "070-1234567",
                Address = "Test Street 1",
                City = "Test City",
                PostalCode = "12345",
                Country = "Sverige",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            if (id.HasValue)
            {
                customer.Id = id.Value;
            }

            return customer;
        }

        /// <summary>
        /// Skapar en kund utan ägare (UserId = null)
        /// </summary>
        public static Customer CreateOrphanCustomer(
            string firstName = "Orphan",
            string lastName = "Customer")
        {
            return CreateCustomer(firstName, lastName, userId: null);
        }

        /// <summary>
        /// Skapar en lista med test-kunder
        /// </summary>
        public static List<Customer> CreateCustomers(int count, string userId = "user1")
        {
            return Enumerable.Range(1, count)
                .Select(i => CreateCustomer($"Customer{i}", "Test", userId: userId))
                .ToList();
        }

        #endregion

        #region Interaction Factory Methods

        /// <summary>
        /// Skapar en test-interaktion
        /// </summary>
        public static Interaction CreateInteraction(
            int customerId = 1,
            string userId = "user1",
            string interactionType = "Telefonsamtal",
            string description = "Test beskrivning",
            DateTime? interactionDate = null)
        {
            return new Interaction
            {
                CustomerId = customerId,
                UserId = userId,
                InteractionType = interactionType,
                Description = description,
                InteractionDate = interactionDate ?? DateTime.Now
            };
        }

        #endregion

        #region ViewModel Factory Methods

        /// <summary>
        /// Skapar en CustomerCreateViewModel för tester
        /// </summary>
        public static CustomerCreateViewModel CreateCustomerCreateViewModel(
            string firstName = "New",
            string lastName = "Customer",
            string email = "new.customer@example.com")
        {
            return new CustomerCreateViewModel
            {
                FirstName = firstName,
                LastName = lastName,
                Email = email,
                Phone = "070-1234567",
                Address = "Test Street 1",
                City = "Test City",
                PostalCode = "12345",
                Country = "Sverige"
            };
        }

        /// <summary>
        /// Skapar en CustomerEditViewModel för tester
        /// </summary>
        public static CustomerEditViewModel CreateCustomerEditViewModel(
            int id = 1,
            string firstName = "Updated",
            string lastName = "Customer",
            string email = "updated.customer@example.com")
        {
            return new CustomerEditViewModel
            {
                Id = id,
                FirstName = firstName,
                LastName = lastName,
                Email = email,
                Phone = "070-7654321",
                Address = "Updated Street 1",
                City = "Updated City",
                PostalCode = "54321",
                Country = "Sverige"
            };
        }

        /// <summary>
        /// Skapar en RegisterViewModel för tester
        /// </summary>
        public static RegisterViewModel CreateRegisterViewModel(
            string firstName = "Test",
            string lastName = "User",
            string email = "test.user@example.com",
            string password = "TestPassword123!")
        {
            return new RegisterViewModel
            {
                FirstName = firstName,
                LastName = lastName,
                Email = email,
                Password = password,
                ConfirmPassword = password
            };
        }

        /// <summary>
        /// Skapar en LoginViewModel för tester
        /// </summary>
        public static LoginViewModel CreateLoginViewModel(
            string email = "test@example.com",
            string password = "TestPassword123!",
            bool rememberMe = false)
        {
            return new LoginViewModel
            {
                Email = email,
                Password = password,
                RememberMe = rememberMe
            };
        }

        /// <summary>
        /// Skapar en CreateUserViewModel för admin-tester
        /// </summary>
        public static CreateUserViewModel CreateCreateUserViewModel(
            string firstName = "Created",
            string lastName = "User",
            string email = "created@example.com",
            string password = "CreatedPassword123!")
        {
            return new CreateUserViewModel
            {
                FirstName = firstName,
                LastName = lastName,
                Email = email,
                Password = password
            };
        }

        /// <summary>
        /// Skapar en EditUserViewModel för admin-tester
        /// </summary>
        public static EditUserViewModel CreateEditUserViewModel(
            string id = "user123",
            string firstName = "Edited",
            string lastName = "User",
            string email = "edited@example.com",
            string role = "User")
        {
            return new EditUserViewModel
            {
                Id = id,
                FirstName = firstName,
                LastName = lastName,
                Email = email,
                Role = role
            };
        }

        /// <summary>
        /// Skapar en InteractionCreateViewModel för tester
        /// </summary>
        public static InteractionCreateViewModel CreateInteractionCreateViewModel(
            int customerId = 1,
            string interactionType = "Telefonsamtal",
            string description = "Test interaktion",
            DateTime? interactionDate = null)
        {
            return new InteractionCreateViewModel
            {
                CustomerId = customerId,
                InteractionType = interactionType,
                Description = description,
                InteractionDate = interactionDate ?? DateTime.Now
            };
        }

        /// <summary>
        /// Skapar en InteractionEditViewModel för tester
        /// </summary>
        public static InteractionEditViewModel CreateInteractionEditViewModel(
            int id = 1,
            int customerId = 1,
            string interactionType = "Mail",
            string description = "Uppdaterad interaktion",
            DateTime? interactionDate = null)
        {
            return new InteractionEditViewModel
            {
                Id = id,
                CustomerId = customerId,
                InteractionType = interactionType,
                Description = description,
                InteractionDate = interactionDate ?? DateTime.Now
            };
        }

        #endregion

        #region Identity Test Data

        /// <summary>
        /// Skapar IdentityResult.Success för tester
        /// </summary>
        public static Microsoft.AspNetCore.Identity.IdentityResult CreateSuccessResult()
        {
            return Microsoft.AspNetCore.Identity.IdentityResult.Success;
        }

        /// <summary>
        /// Skapar IdentityResult.Failed med specificerade fel för tester
        /// </summary>
        public static Microsoft.AspNetCore.Identity.IdentityResult CreateFailedResult(params string[] errorCodes)
        {
            var errors = errorCodes.Select(code => new Microsoft.AspNetCore.Identity.IdentityError 
            { 
                Code = code, 
                Description = $"Error: {code}" 
            });
            
            return Microsoft.AspNetCore.Identity.IdentityResult.Failed(errors.ToArray());
        }

        /// <summary>
        /// Skapar SignInResult.Success för tester
        /// </summary>
        public static Microsoft.AspNetCore.Identity.SignInResult CreateSignInSuccess()
        {
            return Microsoft.AspNetCore.Identity.SignInResult.Success;
        }

        /// <summary>
        /// Skapar SignInResult.Failed för tester
        /// </summary>
        public static Microsoft.AspNetCore.Identity.SignInResult CreateSignInFailed()
        {
            return Microsoft.AspNetCore.Identity.SignInResult.Failed;
        }

        #endregion
    }
}
