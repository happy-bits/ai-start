using KeepWarm.Controllers.ViewModels;
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
        private readonly ICustomerService _customerService;
        private readonly UserManager<ApplicationUser> _userManager;

        public InteractionController(
            IInteractionService interactionService,
            ICustomerService customerService,
            UserManager<ApplicationUser> userManager)
        {
            _interactionService = interactionService;
            _customerService = customerService;
            _userManager = userManager;
        }

        [HttpGet]
        public IActionResult Create(int? customerId)
        {
            // Redirect GET requests to customer details page
            if (customerId.HasValue)
            {
                return RedirectToAction("Details", "Customer", new { id = customerId.Value });
            }
            // If no customerId, redirect to customer list
            return RedirectToAction("Index", "Customer");
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

                // Verify customer exists and user has access (unless admin)
                var isAdmin = User.IsInRole("Admin");
                Customer? customer;
                if (isAdmin)
                {
                    customer = await _customerService.GetCustomerByIdForAdminAsync(model.CustomerId);
                }
                else
                {
                    customer = await _customerService.GetCustomerByIdAsync(model.CustomerId, userId);
                }

                if (customer == null)
                {
                    return NotFound();
                }

                var interaction = new Interaction
                {
                    CustomerId = model.CustomerId,
                    UserId = userId,
                    InteractionType = model.InteractionType,
                    InteractionDate = model.InteractionDate,
                    Notes = model.Notes
                };

                await _interactionService.CreateInteractionAsync(interaction);
                return RedirectToAction("Details", "Customer", new { id = model.CustomerId });
            }

            // If validation fails, redirect back to customer details page
            // Store validation errors in TempData and show the form
            foreach (var error in ModelState)
            {
                foreach (var errorMessage in error.Value.Errors)
                {
                    TempData[$"Error_{error.Key}"] = errorMessage.ErrorMessage;
                }
            }
            TempData["ShowInteractionForm"] = true;
            TempData["InteractionFormData"] = System.Text.Json.JsonSerializer.Serialize(model);
            return RedirectToAction("Details", "Customer", new { id = model.CustomerId });
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Edit(int Id, int CustomerId, int InteractionType, DateTime InteractionDate, string? Notes)
        {
            var userId = _userManager.GetUserId(User);
            if (userId == null)
            {
                return Unauthorized();
            }

            var isAdmin = User.IsInRole("Admin");

            var interaction = new Interaction
            {
                Id = Id,
                CustomerId = CustomerId,
                InteractionType = (InteractionType)InteractionType,
                InteractionDate = InteractionDate,
                Notes = Notes
            };

            Interaction? updatedInteraction;
            if (isAdmin)
            {
                updatedInteraction = await _interactionService.UpdateInteractionForAdminAsync(interaction);
            }
            else
            {
                updatedInteraction = await _interactionService.UpdateInteractionAsync(interaction, userId);
            }

            if (updatedInteraction == null)
            {
                return NotFound();
            }

            return RedirectToAction("Details", "Customer", new { id = CustomerId });
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Delete(int id)
        {
            var userId = _userManager.GetUserId(User);
            if (userId == null)
            {
                return Unauthorized();
            }

            var isAdmin = User.IsInRole("Admin");

            // Get interaction to find customer ID before deletion
            Interaction? interaction;
            if (isAdmin)
            {
                interaction = await _interactionService.GetInteractionByIdForAdminAsync(id);
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

            bool result;
            if (isAdmin)
            {
                result = await _interactionService.DeleteInteractionForAdminAsync(id);
            }
            else
            {
                result = await _interactionService.DeleteInteractionAsync(id, userId);
            }

            if (!result)
            {
                return NotFound();
            }

            return RedirectToAction("Details", "Customer", new { id = customerId });
        }
    }
}

