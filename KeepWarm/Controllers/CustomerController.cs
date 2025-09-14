using KeepWarm.Controllers.ViewModels;
using KeepWarm.Models;
using KeepWarm.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;

namespace KeepWarm.Controllers
{
    [Authorize]
    public class CustomerController : Controller
    {
        private readonly ICustomerService _customerService;
        private readonly IInteractionService _interactionService;
        private readonly UserManager<ApplicationUser> _userManager;

        public CustomerController(ICustomerService customerService, IInteractionService interactionService, UserManager<ApplicationUser> userManager)
        {
            _customerService = customerService;
            _interactionService = interactionService;
            _userManager = userManager;
        }

        [HttpGet]
        public async Task<IActionResult> Index()
        {
            var userId = _userManager.GetUserId(User);
            if (userId == null)
            {
                return Unauthorized();
            }

            var isAdmin = User.IsInRole("Admin");

            IEnumerable<Customer> customers;
            if (isAdmin)
            {
                customers = await _customerService.GetAllCustomersForAdminAsync();
            }
            else
            {
                customers = await _customerService.GetAllCustomersAsync(userId);
            }

            return View(customers);
        }

        [HttpGet]
        public async Task<IActionResult> Details(int id)
        {
            var userId = _userManager.GetUserId(User);
            if (userId == null)
            {
                return Unauthorized();
            }

            var isAdmin = User.IsInRole("Admin");

            Customer? customer;
            if (isAdmin)
            {
                customer = await _customerService.GetCustomerByIdForAdminAsync(id);
            }
            else
            {
                customer = await _customerService.GetCustomerByIdAsync(id, userId);
            }

            if (customer == null)
            {
                return NotFound();
            }

            // Hämta interaktioner för kunden
            var interactions = await _interactionService.GetInteractionsByCustomerIdAsync(id);
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
                var userId = _userManager.GetUserId(User);
                if (userId == null)
                {
                    return Unauthorized();
                }

                var customer = new Customer
                {
                    FirstName = model.FirstName,
                    LastName = model.LastName,
                    Email = model.Email,
                    Phone = model.Phone,
                    Address = model.Address,
                    City = model.City,
                    PostalCode = model.PostalCode,
                    Country = model.Country,
                    UserId = userId
                };

                await _customerService.CreateCustomerAsync(customer);
                return RedirectToAction(nameof(Index));
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

            var isAdmin = User.IsInRole("Admin");

            Customer? customer;
            if (isAdmin)
            {
                customer = await _customerService.GetCustomerByIdForAdminAsync(id);
            }
            else
            {
                customer = await _customerService.GetCustomerByIdAsync(id, userId);
            }

            if (customer == null)
            {
                return NotFound();
            }

            var model = new CustomerEditViewModel
            {
                Id = customer.Id,
                FirstName = customer.FirstName,
                LastName = customer.LastName,
                Email = customer.Email,
                Phone = customer.Phone,
                Address = customer.Address,
                City = customer.City,
                PostalCode = customer.PostalCode,
                Country = customer.Country
            };

            return View(model);
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Edit(CustomerEditViewModel model)
        {
            if (ModelState.IsValid)
            {
                var userId = _userManager.GetUserId(User);
                if (userId == null)
                {
                    return Unauthorized();
                }

                var isAdmin = User.IsInRole("Admin");

                var customer = new Customer
                {
                    Id = model.Id,
                    FirstName = model.FirstName,
                    LastName = model.LastName,
                    Email = model.Email,
                    Phone = model.Phone,
                    Address = model.Address,
                    City = model.City,
                    PostalCode = model.PostalCode,
                    Country = model.Country
                };

                Customer? updatedCustomer;
                if (isAdmin)
                {
                    updatedCustomer = await _customerService.UpdateCustomerForAdminAsync(customer);
                }
                else
                {
                    updatedCustomer = await _customerService.UpdateCustomerAsync(customer, userId);
                }

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
            var userId = _userManager.GetUserId(User);
            if (userId == null)
            {
                return Unauthorized();
            }

            var isAdmin = User.IsInRole("Admin");

            Customer? customer;
            if (isAdmin)
            {
                customer = await _customerService.GetCustomerByIdForAdminAsync(id);
            }
            else
            {
                customer = await _customerService.GetCustomerByIdAsync(id, userId);
            }

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
            var userId = _userManager.GetUserId(User);
            if (userId == null)
            {
                return Unauthorized();
            }

            var isAdmin = User.IsInRole("Admin");

            bool result;
            if (isAdmin)
            {
                result = await _customerService.DeleteCustomerForAdminAsync(id);
            }
            else
            {
                result = await _customerService.DeleteCustomerAsync(id, userId);
            }

            if (!result)
            {
                return NotFound();
            }

            return RedirectToAction(nameof(Index));
        }
    }
}
