using KeepWarm.Controllers.ViewModels;
using KeepWarm.Extensions;
using KeepWarm.Models;
using KeepWarm.Services;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;

namespace KeepWarm.Controllers
{
    public class CustomerController : BaseAuthenticatedController
    {
        private readonly ICustomerService _customerService;
        private readonly IInteractionService _interactionService;

        public CustomerController(
            ICustomerService customerService, 
            IInteractionService interactionService, 
            UserManager<ApplicationUser> userManager) 
            : base(userManager)
        {
            _customerService = customerService;
            _interactionService = interactionService;
        }

        [HttpGet]
        public async Task<IActionResult> Index()
        {
            var userId = GetAuthenticatedUserId();
            if (userId == null)
            {
                return Unauthorized();
            }

            var customers = await ExecuteWithRoleCheck(
                adminAction: async () => await _customerService.GetAllCustomersForAdminAsync(),
                userAction: async () => await _customerService.GetAllCustomersAsync(userId)
            );

            // Sortera kunder på NextFollowUpDate (null sist)
            customers = customers.OrderBy(c => c.NextFollowUpDate ?? DateOnly.MaxValue);

            return View(customers);
        }

        [HttpGet]
        public async Task<IActionResult> Details(int id)
        {
            var userId = GetAuthenticatedUserId();
            if (userId == null)
            {
                return Unauthorized();
            }

            var customer = await ExecuteWithRoleCheck(
                adminAction: async () => await _customerService.GetCustomerByIdForAdminAsync(id),
                userAction: async () => await _customerService.GetCustomerByIdAsync(id, userId)
            );

            if (customer == null)
            {
                return NotFound();
            }

            // Hämta interaktioner för kunden
            IEnumerable<Interaction> interactions;
            if (IsCurrentUserAdmin())
            {
                // Admin använder osäker metod för att hämta alla kundens interaktioner
                interactions = (await _interactionService.GetAllInteractionsForAdminAsync())
                    .Where(i => i.CustomerId == id);
            }
            else
            {
                interactions = await _interactionService.GetInteractionsByCustomerIdAsync(id, userId);
            }
            
            var orderedInteractions = interactions.OrderByDescending(i => i.InteractionDate);

            // Lägg till interaktionsdata i ViewData
            ViewData["Interactions"] = orderedInteractions;
            ViewData["InteractionCount"] = interactions.Count();

            return View(customer);
        }

        [HttpGet]
        public IActionResult Create()
        {
            return View();
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Create(CustomerCreateViewModel model)
        {
            if (ModelState.IsValid)
            {
                var userId = GetAuthenticatedUserId();
                if (userId == null)
                {
                    return Unauthorized();
                }

                var customer = model.ToCustomer(userId);
                await _customerService.CreateCustomerAsync(customer);
                return RedirectToAction(nameof(Index));
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

            var customer = await ExecuteWithRoleCheck(
                adminAction: async () => await _customerService.GetCustomerByIdForAdminAsync(id),
                userAction: async () => await _customerService.GetCustomerByIdAsync(id, userId)
            );

            if (customer == null)
            {
                return NotFound();
            }

            var model = customer.ToEditViewModel();
            return View(model);
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Edit(CustomerEditViewModel model)
        {
            if (ModelState.IsValid)
            {
                var userId = GetAuthenticatedUserId();
                if (userId == null)
                {
                    return Unauthorized();
                }

                var customer = model.ToCustomer();

                var updatedCustomer = await ExecuteWithRoleCheck(
                    adminAction: async () => await _customerService.UpdateCustomerForAdminAsync(customer),
                    userAction: async () => await _customerService.UpdateCustomerAsync(customer, userId)
                );

                if (updatedCustomer == null)
                {
                    return NotFound();
                }

                return RedirectToAction(nameof(Index));
            }

            return View(model);
        }

        [HttpGet]
        public async Task<IActionResult> Delete(int id)
        {
            var userId = GetAuthenticatedUserId();
            if (userId == null)
            {
                return Unauthorized();
            }

            var customer = await ExecuteWithRoleCheck(
                adminAction: async () => await _customerService.GetCustomerByIdForAdminAsync(id),
                userAction: async () => await _customerService.GetCustomerByIdAsync(id, userId)
            );

            if (customer == null)
            {
                return NotFound();
            }

            return View(customer);
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

            var result = await ExecuteWithRoleCheck(
                adminAction: async () => await _customerService.DeleteCustomerForAdminAsync(id),
                userAction: async () => await _customerService.DeleteCustomerAsync(id, userId)
            );

            if (!result)
            {
                return NotFound();
            }

            return RedirectToAction(nameof(Index));
        }
    }
}
