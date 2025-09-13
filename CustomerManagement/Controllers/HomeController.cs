using System.Diagnostics;
using Microsoft.AspNetCore.Mvc;
using CustomerManagement.Models;
using Microsoft.Extensions.Configuration;

namespace CustomerManagement.Controllers;

public class HomeController : Controller
{
    private readonly ILogger<HomeController> _logger;
    private readonly IConfiguration _configuration;

    public HomeController(ILogger<HomeController> logger, IConfiguration configuration)
    {
        _logger = logger;
        _configuration = configuration;
    }

    public IActionResult Index()
    {
        // Kontrollera om utvecklarverktyg ska visas
        var showDeveloperTools = _configuration.GetValue<bool>("DeveloperTools:Enabled");
        ViewBag.ShowDeveloperTools = showDeveloperTools;
        
        return View();
    }

    public IActionResult Privacy()
    {
        return View();
    }

    [ResponseCache(Duration = 0, Location = ResponseCacheLocation.None, NoStore = true)]
    public IActionResult Error()
    {
        return View(new ErrorViewModel { RequestId = Activity.Current?.Id ?? HttpContext.TraceIdentifier });
    }
}
