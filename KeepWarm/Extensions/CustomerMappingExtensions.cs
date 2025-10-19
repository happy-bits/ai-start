using KeepWarm.Controllers.ViewModels;
using KeepWarm.Models;

namespace KeepWarm.Extensions
{
    /// <summary>
    /// Extension methods för mappning mellan Customer och ViewModels
    /// </summary>
    public static class CustomerMappingExtensions
    {
        /// <summary>
        /// Mappar en Customer till CustomerEditViewModel
        /// </summary>
        public static CustomerEditViewModel ToEditViewModel(this Customer customer)
        {
            return new CustomerEditViewModel
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
        }

        /// <summary>
        /// Mappar en CustomerEditViewModel till Customer
        /// </summary>
        public static Customer ToCustomer(this CustomerEditViewModel viewModel)
        {
            return new Customer
            {
                Id = viewModel.Id,
                FirstName = viewModel.FirstName,
                LastName = viewModel.LastName,
                Email = viewModel.Email,
                Phone = viewModel.Phone,
                Address = viewModel.Address,
                City = viewModel.City,
                PostalCode = viewModel.PostalCode,
                Country = viewModel.Country
            };
        }

        /// <summary>
        /// Mappar en CustomerCreateViewModel till Customer
        /// </summary>
        public static Customer ToCustomer(this CustomerCreateViewModel viewModel, string userId)
        {
            return new Customer
            {
                FirstName = viewModel.FirstName,
                LastName = viewModel.LastName,
                Email = viewModel.Email,
                Phone = viewModel.Phone,
                Address = viewModel.Address,
                City = viewModel.City,
                PostalCode = viewModel.PostalCode,
                Country = viewModel.Country,
                UserId = userId
            };
        }
    }
}

