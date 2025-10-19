using KeepWarm.Data;
using KeepWarm.Helpers;
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
                // Formatera datum till minutprecision
                interaction.InteractionDate = DateTimeHelper.FormatToMinutePrecision(interaction.InteractionDate);
                interaction.CreatedAt = DateTimeHelper.FormatToMinutePrecision(DateTime.UtcNow);
                interaction.UpdatedAt = DateTimeHelper.FormatToMinutePrecision(DateTime.UtcNow);

                _context.Interactions.Add(interaction);
                
                // Uppdatera Customer.NextFollowUpDate med valt datum
                var customer = await _context.Customers.FindAsync(interaction.CustomerId);
                if (customer != null)
                {
                    customer.NextFollowUpDate = interaction.FollowUpDate;
                }
                
                await _context.SaveChangesAsync();
                return true;
            }
            catch
            {
                return false;
            }
        }

        // Säker metod med userId-kontroll
        public async Task<IEnumerable<Interaction>> GetInteractionsByCustomerIdAsync(int customerId, string userId)
        {
            // Kontrollera att kunden tillhör användaren
            var customer = await _context.Customers
                .FirstOrDefaultAsync(c => c.Id == customerId && c.UserId == userId);
            
            if (customer == null)
                return Enumerable.Empty<Interaction>();

            return await _context.Interactions
                .Where(i => i.CustomerId == customerId && i.UserId == userId)
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

        // Säker metod med userId-kontroll
        public async Task<Interaction?> GetInteractionByIdAsync(int id, string userId)
        {
            return await _context.Interactions
                .Include(i => i.Customer)
                .Include(i => i.User)
                .FirstOrDefaultAsync(i => i.Id == id && i.UserId == userId);
        }

        // Admin-metod utan userId-kontroll
        public async Task<Interaction?> GetInteractionByIdForAdminAsync(int id)
        {
            return await _context.Interactions
                .Include(i => i.Customer)
                .Include(i => i.User)
                .FirstOrDefaultAsync(i => i.Id == id);
        }

        // Säker metod med userId-kontroll
        public async Task<bool> UpdateInteractionAsync(Interaction interaction, string userId)
        {
            try
            {
                // Kontrollera att användaren äger interaktionen
                var existingInteraction = await _context.Interactions
                    .Include(i => i.Customer)
                    .FirstOrDefaultAsync(i => i.Id == interaction.Id && i.UserId == userId);
                
                if (existingInteraction == null)
                    return false;

                // Formatera datum till minutprecision
                interaction.InteractionDate = DateTimeHelper.FormatToMinutePrecision(interaction.InteractionDate);
                interaction.UpdatedAt = DateTimeHelper.FormatToMinutePrecision(DateTime.UtcNow);
                
                _context.Interactions.Update(interaction);
                
                // Uppdatera Customer.NextFollowUpDate om FollowUpDate har ändrats
                var customer = await _context.Customers.FindAsync(interaction.CustomerId);
                if (customer != null)
                {
                    customer.NextFollowUpDate = interaction.FollowUpDate;
                }
                
                await _context.SaveChangesAsync();
                return true;
            }
            catch
            {
                return false;
            }
        }

        // Säker metod med userId-kontroll
        public async Task<bool> DeleteInteractionAsync(int id, string userId)
        {
            try
            {
                var interaction = await _context.Interactions
                    .Include(i => i.Customer)
                    .FirstOrDefaultAsync(i => i.Id == id && i.UserId == userId);
                
                if (interaction == null)
                    return false;

                var customerId = interaction.CustomerId;
                
                _context.Interactions.Remove(interaction);
                await _context.SaveChangesAsync();
                
                // Räkna om Customer.NextFollowUpDate
                await RecalculateCustomerNextFollowUpDateAsync(customerId);
                
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

        // Privat hjälpmetod för att räkna om nästa uppföljningsdatum
        private async Task RecalculateCustomerNextFollowUpDateAsync(int customerId)
        {
            var customer = await _context.Customers.FindAsync(customerId);
            if (customer == null)
                return;

            // Hitta tidigaste framtida uppföljningsdatum bland kvarvarande interaktioner
            var nextFollowUp = await _context.Interactions
                .Where(i => i.CustomerId == customerId && i.FollowUpDate != null)
                .OrderBy(i => i.FollowUpDate)
                .Select(i => i.FollowUpDate)
                .FirstOrDefaultAsync();

            customer.NextFollowUpDate = nextFollowUp;
            await _context.SaveChangesAsync();
        }
    }
}
