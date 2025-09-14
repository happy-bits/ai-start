using KeepWarm.Data;
using KeepWarm.Models;
using Microsoft.EntityFrameworkCore;

namespace KeepWarm.Services
{
    public class CustomerService : ICustomerService
    {
        private readonly ApplicationDbContext _context;

        public CustomerService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<Customer>> GetAllCustomersAsync(string userId)
        {
            return await _context.Customers
                .Where(c => c.UserId == userId)
                .OrderBy(c => c.LastName)
                .ThenBy(c => c.FirstName)
                .ToListAsync();
        }

        public async Task<IEnumerable<Customer>> GetAllCustomersForAdminAsync()
        {
            return await _context.Customers
                .Include(c => c.User)
                .OrderBy(c => c.LastName)
                .ThenBy(c => c.FirstName)
                .ToListAsync();
        }

        public async Task<Customer?> GetCustomerByIdAsync(int id, string userId)
        {
            return await _context.Customers
                .FirstOrDefaultAsync(c => c.Id == id && c.UserId == userId);
        }

        public async Task<Customer?> GetCustomerByIdForAdminAsync(int id)
        {
            return await _context.Customers
                .Include(c => c.User)
                .FirstOrDefaultAsync(c => c.Id == id);
        }

        public async Task<Customer> CreateCustomerAsync(Customer customer)
        {
            customer.CreatedAt = DateTime.UtcNow;
            customer.UpdatedAt = DateTime.UtcNow;

            _context.Customers.Add(customer);
            await _context.SaveChangesAsync();
            return customer;
        }

        public async Task<Customer?> UpdateCustomerAsync(Customer customer, string userId)
        {
            var existingCustomer = await GetCustomerByIdAsync(customer.Id, userId);
            if (existingCustomer == null)
                return null;

            existingCustomer.FirstName = customer.FirstName;
            existingCustomer.LastName = customer.LastName;
            existingCustomer.Email = customer.Email;
            existingCustomer.Phone = customer.Phone;
            existingCustomer.Address = customer.Address;
            existingCustomer.City = customer.City;
            existingCustomer.PostalCode = customer.PostalCode;
            existingCustomer.Country = customer.Country;
            existingCustomer.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return existingCustomer;
        }

        public async Task<Customer?> UpdateCustomerForAdminAsync(Customer customer)
        {
            var existingCustomer = await GetCustomerByIdForAdminAsync(customer.Id);
            if (existingCustomer == null)
                return null;

            existingCustomer.FirstName = customer.FirstName;
            existingCustomer.LastName = customer.LastName;
            existingCustomer.Email = customer.Email;
            existingCustomer.Phone = customer.Phone;
            existingCustomer.Address = customer.Address;
            existingCustomer.City = customer.City;
            existingCustomer.PostalCode = customer.PostalCode;
            existingCustomer.Country = customer.Country;
            existingCustomer.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return existingCustomer;
        }

        public async Task<bool> DeleteCustomerAsync(int id, string userId)
        {
            var customer = await GetCustomerByIdAsync(id, userId);
            if (customer == null)
                return false;

            _context.Customers.Remove(customer);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> DeleteCustomerForAdminAsync(int id)
        {
            var customer = await GetCustomerByIdForAdminAsync(id);
            if (customer == null)
                return false;

            _context.Customers.Remove(customer);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> CustomerExistsAsync(int id)
        {
            return await _context.Customers.AnyAsync(c => c.Id == id);
        }

        public async Task<bool> CustomerBelongsToUserAsync(int id, string userId)
        {
            return await _context.Customers.AnyAsync(c => c.Id == id && c.UserId == userId);
        }

        public async Task SetCustomersUserIdToNullAsync(string userId)
        {
            var customers = await _context.Customers
                .Where(c => c.UserId == userId)
                .ToListAsync();

            foreach (var customer in customers)
            {
                customer.UserId = null;
                customer.UpdatedAt = DateTime.UtcNow;
            }

            await _context.SaveChangesAsync();
        }
    }
}
