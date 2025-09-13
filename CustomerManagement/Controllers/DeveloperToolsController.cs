using CustomerManagement.Models;
using CustomerManagement.Services;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace CustomerManagement.Controllers
{
    public class DeveloperToolsController : Controller
    {
        private readonly IDatabaseSeedService _seedService;
        private readonly SignInManager<ApplicationUser> _signInManager;
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly IConfiguration _configuration;
        private readonly ILogger<DeveloperToolsController> _logger;

        public DeveloperToolsController(
            IDatabaseSeedService seedService,
            SignInManager<ApplicationUser> signInManager,
            UserManager<ApplicationUser> userManager,
            IConfiguration configuration,
            ILogger<DeveloperToolsController> logger)
        {
            _seedService = seedService;
            _signInManager = signInManager;
            _userManager = userManager;
            _configuration = configuration;
            _logger = logger;
        }

        [HttpPost]
        public async Task<IActionResult> RecreateDatabase()
        {
            try
            {
                var recreateResult = await _seedService.RecreateDatabaseAsync();
                if (!recreateResult)
                {
                    return Json(new { success = false, message = "Fel vid återskapning av databas" });
                }

                var seedResult = await _seedService.SeedTestDataAsync();
                if (!seedResult)
                {
                    return Json(new { success = false, message = "Fel vid tillägg av testdata" });
                }

                return Json(new { success = true, message = "Databas återskapad och testdata tillagd!" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Fel vid återskapning av databas");
                return Json(new { success = false, message = "Ett oväntat fel inträffade" });
            }
        }

        [HttpPost]
        public async Task<IActionResult> LoginAs([FromBody] string email)
        {
            try
            {
                _logger.LogInformation("🤡 LoginAs anropad med email: {Email}", email);
                
                var user = await _userManager.FindByEmailAsync(email);
                _logger.LogInformation("🤡 User hittad: {UserFound}, UserId: {UserId}", user != null, user?.Id);
                
                if (user == null)
                {
                    _logger.LogWarning("🤡 Användare hittades inte: {Email}", email);
                    return Json(new { success = false, message = "Användare hittades inte" });
                }

                _logger.LogInformation("🤡 Försöker logga in användare: {UserId}", user.Id);
                await _signInManager.SignInAsync(user, false);
                _logger.LogInformation("🤡 Inloggning lyckades för: {Email}", email);
                
                return Json(new { success = true, message = $"Inloggad som {email}" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "🤡 Fel vid inloggning som {Email}: {ErrorMessage}", email, ex.Message);
                return Json(new { success = false, message = "Fel vid inloggning" });
            }
        }
    }
}
