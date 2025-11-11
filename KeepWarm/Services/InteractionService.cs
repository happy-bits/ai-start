using KeepWarm.Data;
using KeepWarm.Models;
using Microsoft.EntityFrameworkCore;

namespace KeepWarm.Services
{
    public class InteractionService : IInteractionService
    {
        private readonly ApplicationDbContext _context;

        public InteractionService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<Interaction>> GetInteractionsByCustomerIdAsync(int customerId, string userId)
        {
            return await _context.Interactions
                .Where(i => i.CustomerId == customerId && i.UserId == userId)
                .OrderByDescending(i => i.InteractionDate)
                .ToListAsync();
        }

        public async Task<IEnumerable<Interaction>> GetInteractionsByCustomerIdForAdminAsync(int customerId)
        {
            return await _context.Interactions
                .Include(i => i.User)
                .Where(i => i.CustomerId == customerId)
                .OrderByDescending(i => i.InteractionDate)
                .ToListAsync();
        }

        public async Task<Interaction?> GetInteractionByIdAsync(int id, string userId)
        {
            return await _context.Interactions
                .FirstOrDefaultAsync(i => i.Id == id && i.UserId == userId);
        }

        public async Task<Interaction?> GetInteractionByIdForAdminAsync(int id)
        {
            return await _context.Interactions
                .Include(i => i.User)
                .FirstOrDefaultAsync(i => i.Id == id);
        }

        public async Task<Interaction> CreateInteractionAsync(Interaction interaction)
        {
            interaction.CreatedAt = DateTime.UtcNow;
            interaction.UpdatedAt = DateTime.UtcNow;

            _context.Interactions.Add(interaction);
            await _context.SaveChangesAsync();
            return interaction;
        }

        public async Task<Interaction?> UpdateInteractionAsync(Interaction interaction, string userId)
        {
            var existingInteraction = await GetInteractionByIdAsync(interaction.Id, userId);
            if (existingInteraction == null)
                return null;

            existingInteraction.InteractionType = interaction.InteractionType;
            existingInteraction.InteractionDate = interaction.InteractionDate;
            existingInteraction.Notes = interaction.Notes;
            existingInteraction.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return existingInteraction;
        }

        public async Task<Interaction?> UpdateInteractionForAdminAsync(Interaction interaction)
        {
            var existingInteraction = await GetInteractionByIdForAdminAsync(interaction.Id);
            if (existingInteraction == null)
                return null;

            existingInteraction.InteractionType = interaction.InteractionType;
            existingInteraction.InteractionDate = interaction.InteractionDate;
            existingInteraction.Notes = interaction.Notes;
            existingInteraction.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return existingInteraction;
        }

        public async Task<bool> DeleteInteractionAsync(int id, string userId)
        {
            var interaction = await GetInteractionByIdAsync(id, userId);
            if (interaction == null)
                return false;

            _context.Interactions.Remove(interaction);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> DeleteInteractionForAdminAsync(int id)
        {
            var interaction = await GetInteractionByIdForAdminAsync(id);
            if (interaction == null)
                return false;

            _context.Interactions.Remove(interaction);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> InteractionBelongsToUserAsync(int id, string userId)
        {
            return await _context.Interactions.AnyAsync(i => i.Id == id && i.UserId == userId);
        }
    }
}

