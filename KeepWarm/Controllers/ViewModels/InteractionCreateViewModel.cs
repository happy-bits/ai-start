using System.ComponentModel.DataAnnotations;
using KeepWarm.Helpers;
using KeepWarm.Models;

namespace KeepWarm.Controllers.ViewModels
{
    public class InteractionCreateViewModel
    {
        [Required]
        public int CustomerId { get; set; }

        [Required(ErrorMessage = "Interaktionstyp är obligatorisk")]
        [StringLength(50, ErrorMessage = "Interaktionstyp får inte vara längre än 50 tecken")]
        public string InteractionType { get; set; } = string.Empty;

        [Required(ErrorMessage = "Beskrivning är obligatorisk")]
        [StringLength(500, ErrorMessage = "Beskrivning får inte vara längre än 500 tecken")]
        public string Description { get; set; } = string.Empty;

        [Required(ErrorMessage = "Datum är obligatoriskt")]
        public DateTime InteractionDate { get; set; } = DateTimeHelper.FormatToMinutePrecision(DateTime.UtcNow);

        // Återkomstdatum för säljaren (kan vara null)
        public DateOnly? FollowUpDate { get; set; } = DateOnly.FromDateTime(DateTime.Today.AddDays(3));

        // Lista med tillgängliga interaktionstyper
        public List<string> AvailableInteractionTypes => InteractionTypes.All;
    }
}
