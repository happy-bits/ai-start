using System.Net;
using KeepWarm.Tests.TestHelpers;
using Shouldly;

namespace KeepWarm.Tests.E2E;

/// <summary>
/// End-to-End tester för kritiska HTTP-flöden
/// Testar hela stacken via HTTP-anrop
/// OBS: För databasrelaterade tester, se integrationstesterna istället
/// </summary>
public class CriticalFlowsE2ETests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly CustomWebApplicationFactory _factory;
    private readonly HttpClient _client;

    public CriticalFlowsE2ETests(CustomWebApplicationFactory factory)
    {
        _factory = factory;
        _client = _factory.CreateClient();
    }

    [Fact]
    public async Task Hemmasida_LaddasKorrekt()
    {
        // When - Besöker hemsidan
        var response = await _client.GetAsync("/");

        // Then - Ska returnera OK
        response.StatusCode.ShouldBe(HttpStatusCode.OK);
        
        var content = await response.Content.ReadAsStringAsync();
        content.ShouldNotBeEmpty();
        content.ShouldContain("KeepWarm", Case.Insensitive);
    }

    [Fact]
    public async Task PrivacyPage_LaddasKorrekt()
    {
        // When - Besöker privacy-sidan
        var response = await _client.GetAsync("/Home/Privacy");

        // Then - Ska returnera OK
        response.StatusCode.ShouldBe(HttpStatusCode.OK);
        
        var content = await response.Content.ReadAsStringAsync();
        content.ShouldNotBeEmpty();
    }

    [Fact]
    public async Task SkyddadSida_RedirectarTillLogin()
    {
        // Given - Klient utan autentisering
        var client = _factory.CreateClient(new Microsoft.AspNetCore.Mvc.Testing.WebApplicationFactoryClientOptions
        {
            AllowAutoRedirect = false // Följ inte redirects automatiskt
        });

        // When - Försöker komma åt skyddad sida
        var response = await client.GetAsync("/Customer/Index");

        // Then - Ska få redirect (till login)
        response.StatusCode.ShouldBe(HttpStatusCode.Redirect);
        response.Headers.Location?.ToString().ShouldContain("Account/Login", Case.Insensitive);
    }

    [Fact]
    public async Task StatiskFil_ServerasKorrekt()
    {
        // When - Hämtar CSS-fil
        var response = await _client.GetAsync("/css/site.css");

        // Then - Ska returnera OK eller NotModified
        response.StatusCode.ShouldBeOneOf(HttpStatusCode.OK, HttpStatusCode.NotModified);
    }

    [Fact]
    public async Task IckeExisterandeSida_Returnerar404()
    {
        // When - Försöker komma åt icke-existerande sida
        var response = await _client.GetAsync("/NonExistent/Page");

        // Then - Ska returnera NotFound
        response.StatusCode.ShouldBe(HttpStatusCode.NotFound);
    }
}

