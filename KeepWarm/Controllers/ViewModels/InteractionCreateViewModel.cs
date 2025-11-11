using System.ComponentModel.DataAnnotations;
using KeepWarm.Models;

namespace KeepWarm.Controllers.ViewModels
{
    public class InteractionCreateViewModel
    {
        [Required(ErrorMessage = "Kund-ID är obligatoriskt")]
        public int CustomerId { get; set; }

        [Required(ErrorMessage = "Interaktionstyp är obligatoriskt")]
        [Display(Name = "Typ")]
        public InteractionType InteractionType { get; set; }

        [Required(ErrorMessage = "Datum och tid är obligatoriskt")]
        [Display(Name = "Datum och tid")]
        public DateTime InteractionDate { get; set; } = DateTime.Now;

        [StringLength(2000, ErrorMessage = "Anteckningar får inte vara längre än 2000 tecken")]
        [Display(Name = "Anteckningar")]
        public string? Notes { get; set; }
    }
}

