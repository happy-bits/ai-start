using KeepWarm.Models;
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
        
        protected ControllerTestBase()
        {
            MockUserManager = CreateMockUserManager();
            MockSignInManager = CreateMockSignInManager();
            MockLogger = new Mock<ILogger<T>>();
            MockConfiguration = new Mock<IConfiguration>();
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
    }
}
