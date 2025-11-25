using KeepWarm.Models;
using KeepWarm.Services;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace KeepWarm.Controllers
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
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> RecreateDatabase()
        {
            try
            {
                var recreateResult = await _seedService.RecreateDatabaseAsync();
                if (!recreateResult)
                {
                    TempData["DbMessage"] = "Fel vid återskapning av databas";
                    TempData["DbMessageType"] = "error";
                    return RedirectToAction("Index", "Home");
                }

                var seedResult = await _seedService.SeedTestDataAsync();
                if (!seedResult)
                {
                    TempData["DbMessage"] = "Fel vid tillägg av testdata";
                    TempData["DbMessageType"] = "error";
                    return RedirectToAction("Index", "Home");
                }

                TempData["DbMessage"] = "Databas återskapad och testdata tillagd!";
                TempData["DbMessageType"] = "success";
                return RedirectToAction("Index", "Home");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Fel vid återskapning av databas");
                TempData["DbMessage"] = "Ett oväntat fel inträffade";
                TempData["DbMessageType"] = "error";
                return RedirectToAction("Index", "Home");
            }
        }

        [HttpPost]
        public async Task<IActionResult> LoginAs([FromBody] string email)
        {
            try
            {
                var user = await _userManager.FindByEmailAsync(email);
                if (user == null)
                {
                    return Json(new { success = false, message = "Användare hittades inte" });
                }

                await _signInManager.SignInAsync(user, false);
                return Json(new { success = true, message = $"Inloggad som {email}" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Fel vid inloggning som {Email}", email);
                return Json(new { success = false, message = "Fel vid inloggning" });
            }
        }
    }
}
