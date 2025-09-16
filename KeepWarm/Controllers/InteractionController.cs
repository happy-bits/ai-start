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
                InteractionDate = DateTimeHelper.FormatToMinutePrecision(DateTime.Now)
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
                    InteractionDate = DateTimeHelper.FormatToMinutePrecision(model.InteractionDate)
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

            var interaction = await _interactionService.GetInteractionByIdAsync(id);
            if (interaction == null)
            {
                return NotFound();
            }

            // Kontrollera att användaren äger interaktionen eller är admin
            if (interaction.UserId != userId && !User.IsInRole("Admin"))
            {
                return Forbid();
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

                var existingInteraction = await _interactionService.GetInteractionByIdAsync(model.Id);
                if (existingInteraction == null)
                {
                    return NotFound();
                }

                // Kontrollera att användaren äger interaktionen eller är admin
                if (existingInteraction.UserId != userId && !User.IsInRole("Admin"))
                {
                    return Forbid();
                }

                existingInteraction.InteractionType = model.InteractionType;
                existingInteraction.Description = model.Description;
                existingInteraction.InteractionDate = DateTimeHelper.FormatToMinutePrecision(model.InteractionDate);

                var result = await _interactionService.UpdateInteractionAsync(existingInteraction);
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

            var interaction = await _interactionService.GetInteractionByIdAsync(id);
            if (interaction == null)
            {
                return NotFound();
            }

            // Kontrollera att användaren äger interaktionen eller är admin
            if (interaction.UserId != userId && !User.IsInRole("Admin"))
            {
                return Forbid();
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

            var interaction = await _interactionService.GetInteractionByIdAsync(id);
            if (interaction == null)
            {
                return NotFound();
            }

            // Kontrollera att användaren äger interaktionen eller är admin
            if (interaction.UserId != userId && !User.IsInRole("Admin"))
            {
                return Forbid();
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

            var interaction = await _interactionService.GetInteractionByIdAsync(id);
            if (interaction == null)
            {
                return NotFound();
            }

            // Kontrollera att användaren äger interaktionen eller är admin
            if (interaction.UserId != userId && !User.IsInRole("Admin"))
            {
                return Forbid();
            }

            var result = await _interactionService.DeleteInteractionAsync(id);
            if (result)
            {
                TempData["SuccessMessage"] = "Interaktionen har tagits bort framgångsrikt.";
                return RedirectToAction("Details", "Customer", new { id = interaction.CustomerId });
            }
            else
            {
                TempData["ErrorMessage"] = "Ett fel uppstod vid borttagningen av interaktionen.";
                return RedirectToAction("Details", "Customer", new { id = interaction.CustomerId });
            }
        }
    }
}
