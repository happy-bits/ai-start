using System.ComponentModel.DataAnnotations;
using KeepWarm.Models;

namespace KeepWarm.Controllers.ViewModels
{
    public class InteractionEditViewModel
    {
        [Required]
        public int Id { get; set; }

        [Required]
        public int CustomerId { get; set; }

        [Required(ErrorMessage = "Interaktionstyp är obligatoriskt")]
        [Display(Name = "Typ")]
        public InteractionType InteractionType { get; set; }

        [Required(ErrorMessage = "Datum och tid är obligatoriskt")]
        [Display(Name = "Datum och tid")]
        public DateTime InteractionDate { get; set; }

        [StringLength(2000, ErrorMessage = "Anteckningar får inte vara längre än 2000 tecken")]
        [Display(Name = "Anteckningar")]
        public string? Notes { get; set; }
    }
}

