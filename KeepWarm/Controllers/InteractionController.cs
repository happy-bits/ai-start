using KeepWarm.Controllers.ViewModels;
using KeepWarm.Helpers;
using KeepWarm.Models;
using KeepWarm.Services;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;

namespace KeepWarm.Controllers
{
    public class InteractionController : BaseAuthenticatedController
    {
        private readonly IInteractionService _interactionService;

        public InteractionController(
            IInteractionService interactionService, 
            UserManager<ApplicationUser> userManager) 
            : base(userManager)
        {
            _interactionService = interactionService;
        }

        [HttpGet]
        public IActionResult Create(int customerId)
        {
            var model = new InteractionCreateViewModel
            {
                CustomerId = customerId,
                InteractionDate = DateTimeHelper.FormatToMinutePrecision(DateTime.UtcNow),
                FollowUpDate = DateOnly.FromDateTime(DateTime.Today.AddDays(3))
            };

            return View(model);
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Create(InteractionCreateViewModel model)
        {
            if (ModelState.IsValid)
            {
                var userId = GetAuthenticatedUserId();
                if (userId == null)
                {
                    return Unauthorized();
                }

                var interaction = new Interaction
                {
                    CustomerId = model.CustomerId,
                    UserId = userId,
                    InteractionType = model.InteractionType,
                    Description = model.Description,
                    InteractionDate = DateTimeHelper.FormatToMinutePrecision(model.InteractionDate),
                    FollowUpDate = model.FollowUpDate
                };

                var result = await _interactionService.CreateInteractionAsync(interaction);
                if (result)
                {
                    TempData["SuccessMessage"] = "Interaktionen har skapats framgångsrikt.";
                    return RedirectToAction("Details", "Customer", new { id = model.CustomerId });
                }
                else
                {
                    ModelState.AddModelError(string.Empty, "Ett fel uppstod vid skapandet av interaktionen.");
                }
            }

            return View(model);
        }

        [HttpGet]
        public async Task<IActionResult> Edit(int id)
        {
            var userId = GetAuthenticatedUserId();
            if (userId == null)
            {
                return Unauthorized();
            }

            var interaction = await ExecuteWithRoleCheck(
                adminAction: async () => await _interactionService.GetInteractionByIdForAdminAsync(id),
                userAction: async () => await _interactionService.GetInteractionByIdAsync(id, userId)
            );

            if (interaction == null)
            {
                return NotFound();
            }

            var model = new InteractionEditViewModel
            {
                Id = interaction.Id,
                CustomerId = interaction.CustomerId,
                InteractionType = interaction.InteractionType,
                Description = interaction.Description,
                InteractionDate = DateTimeHelper.FormatToMinutePrecision(interaction.InteractionDate)
            };

            return View(model);
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Edit(InteractionEditViewModel model)
        {
            if (ModelState.IsValid)
            {
                var userId = GetAuthenticatedUserId();
                if (userId == null)
                {
                    return Unauthorized();
                }

                // Hämta befintlig interaktion för att säkerställa access
                var existingInteraction = await ExecuteWithRoleCheck(
                    adminAction: async () => await _interactionService.GetInteractionByIdForAdminAsync(model.Id),
                    userAction: async () => await _interactionService.GetInteractionByIdAsync(model.Id, userId)
                );

                if (existingInteraction == null)
                {
                    return NotFound();
                }

                existingInteraction.InteractionType = model.InteractionType;
                existingInteraction.Description = model.Description;
                existingInteraction.InteractionDate = DateTimeHelper.FormatToMinutePrecision(model.InteractionDate);

                // Använd säker uppdateringsmetod
                var result = await _interactionService.UpdateInteractionAsync(
                    existingInteraction, 
                    IsCurrentUserAdmin() ? existingInteraction.UserId : userId
                );

                if (result)
                {
                    TempData["SuccessMessage"] = "Interaktionen har uppdaterats framgångsrikt.";
                    return RedirectToAction("Details", "Customer", new { id = model.CustomerId });
                }
                else
                {
                    ModelState.AddModelError(string.Empty, "Ett fel uppstod vid uppdateringen av interaktionen.");
                }
            }

            return View(model);
        }

        [HttpGet]
        public async Task<IActionResult> Details(int id)
        {
            var userId = GetAuthenticatedUserId();
            if (userId == null)
            {
                return Unauthorized();
            }

            var interaction = await ExecuteWithRoleCheck(
                adminAction: async () => await _interactionService.GetInteractionByIdForAdminAsync(id),
                userAction: async () => await _interactionService.GetInteractionByIdAsync(id, userId)
            );

            if (interaction == null)
            {
                return NotFound();
            }

            return View(interaction);
        }

        [HttpGet]
        public async Task<IActionResult> Delete(int id)
        {
            var userId = GetAuthenticatedUserId();
            if (userId == null)
            {
                return Unauthorized();
            }

            var interaction = await ExecuteWithRoleCheck(
                adminAction: async () => await _interactionService.GetInteractionByIdForAdminAsync(id),
                userAction: async () => await _interactionService.GetInteractionByIdAsync(id, userId)
            );

            if (interaction == null)
            {
                return NotFound();
            }

            return View(interaction);
        }

        [HttpPost, ActionName("Delete")]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> DeleteConfirmed(int id)
        {
            var userId = GetAuthenticatedUserId();
            if (userId == null)
            {
                return Unauthorized();
            }

            // Hämta interaktionen för att få CustomerId innan borttagning
            var interaction = await ExecuteWithRoleCheck(
                adminAction: async () => await _interactionService.GetInteractionByIdForAdminAsync(id),
                userAction: async () => await _interactionService.GetInteractionByIdAsync(id, userId)
            );

            if (interaction == null)
            {
                return NotFound();
            }

            var customerId = interaction.CustomerId;

            // Använd säker borttagningsmetod
            var result = await _interactionService.DeleteInteractionAsync(
                id, 
                IsCurrentUserAdmin() ? interaction.UserId : userId
            );

            if (result)
            {
                TempData["SuccessMessage"] = "Interaktionen har tagits bort framgångsrikt.";
                return RedirectToAction("Details", "Customer", new { id = customerId });
            }
            else
            {
                TempData["ErrorMessage"] = "Ett fel uppstod vid borttagningen av interaktionen.";
                return RedirectToAction("Details", "Customer", new { id = customerId });
            }
        }
    }
}
