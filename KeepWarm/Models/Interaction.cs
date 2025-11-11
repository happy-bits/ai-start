using System.ComponentModel.DataAnnotations;

namespace KeepWarm.Models
{
    public class Interaction
    {
        public int Id { get; set; }

        [Required]
        public int CustomerId { get; set; }

        [Required]
        public InteractionType InteractionType { get; set; }

        [Required]
        public DateTime InteractionDate { get; set; }

        [StringLength(2000)]
        public string? Notes { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        // Foreign key to ApplicationUser (who logged the interaction)
        [Required]
        public string UserId { get; set; } = string.Empty;

        // Navigation properties
        public Customer? Customer { get; set; }
        public ApplicationUser? User { get; set; }
    }
}

