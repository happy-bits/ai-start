using KeepWarm.Models;

namespace KeepWarm.Services
{
    public interface IInteractionService
    {
        Task<bool> CreateInteractionAsync(Interaction interaction);
        Task<IEnumerable<Interaction>> GetInteractionsByCustomerIdAsync(int customerId);
        Task<IEnumerable<Interaction>> GetInteractionsByUserIdAsync(string userId);
        Task<Interaction?> GetInteractionByIdAsync(int id);
        Task<bool> UpdateInteractionAsync(Interaction interaction);
        Task<bool> DeleteInteractionAsync(int id);
        Task<IEnumerable<Interaction>> GetAllInteractionsForAdminAsync();
    }
}
