using KeepWarm.Models;

namespace KeepWarm.Services
{
    public interface IInteractionService
    {
        Task<IEnumerable<Interaction>> GetInteractionsByCustomerIdAsync(int customerId, string userId);
        Task<IEnumerable<Interaction>> GetInteractionsByCustomerIdForAdminAsync(int customerId);
        Task<Interaction?> GetInteractionByIdAsync(int id, string userId);
        Task<Interaction?> GetInteractionByIdForAdminAsync(int id);
        Task<Interaction> CreateInteractionAsync(Interaction interaction);
        Task<Interaction?> UpdateInteractionAsync(Interaction interaction, string userId);
        Task<Interaction?> UpdateInteractionForAdminAsync(Interaction interaction);
        Task<bool> DeleteInteractionAsync(int id, string userId);
        Task<bool> DeleteInteractionForAdminAsync(int id);
        Task<bool> InteractionBelongsToUserAsync(int id, string userId);
    }
}

