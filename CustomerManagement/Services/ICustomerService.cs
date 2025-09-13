using CustomerManagement.Models;

namespace CustomerManagement.Services
{
    public interface ICustomerService
    {
        Task<IEnumerable<Customer>> GetAllCustomersAsync(string userId);
        Task<IEnumerable<Customer>> GetAllCustomersForAdminAsync();
        Task<Customer?> GetCustomerByIdAsync(int id, string userId);
        Task<Customer?> GetCustomerByIdForAdminAsync(int id);
        Task<Customer> CreateCustomerAsync(Customer customer);
        Task<Customer?> UpdateCustomerAsync(Customer customer, string userId);
        Task<Customer?> UpdateCustomerForAdminAsync(Customer customer);
        Task<bool> DeleteCustomerAsync(int id, string userId);
        Task<bool> DeleteCustomerForAdminAsync(int id);
        Task<bool> CustomerExistsAsync(int id);
        Task<bool> CustomerBelongsToUserAsync(int id, string userId);
    }
}
