using System.Net.Http.Headers;
using System.Security.Claims;
using System.Text.Encodings.Web;
using Microsoft.AspNetCore.Authentication;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace KeepWarm.Tests.Helpers;

public static class AuthenticationHelper
{
    public const string TestAuthenticationScheme = "TestScheme";

    public static HttpClient CreateAuthenticatedClient(
        this TestWebApplicationFactory factory,
        string userId,
        string email,
        string[]? roles = null)
    {
        var client = factory.CreateClient();

        // Skapa claims för användaren
        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, userId),
            new Claim(ClaimTypes.Name, email),
            new Claim(ClaimTypes.Email, email)
        };

        if (roles != null)
        {
            foreach (var role in roles)
            {
                claims.Add(new Claim(ClaimTypes.Role, role));
            }
        }

        // I en riktig integration-test skulle vi använda cookies eller JWT tokens
        // För enkelhetens skull använder vi en custom header här
        client.DefaultRequestHeaders.Add("X-Test-UserId", userId);
        if (roles != null && roles.Length > 0)
        {
            client.DefaultRequestHeaders.Add("X-Test-Roles", string.Join(",", roles));
        }

        return client;
    }
}

/// <summary>
/// Test authentication handler för att simulera inloggade användare i tester
/// </summary>
public class TestAuthenticationHandler : AuthenticationHandler<AuthenticationSchemeOptions>
{
    public TestAuthenticationHandler(
        IOptionsMonitor<AuthenticationSchemeOptions> options,
        ILoggerFactory logger,
        UrlEncoder encoder)
        : base(options, logger, encoder)
    {
    }

    protected override Task<AuthenticateResult> HandleAuthenticateAsync()
    {
        // Hämta test-claims från headers
        if (!Request.Headers.TryGetValue("X-Test-UserId", out var userIdValues))
        {
            return Task.FromResult(AuthenticateResult.NoResult());
        }

        var userId = userIdValues.ToString();
        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, userId),
            new Claim(ClaimTypes.Name, userId)
        };

        // Lägg till roller om de finns
        if (Request.Headers.TryGetValue("X-Test-Roles", out var rolesValues))
        {
            var roles = rolesValues.ToString().Split(',');
            foreach (var role in roles)
            {
                claims.Add(new Claim(ClaimTypes.Role, role));
            }
        }

        var identity = new ClaimsIdentity(claims, AuthenticationHelper.TestAuthenticationScheme);
        var principal = new ClaimsPrincipal(identity);
        var ticket = new AuthenticationTicket(principal, AuthenticationHelper.TestAuthenticationScheme);

        return Task.FromResult(AuthenticateResult.Success(ticket));
    }
}
