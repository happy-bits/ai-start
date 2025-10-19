using KeepWarm.Models;

namespace KeepWarm.Services
{
    public interface IIdentityService
    {
        Task<bool> CreateUserAsync(ApplicationUser user, string password);
        Task<bool> CreateRoleAsync(string roleName);
        Task<bool> AssignRoleToUserAsync(string userId, string roleName);
        Task<bool> RemoveRoleFromUserAsync(string userId, string roleName);
        Task<IList<string>> GetUserRolesAsync(string userId);
        Task<bool> IsUserInRoleAsync(string userId, string roleName);
        Task<ApplicationUser?> FindUserByEmailAsync(string email);
        Task<ApplicationUser?> FindUserByIdAsync(string userId);
        Task<bool> ValidatePasswordAsync(ApplicationUser user, string password);
        Task<bool> UpdateUserAsync(ApplicationUser user);
        Task<bool> DeleteUserAsync(string userId);
        Task<IEnumerable<ApplicationUser>> GetAllUsersAsync();
        Task<bool> InitializeRolesAsync();
        Task<IEnumerable<Customer>> GetAllCustomersAsync(string userId);
        Task SetCustomersUserIdToNullAsync(string userId);
    }
}
