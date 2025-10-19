using System.Diagnostics;
using Microsoft.AspNetCore.Mvc;
using KeepWarm.Models;
using Microsoft.Extensions.Configuration;

namespace KeepWarm.Controllers;

public class HomeController : Controller
{
    private readonly IConfiguration _configuration;

    public HomeController(IConfiguration configuration)
    {
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
