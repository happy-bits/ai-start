using KeepWarm.Models;
using KeepWarm.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Moq;
using System.Security.Claims;

namespace KeepWarm.Tests.TestHelpers
{
    /// <summary>
    /// Basklass för controller-tester som tillhandahåller gemensamma mock-objekt och hjälpmetoder
    /// </summary>
    public abstract class ControllerTestBase<T> where T : Controller
    {
        protected readonly Mock<UserManager<ApplicationUser>> MockUserManager;
        protected readonly Mock<SignInManager<ApplicationUser>> MockSignInManager;
        protected readonly Mock<ILogger<T>> MockLogger;
        protected readonly Mock<IConfiguration> MockConfiguration;
        
        // Vanliga service-mocks
        protected readonly Mock<ICustomerService> MockCustomerService;
        protected readonly Mock<IInteractionService> MockInteractionService;
        protected readonly Mock<IIdentityService> MockIdentityService;
        protected readonly Mock<IDatabaseSeedService> MockDatabaseSeedService;
        
        protected ControllerTestBase()
        {
            MockUserManager = CreateMockUserManager();
            MockSignInManager = CreateMockSignInManager();
            MockLogger = new Mock<ILogger<T>>();
            MockConfiguration = new Mock<IConfiguration>();
            
            // Initiera service-mocks
            MockCustomerService = new Mock<ICustomerService>();
            MockInteractionService = new Mock<IInteractionService>();
            MockIdentityService = new Mock<IIdentityService>();
            MockDatabaseSeedService = new Mock<IDatabaseSeedService>();
        }

        /// <summary>
        /// Skapar en mock UserManager
        /// </summary>
        protected Mock<UserManager<ApplicationUser>> CreateMockUserManager()
        {
            var store = new Mock<IUserStore<ApplicationUser>>();
            return new Mock<UserManager<ApplicationUser>>(
                store.Object, null!, null!, null!, null!, null!, null!, null!, null!);
        }

        /// <summary>
        /// Skapar en mock SignInManager
        /// </summary>
        protected Mock<SignInManager<ApplicationUser>> CreateMockSignInManager()
        {
            var contextAccessor = new Mock<IHttpContextAccessor>();
            var claimsFactory = new Mock<IUserClaimsPrincipalFactory<ApplicationUser>>();
            var optionsAccessor = new Mock<Microsoft.Extensions.Options.IOptions<IdentityOptions>>();
            var logger = new Mock<ILogger<SignInManager<ApplicationUser>>>();
            var schemes = new Mock<Microsoft.AspNetCore.Authentication.IAuthenticationSchemeProvider>();

            return new Mock<SignInManager<ApplicationUser>>(
                MockUserManager.Object, contextAccessor.Object, claimsFactory.Object, 
                optionsAccessor.Object, logger.Object, schemes.Object, null!);
        }

        /// <summary>
        /// Ställer in en autentiserad användare för controller
        /// </summary>
        protected void SetupAuthenticatedUser(T controller, string userId, bool isAdmin = false, string email = "test@example.com")
        {
            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, userId),
                new Claim(ClaimTypes.Name, email)
            };

            if (isAdmin)
            {
                claims.Add(new Claim(ClaimTypes.Role, "Admin"));
            }

            var identity = new ClaimsIdentity(claims, "TestAuthType");
            var claimsPrincipal = new ClaimsPrincipal(identity);

            controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext
                {
                    User = claimsPrincipal
                }
            };

            MockUserManager.Setup(m => m.GetUserId(It.IsAny<ClaimsPrincipal>()))
                .Returns(userId);
        }

        /// <summary>
        /// Skapar en grundläggande HTTP-context för controller
        /// </summary>
        protected void SetupControllerContext(T controller)
        {
            var httpContext = new DefaultHttpContext();
            var urlHelper = new Mock<IUrlHelper>();
            urlHelper.Setup(u => u.IsLocalUrl(It.IsAny<string>())).Returns(false);

            controller.ControllerContext = new ControllerContext
            {
                HttpContext = httpContext
            };
            controller.Url = urlHelper.Object;
        }

        /// <summary>
        /// Ställer in konfigurationsvärde för tester
        /// </summary>
        protected void SetupConfiguration(string key, string value)
        {
            var configSection = new Mock<IConfigurationSection>();
            configSection.Setup(x => x.Value).Returns(value);
            MockConfiguration.Setup(c => c.GetSection(It.Is<string>(s => s == key)))
                .Returns(configSection.Object);
        }

        /// <summary>
        /// Verifierar att en redirect-action är korrekt
        /// </summary>
        protected void AssertRedirectToAction(IActionResult result, string expectedAction, string? expectedController = null)
        {
            var redirectResult = Assert.IsType<RedirectToActionResult>(result);
            Assert.Equal(expectedAction, redirectResult.ActionName);
            
            if (expectedController != null)
            {
                Assert.Equal(expectedController, redirectResult.ControllerName);
            }
        }

        /// <summary>
        /// Verifierar att en view returneras med rätt modell-typ
        /// </summary>
        protected TModel AssertViewWithModel<TModel>(IActionResult result)
        {
            var viewResult = Assert.IsType<ViewResult>(result);
            return Assert.IsType<TModel>(viewResult.Model);
        }

        /// <summary>
        /// Verifierar att en view returneras med en samling av rätt typ
        /// </summary>
        protected IEnumerable<TModel> AssertViewWithCollection<TModel>(IActionResult result)
        {
            var viewResult = Assert.IsType<ViewResult>(result);
            return Assert.IsAssignableFrom<IEnumerable<TModel>>(viewResult.Model);
        }

        #region Service Mock Helper Methods

        /// <summary>
        /// Konfigurerar CustomerService för att returnera specifika kunder för en användare
        /// </summary>
        protected void SetupCustomerService_ReturnsCustomers(string userId, params Customer[] customers)
        {
            MockCustomerService.Setup(s => s.GetAllCustomersAsync(userId))
                .ReturnsAsync(customers.ToList());
        }

        /// <summary>
        /// Konfigurerar CustomerService för att returnera alla kunder (admin-vy)
        /// </summary>
        protected void SetupCustomerService_ReturnsAllCustomers(params Customer[] customers)
        {
            MockCustomerService.Setup(s => s.GetAllCustomersForAdminAsync())
                .ReturnsAsync(customers.ToList());
        }

        /// <summary>
        /// Konfigurerar CustomerService för att returnera en specifik kund
        /// </summary>
        protected void SetupCustomerService_ReturnsCustomer(int customerId, string userId, Customer? customer)
        {
            MockCustomerService.Setup(s => s.GetCustomerByIdAsync(customerId, userId))
                .ReturnsAsync(customer);
        }

        /// <summary>
        /// Konfigurerar CustomerService för att framgångsrikt skapa en kund
        /// </summary>
        protected void SetupCustomerService_CreateSuccess(Customer customerToReturn)
        {
            MockCustomerService.Setup(s => s.CreateCustomerAsync(It.IsAny<Customer>()))
                .ReturnsAsync(customerToReturn);
        }

        /// <summary>
        /// Konfigurerar InteractionService för att returnera interaktioner för en kund
        /// </summary>
        protected void SetupInteractionService_ReturnsInteractions(int customerId, params Interaction[] interactions)
        {
            MockInteractionService.Setup(s => s.GetInteractionsByCustomerIdAsync(customerId))
                .ReturnsAsync(interactions.ToList());
        }

        /// <summary>
        /// Konfigurerar InteractionService för framgångsrik skapande av interaktion
        /// </summary>
        protected void SetupInteractionService_CreateSuccess()
        {
            MockInteractionService.Setup(s => s.CreateInteractionAsync(It.IsAny<Interaction>()))
                .ReturnsAsync(true);
        }

        /// <summary>
        /// Konfigurerar IdentityService för framgångsrik användarskapande
        /// </summary>
        protected void SetupIdentityService_UserCreationSuccess()
        {
            MockIdentityService.Setup(s => s.CreateUserAsync(It.IsAny<ApplicationUser>(), It.IsAny<string>()))
                .ReturnsAsync(true);
        }

        /// <summary>
        /// Konfigurerar IdentityService för misslyckad användarskapande
        /// </summary>
        protected void SetupIdentityService_UserCreationFailure()
        {
            MockIdentityService.Setup(s => s.CreateUserAsync(It.IsAny<ApplicationUser>(), It.IsAny<string>()))
                .ReturnsAsync(false);
        }

        /// <summary>
        /// Konfigurerar IdentityService för att returnera alla användare
        /// </summary>
        protected void SetupIdentityService_ReturnsAllUsers(params ApplicationUser[] users)
        {
            MockIdentityService.Setup(s => s.GetAllUsersAsync())
                .ReturnsAsync(users.ToList());
        }

        /// <summary>
        /// Konfigurerar IdentityService för att hitta användare via email
        /// </summary>
        protected void SetupIdentityService_FindUserByEmail(string email, ApplicationUser? user)
        {
            MockIdentityService.Setup(s => s.FindUserByEmailAsync(email))
                .ReturnsAsync(user);
        }

        /// <summary>
        /// Konfigurerar DatabaseSeedService för framgångsrik databasåterskapning
        /// </summary>
        protected void SetupDatabaseSeedService_RecreateSuccess()
        {
            MockDatabaseSeedService.Setup(s => s.RecreateDatabaseAsync())
                .ReturnsAsync(true);
            MockDatabaseSeedService.Setup(s => s.SeedTestDataAsync())
                .ReturnsAsync(true);
        }

        /// <summary>
        /// Konfigurerar DatabaseSeedService för misslyckad databasåterskapning
        /// </summary>
        protected void SetupDatabaseSeedService_RecreateFailure()
        {
            MockDatabaseSeedService.Setup(s => s.RecreateDatabaseAsync())
                .ReturnsAsync(false);
        }

        #endregion
    }
}
