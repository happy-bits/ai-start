using System.ComponentModel.DataAnnotations;

namespace KeepWarm.Controllers.ViewModels
{
    public class EditUserViewModel
    {
        [Required]
        public string Id { get; set; } = string.Empty;

        [Required(ErrorMessage = "Förnamn är obligatoriskt")]
        [StringLength(100, ErrorMessage = "Förnamn får inte vara längre än 100 tecken")]
        [Display(Name = "Förnamn")]
        public string FirstName { get; set; } = string.Empty;

        [Required(ErrorMessage = "Efternamn är obligatoriskt")]
        [StringLength(100, ErrorMessage = "Efternamn får inte vara längre än 100 tecken")]
        [Display(Name = "Efternamn")]
        public string LastName { get; set; } = string.Empty;

        [Required(ErrorMessage = "E-post är obligatoriskt")]
        [EmailAddress(ErrorMessage = "Ogiltig e-postadress")]
        [StringLength(255, ErrorMessage = "E-post får inte vara längre än 255 tecken")]
        [Display(Name = "E-post")]
        public string Email { get; set; } = string.Empty;

        [StringLength(20, ErrorMessage = "Telefonnummer får inte vara längre än 20 tecken")]
        [Display(Name = "Telefonnummer")]
        public string? PhoneNumber { get; set; }

        [Display(Name = "Roll")]
        public string Role { get; set; } = string.Empty;
    }
}
