using KeepWarm.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;

namespace KeepWarm.Controllers
{
    /// <summary>
    /// Bascontroller för autentiserade controllers med gemensamma hjälpmetoder
    /// </summary>
    [Authorize]
    public abstract class BaseAuthenticatedController : Controller
    {
        protected readonly UserManager<ApplicationUser> UserManager;

        protected BaseAuthenticatedController(UserManager<ApplicationUser> userManager)
        {
            UserManager = userManager;
        }

        /// <summary>
        /// Hämtar den autentiserade användarens ID
        /// </summary>
        /// <returns>Användar-ID eller null om användaren inte är autentiserad</returns>
        protected string? GetAuthenticatedUserId()
        {
            return UserManager.GetUserId(User);
        }

        /// <summary>
        /// Kontrollerar om den aktuella användaren är admin
        /// </summary>
        protected bool IsCurrentUserAdmin()
        {
            return User.IsInRole(Roles.Admin);
        }

        /// <summary>
        /// Exekverar en action baserat på användarens roll
        /// </summary>
        protected async Task<T> ExecuteWithRoleCheck<T>(
            Func<Task<T>> adminAction,
            Func<Task<T>> userAction)
        {
            return IsCurrentUserAdmin() ? await adminAction() : await userAction();
        }

        /// <summary>
        /// Exekverar en action baserat på användarens roll (icke-async version)
        /// </summary>
        protected T ExecuteWithRoleCheck<T>(
            Func<T> adminAction,
            Func<T> userAction)
        {
            return IsCurrentUserAdmin() ? adminAction() : userAction();
        }
    }
}

