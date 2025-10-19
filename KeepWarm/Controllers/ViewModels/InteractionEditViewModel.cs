using System.ComponentModel.DataAnnotations;
using KeepWarm.Helpers;

namespace KeepWarm.Controllers.ViewModels
{
    public class InteractionEditViewModel
    {
        public int Id { get; set; }

        [Required]
        public int CustomerId { get; set; }

        [Required(ErrorMessage = "Interaktionstyp är obligatorisk")]
        [StringLength(50, ErrorMessage = "Interaktionstyp får inte vara längre än 50 tecken")]
        public string InteractionType { get; set; } = string.Empty;

        [Required(ErrorMessage = "Beskrivning är obligatorisk")]
        [StringLength(500, ErrorMessage = "Beskrivning får inte vara längre än 500 tecken")]
        public string Description { get; set; } = string.Empty;

        [Required(ErrorMessage = "Datum är obligatoriskt")]
        public DateTime InteractionDate { get; set; } = DateTimeHelper.FormatToMinutePrecision(DateTime.Now);

        // Lista med tillgängliga interaktionstyper
        public List<string> AvailableInteractionTypes => new List<string>
        {
            "Telefonsamtal",
            "Fysiskt möte",
            "Videomöte",
            "LinkedIn",
            "SMS",
            "Mail"
        };
    }
}
