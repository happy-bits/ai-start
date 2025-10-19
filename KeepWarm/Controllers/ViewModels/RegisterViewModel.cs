using System.ComponentModel.DataAnnotations;

namespace KeepWarm.Controllers.ViewModels
{
    public class RegisterViewModel
    {
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

        [Required(ErrorMessage = "Lösenord är obligatoriskt")]
        [StringLength(100, ErrorMessage = "Lösenordet måste vara minst {2} och högst {1} tecken långt.", MinimumLength = 6)]
        [DataType(DataType.Password)]
        [Display(Name = "Lösenord")]
        public string Password { get; set; } = string.Empty;

        [DataType(DataType.Password)]
        [Display(Name = "Bekräfta lösenord")]
        [Compare("Password", ErrorMessage = "Lösenorden matchar inte.")]
        public string ConfirmPassword { get; set; } = string.Empty;
    }
}
