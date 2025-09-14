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

        public async Task<bool> CreateInteractionAsync(Interaction interaction)
        {
            try
            {
                interaction.CreatedAt = DateTime.UtcNow;
                interaction.UpdatedAt = DateTime.UtcNow;

                _context.Interactions.Add(interaction);
                await _context.SaveChangesAsync();
                return true;
            }
            catch
            {
                return false;
            }
        }

        public async Task<IEnumerable<Interaction>> GetInteractionsByCustomerIdAsync(int customerId)
        {
            return await _context.Interactions
                .Where(i => i.CustomerId == customerId)
                .OrderByDescending(i => i.InteractionDate)
                .ToListAsync();
        }

        public async Task<IEnumerable<Interaction>> GetInteractionsByUserIdAsync(string userId)
        {
            return await _context.Interactions
                .Where(i => i.UserId == userId)
                .OrderByDescending(i => i.InteractionDate)
                .ToListAsync();
        }

        public async Task<Interaction?> GetInteractionByIdAsync(int id)
        {
            return await _context.Interactions
                .Include(i => i.Customer)
                .Include(i => i.User)
                .FirstOrDefaultAsync(i => i.Id == id);
        }

        public async Task<bool> UpdateInteractionAsync(Interaction interaction)
        {
            try
            {
                interaction.UpdatedAt = DateTime.UtcNow;
                _context.Interactions.Update(interaction);
                await _context.SaveChangesAsync();
                return true;
            }
            catch
            {
                return false;
            }
        }

        public async Task<bool> DeleteInteractionAsync(int id)
        {
            try
            {
                var interaction = await _context.Interactions.FindAsync(id);
                if (interaction == null)
                    return false;

                _context.Interactions.Remove(interaction);
                await _context.SaveChangesAsync();
                return true;
            }
            catch
            {
                return false;
            }
        }

        public async Task<IEnumerable<Interaction>> GetAllInteractionsForAdminAsync()
        {
            return await _context.Interactions
                .Include(i => i.Customer)
                .Include(i => i.User)
                .OrderByDescending(i => i.InteractionDate)
                .ToListAsync();
        }
    }
}
