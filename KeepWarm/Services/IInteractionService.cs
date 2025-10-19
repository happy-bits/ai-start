using KeepWarm.Models;

namespace KeepWarm.Services
{
    public interface IInteractionService
    {
        Task<bool> CreateInteractionAsync(Interaction interaction);
        
        // Säkra metoder med userId-kontroll för standardanvändare
        Task<IEnumerable<Interaction>> GetInteractionsByCustomerIdAsync(int customerId, string userId);
        Task<Interaction?> GetInteractionByIdAsync(int id, string userId);
        Task<bool> UpdateInteractionAsync(Interaction interaction, string userId);
        Task<bool> DeleteInteractionAsync(int id, string userId);
        
        // Osäkra metoder för intern användning och admin
        Task<IEnumerable<Interaction>> GetInteractionsByUserIdAsync(string userId);
        Task<Interaction?> GetInteractionByIdAsync(int id);
        Task<IEnumerable<Interaction>> GetAllInteractionsForAdminAsync();
    }
}
