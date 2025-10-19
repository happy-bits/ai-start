using KeepWarm.Controllers.ViewModels;
using KeepWarm.Models;

namespace KeepWarm.Extensions
{
    /// <summary>
    /// Extension methods för mappning mellan ApplicationUser och ViewModels
    /// </summary>
    public static class UserMappingExtensions
    {
        /// <summary>
        /// Mappar en RegisterViewModel till ApplicationUser
        /// </summary>
        public static ApplicationUser ToApplicationUser(this RegisterViewModel model)
        {
            return new ApplicationUser
            {
                UserName = model.Email,
                Email = model.Email,
                FirstName = model.FirstName,
                LastName = model.LastName
            };
        }

        /// <summary>
        /// Mappar en CreateUserViewModel till ApplicationUser
        /// </summary>
        public static ApplicationUser ToApplicationUser(this CreateUserViewModel model)
        {
            return new ApplicationUser
            {
                UserName = model.Email,
                Email = model.Email,
                FirstName = model.FirstName,
                LastName = model.LastName
            };
        }

        /// <summary>
        /// Mappar en ApplicationUser till EditUserViewModel
        /// </summary>
        public static EditUserViewModel ToEditViewModel(this ApplicationUser user, string role)
        {
            return new EditUserViewModel
            {
                Id = user.Id,
                FirstName = user.FirstName ?? string.Empty,
                LastName = user.LastName ?? string.Empty,
                Email = user.Email ?? string.Empty,
                PhoneNumber = user.PhoneNumber,
                Role = role
            };
        }

        /// <summary>
        /// Uppdaterar en ApplicationUser från EditUserViewModel
        /// </summary>
        public static void UpdateFromViewModel(this ApplicationUser user, EditUserViewModel model)
        {
            user.FirstName = model.FirstName;
            user.LastName = model.LastName;
            user.Email = model.Email;
            user.UserName = model.Email; // UserName ska matcha Email
            user.PhoneNumber = model.PhoneNumber;
            user.UpdatedAt = DateTime.UtcNow;
        }
    }
}

