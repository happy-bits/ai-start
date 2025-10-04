using KeepWarm.Controllers.ViewModels;
using KeepWarm.Helpers;
using KeepWarm.Models;
using KeepWarm.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;

namespace KeepWarm.Controllers
{
    [Authorize]
    public class InteractionController : Controller
    {
        private readonly IInteractionService _interactionService;
        private readonly UserManager<ApplicationUser> _userManager;

        public InteractionController(IInteractionService interactionService, UserManager<ApplicationUser> userManager)
        {
            _interactionService = interactionService;
            _userManager = userManager;
        }

        [HttpGet]
        public IActionResult Create(int customerId)
        {
            var model = new InteractionCreateViewModel
            {
                CustomerId = customerId,
                InteractionDate = DateTimeHelper.FormatToMinutePrecision(DateTime.Now),
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
                var userId = _userManager.GetUserId(User);
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
            var userId = _userManager.GetUserId(User);
            if (userId == null)
            {
                return Unauthorized();
            }

            // Använd säker metod (admin kan använda osäker metod vid behov)
            Interaction? interaction;
            if (User.IsInRole("Admin"))
            {
                interaction = await _interactionService.GetInteractionByIdAsync(id);
            }
            else
            {
                interaction = await _interactionService.GetInteractionByIdAsync(id, userId);
            }

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
                var userId = _userManager.GetUserId(User);
                if (userId == null)
                {
                    return Unauthorized();
                }

                // Hämta befintlig interaktion för att säkerställa access
                Interaction? existingInteraction;
                if (User.IsInRole("Admin"))
                {
                    existingInteraction = await _interactionService.GetInteractionByIdAsync(model.Id);
                }
                else
                {
                    existingInteraction = await _interactionService.GetInteractionByIdAsync(model.Id, userId);
                }

                if (existingInteraction == null)
                {
                    return NotFound();
                }

                existingInteraction.InteractionType = model.InteractionType;
                existingInteraction.Description = model.Description;
                existingInteraction.InteractionDate = DateTimeHelper.FormatToMinutePrecision(model.InteractionDate);

                // Använd säker uppdateringsmetod
                bool result;
                if (User.IsInRole("Admin"))
                {
                    // Admin kan uppdatera vem som helsts interaktioner - använd userId från interaktionen
                    result = await _interactionService.UpdateInteractionAsync(existingInteraction, existingInteraction.UserId);
                }
                else
                {
                    result = await _interactionService.UpdateInteractionAsync(existingInteraction, userId);
                }

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
            var userId = _userManager.GetUserId(User);
            if (userId == null)
            {
                return Unauthorized();
            }

            Interaction? interaction;
            if (User.IsInRole("Admin"))
            {
                interaction = await _interactionService.GetInteractionByIdAsync(id);
            }
            else
            {
                interaction = await _interactionService.GetInteractionByIdAsync(id, userId);
            }

            if (interaction == null)
            {
                return NotFound();
            }

            return View(interaction);
        }

        [HttpGet]
        public async Task<IActionResult> Delete(int id)
        {
            var userId = _userManager.GetUserId(User);
            if (userId == null)
            {
                return Unauthorized();
            }

            Interaction? interaction;
            if (User.IsInRole("Admin"))
            {
                interaction = await _interactionService.GetInteractionByIdAsync(id);
            }
            else
            {
                interaction = await _interactionService.GetInteractionByIdAsync(id, userId);
            }

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
            var userId = _userManager.GetUserId(User);
            if (userId == null)
            {
                return Unauthorized();
            }

            // Hämta interaktionen för att få CustomerId innan borttagning
            Interaction? interaction;
            if (User.IsInRole("Admin"))
            {
                interaction = await _interactionService.GetInteractionByIdAsync(id);
            }
            else
            {
                interaction = await _interactionService.GetInteractionByIdAsync(id, userId);
            }

            if (interaction == null)
            {
                return NotFound();
            }

            var customerId = interaction.CustomerId;

            // Använd säker borttagningsmetod
            bool result;
            if (User.IsInRole("Admin"))
            {
                // Admin kan ta bort vem som helsts interaktioner - använd userId från interaktionen
                result = await _interactionService.DeleteInteractionAsync(id, interaction.UserId);
            }
            else
            {
                result = await _interactionService.DeleteInteractionAsync(id, userId);
            }

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
